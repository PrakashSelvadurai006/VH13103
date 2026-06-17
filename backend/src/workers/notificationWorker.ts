import { Worker, Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '@prisma/client';
import prisma from '../prisma/client';
import { connectionOptions, invalidateStudentCache } from '../utils/redis';
import { BULK_NOTIFICATION_QUEUE } from '../queues/notificationQueue';
import { sendRealTimeNotification } from '../services/SocketService';
import { emailService } from '../services/EmailService';
import { pushService } from '../services/PushService';

/**
 * Worker class to consume jobs from the bulk-notifications queue.
 */
export const notificationWorker = new Worker(
  BULK_NOTIFICATION_QUEUE,
  async (job: Job) => {
    const { type, message, studentIds } = job.data as {
      type: string;
      message: string;
      studentIds: number[];
    };

    console.log(`[Worker] Started processing Job ${job.id} with ${studentIds.length} students.`);

    if (!studentIds || studentIds.length === 0) {
      console.log(`[Worker] No students to notify for Job ${job.id}`);
      return { success: true, count: 0 };
    }

    try {
      // 1. Fetch student profiles in batch for simulator context (names and emails)
      const students = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const studentMap = new Map(students.map((s) => [s.id, s]));

      // 2. Map notification objects with pre-generated UUIDs
      const notificationsData = studentIds.map((studentId) => ({
        id: uuidv4(),
        studentId,
        type: type as NotificationType,
        message,
        isRead: false,
        createdAt: new Date(),
      }));

      // 3. Batch DB insert (highly optimized single-query execution)
      await prisma.notification.createMany({
        data: notificationsData,
      });

      console.log(`[Worker] Saved ${notificationsData.length} records to PostgreSQL.`);

      // 4. Send notifications to simulators, real-time socket, and clear Redis cache
      for (const notif of notificationsData) {
        // A. Clear Redis query cache for the affected student
        await invalidateStudentCache(notif.studentId);

        // B. Dispatch websocket message if student is active
        sendRealTimeNotification(notif.studentId, notif);

        // C. Dispatch simulations
        const profile = studentMap.get(notif.studentId);
        if (profile) {
          // Trigger email simulator
          emailService.sendEmail(
            profile.email,
            `Placement Update: ${type}`,
            message
          );
        }
        // Trigger push notifications
        pushService.sendPushNotification(notif.studentId, message);
      }

      console.log(`[Worker] Completed processing Job ${job.id}`);
      return { success: true, count: notificationsData.length };
    } catch (error: any) {
      console.error(`[Worker] Error processing Job ${job.id}:`, error);
      // Re-throw so BullMQ triggers its retry/exponential backoff mechanics
      throw error;
    }
  },
  {
    connection: connectionOptions,
    concurrency: 5, // Process up to 5 batches in parallel
  }
);

// Listeners for monitoring worker lifecycle and failure audits (DLQ analysis)
notificationWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}. Retaining in queue for DLQ review.`);
});
