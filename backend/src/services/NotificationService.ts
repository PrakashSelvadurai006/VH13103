import { NotificationType } from '@prisma/client';
import { NotificationRepository, NotificationFilters, PaginationOptions } from '../repositories/NotificationRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { getStudentCacheKey, invalidateStudentCache, redis } from '../utils/redis';
import { sendRealTimeNotification } from './SocketService';
import { addBulkNotificationJob } from '../queues/notificationQueue';
import { getTopKNotifications } from '../utils/priorityInbox';

export class NotificationService {
  private repo = new NotificationRepository();
  private studentRepo = new StudentRepository();

  public async getNotifications(filters: NotificationFilters, pagination: PaginationOptions) {
    const isStudentFeed = filters.studentId !== undefined;

    // Retrieve from Redis cache if this is a student feed request
    let cacheKey = '';
    if (isStudentFeed) {
      cacheKey = await getStudentCacheKey(filters.studentId!, { filters, pagination });
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[Cache] HIT for key: ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (err) {
        console.error('Redis cache retrieval error:', err);
      }
      console.log(`[Cache] MISS for key: ${cacheKey}`);
    }

    // Database fetch (explicit column projection inside repository)
    const notifications = await this.repo.findMany(filters, pagination);
    const totalCount = await this.repo.count(filters);

    const result = {
      notifications,
      meta: {
        total: totalCount,
        limit: pagination.limit ?? 10,
        offset: pagination.offset ?? 0,
        cursor: notifications.length > 0 ? notifications[notifications.length - 1].id : null,
      },
    };

    // Cache the query result if it is a student feed
    if (isStudentFeed && cacheKey) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 min TTL
      } catch (err) {
        console.error('Redis cache save error:', err);
      }
    }

    return result;
  }

  public async getNotificationById(id: string) {
    return this.repo.findById(id);
  }

  public async createNotification(data: {
    studentId: number;
    type: NotificationType;
    message: string;
  }) {
    // 1. Check if student exists
    const student = await this.studentRepo.findById(data.studentId);
    if (!student) {
      throw new Error(`Student with ID ${data.studentId} does not exist.`);
    }

    // 2. Persist to DB
    const notification = await this.repo.create(data);

    // 3. Invalidate Redis Cache
    await invalidateStudentCache(data.studentId);

    // 4. Send websocket event
    sendRealTimeNotification(data.studentId, notification);

    return notification;
  }

  public async markAsRead(id: string, isRead = true) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Notification with ID ${id} not found.`);
    }

    const updated = await this.repo.updateReadStatus(id, isRead);

    // Invalidate Redis Cache
    await invalidateStudentCache(updated.studentId);

    return updated;
  }

  public async deleteNotification(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Notification with ID ${id} not found.`);
    }

    const deleted = await this.repo.delete(id);

    // Invalidate Redis Cache
    await invalidateStudentCache(deleted.studentId);

    return deleted;
  }

  /**
   * Stage 5: Enqueue bulk notification for up to 50,000 students.
   * Splits recipients into batches of 5000 to distribute workloads among BullMQ workers.
   */
  public async sendBulkNotification(type: NotificationType, message: string, targetStudentIds?: number[]) {
    let studentIds = targetStudentIds;

    // If no target list is provided, fetch all student IDs from Postgres
    if (!studentIds || studentIds.length === 0) {
      const allStudents = await this.studentRepo.findAll();
      studentIds = allStudents.map((s) => s.id);
    }

    console.log(`[Bulk Dispatch] Initializing bulk notification delivery for ${studentIds.length} students.`);

    // Batching strategy: chunks of 5000 students
    const batchSize = 5000;
    let jobCount = 0;

    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);
      await addBulkNotificationJob({
        type,
        message,
        studentIds: batch,
      });
      jobCount++;
    }

    return {
      success: true,
      jobsEnqueued: jobCount,
      totalStudentsCount: studentIds.length,
      message: `Enqueued ${jobCount} batch jobs to deliver notification to ${studentIds.length} students.`,
    };
  }

  /**
   * Stage 6: Priority Inbox calculations.
   * Fetches latest 500 notifications for a student and runs Min-Heap top-K extraction.
   */
  public async getPriorityInbox(studentId: number) {
    const student = await this.studentRepo.findById(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} does not exist.`);
    }

    // Fetch the recent 500 notifications for the student to sort from
    const feed = await this.repo.findMany(
      { studentId },
      { limit: 500 }
    );

    // Use Min Heap selector
    const topK = getTopKNotifications(feed, 10);

    return topK.map((item) => ({
      score: item.score,
      ...item.notification,
    }));
  }

  /**
   * Stage 3: Optimized query to find students who received placement notifications.
   */
  public async getStudentsWithPlacementNotifications() {
    return this.repo.findStudentsWithPlacementNotificationsRaw();
  }
}
