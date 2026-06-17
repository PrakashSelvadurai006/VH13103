import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check validation results and respond with structured errors if present.
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().map((err) => ({
        field: (err as any).path || 'unknown',
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

export const createNotificationRules = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('studentId must be a positive integer'),
  body('type')
    .isIn(['Event', 'Result', 'Placement'])
    .withMessage('type must be Event, Result, or Placement'),
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('message is required and cannot be empty'),
  validateRequest,
];

export const getNotificationsRules = [
  query('studentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('studentId must be a positive integer')
    .toInt(),
  query('type')
    .optional()
    .isIn(['Event', 'Result', 'Placement'])
    .withMessage('type must be Event, Result, or Placement'),
  query('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean')
    .customSanitizer((val) => val === 'true' || val === true),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer')
    .toInt(),
  query('cursor')
    .optional()
    .isUUID()
    .withMessage('cursor must be a valid UUID string'),
  validateRequest,
];

export const notificationIdParamRules = [
  param('id')
    .isUUID()
    .withMessage('id must be a valid UUID string'),
  validateRequest,
];

export const patchReadRules = [
  param('id')
    .isUUID()
    .withMessage('id must be a valid UUID string'),
  body('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean')
    .toBoolean(),
  validateRequest,
];

export const bulkNotificationRules = [
  body('type')
    .isIn(['Event', 'Result', 'Placement'])
    .withMessage('type must be Event, Result, or Placement'),
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('message is required and cannot be empty'),
  body('studentIds')
    .optional()
    .isArray()
    .withMessage('studentIds must be an array of student IDs'),
  body('studentIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each student ID must be a positive integer'),
  validateRequest,
];
