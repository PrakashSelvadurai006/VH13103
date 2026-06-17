import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/NotificationService';
import { NotificationType } from '@prisma/client';

export class NotificationController {
  private service = new NotificationService();

  public getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, type, isRead, limit, offset, cursor } = req.query;

      const filters = {
        studentId: studentId ? Number(studentId) : undefined,
        type: type ? (type as NotificationType) : undefined,
        isRead: isRead !== undefined ? Boolean(isRead) : undefined,
      };

      const pagination = {
        limit: limit ? Number(limit) : 10,
        offset: offset ? Number(offset) : 0,
        cursor: cursor ? String(cursor) : undefined,
      };

      const result = await this.service.getNotifications(filters, pagination);
      res.status(200).json({
        success: true,
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  public getNotificationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const notification = await this.service.getNotificationById(id);
      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Notification with ID ${id} not found.`,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  public createNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, type, message } = req.body;
      const notification = await this.service.createNotification({
        studentId: Number(studentId),
        type: type as NotificationType,
        message,
      });
      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      if (error.message && error.message.includes('does not exist')) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isRead } = req.body;
      const status = isRead !== undefined ? Boolean(isRead) : true;

      const updated = await this.service.markAsRead(id, status);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  public deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.service.deleteNotification(id);
      res.status(200).json({
        success: true,
        data: deleted,
      });
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  public triggerBulkNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, message, studentIds } = req.body;
      const result = await this.service.sendBulkNotification(
        type as NotificationType,
        message,
        studentIds
      );
      res.status(202).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getPriorityInbox = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const result = await this.service.getPriorityInbox(Number(studentId));
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message && error.message.includes('does not exist')) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  public getPlacementStudents = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const students = await this.service.getStudentsWithPlacementNotifications();
      res.status(200).json({
        success: true,
        data: students,
      });
    } catch (error) {
      next(error);
    }
  };
}
export const notificationController = new NotificationController();
