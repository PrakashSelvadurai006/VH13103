import { Queue } from 'bullmq';
import { connectionOptions } from '../utils/redis';

export const BULK_NOTIFICATION_QUEUE = 'bulk-notifications';

// Set up the BullMQ queue connected to Redis using connectionOptions.
export const notificationQueue = new Queue(BULK_NOTIFICATION_QUEUE, {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Helper to enqueue a batch of notifications.
 */
export async function addBulkNotificationJob(data: {
  type: string;
  message: string;
  studentIds: number[];
}) {
  return notificationQueue.add('send-batch', data);
}
