import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import {
  createNotificationRules,
  getNotificationsRules,
  notificationIdParamRules,
  patchReadRules,
  bulkNotificationRules,
} from '../validators/notificationValidator';

const router = Router();

// Feed fetch and individual creation
router.get('/', getNotificationsRules, notificationController.getNotifications);
router.post('/', createNotificationRules, notificationController.createNotification);

// Stage 5 bulk delivery and Stage 3 optimized SQL fetch
router.post('/bulk', bulkNotificationRules, notificationController.triggerBulkNotification);
router.get('/optimize/placement-students', notificationController.getPlacementStudents);

// Individual status change and deletions
router.get('/:id', notificationIdParamRules, notificationController.getNotificationById);
router.patch('/:id/read', patchReadRules, notificationController.markAsRead);
router.delete('/:id', notificationIdParamRules, notificationController.deleteNotification);

// Stage 6 Priority Inbox fetch
router.get('/student/:studentId/priority', notificationController.getPriorityInbox);

export default router;
