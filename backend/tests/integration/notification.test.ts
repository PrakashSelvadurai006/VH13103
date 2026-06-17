import request from 'supertest';
import prisma from '../../src/prisma/client';
import { app, server } from '../../src/server';

// Mock bullmq globally to prevent live Redis connections during import initialization
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue({ id: 'job-id' }),
      };
    }),
    Worker: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
      };
    }),
  };
});

// Mock the Prisma singleton client to keep integration tests fast and independent
jest.mock('../../src/prisma/client', () => {
  return {
    __esModule: true,
    default: {
      student: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      notification: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
});

// Mock Redis connection completely to avoid hanging test processes
jest.mock('../../src/utils/redis', () => {
  return {
    redis: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn().mockResolvedValue(1),
    },
    getStudentCacheKey: jest.fn().mockResolvedValue('mock-cache-key'),
    invalidateStudentCache: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock Socket.IO broadcasts
jest.mock('../../src/services/SocketService', () => {
  return {
    initSocketIO: jest.fn(),
    sendRealTimeNotification: jest.fn(),
  };
});

// Mock BullMQ worker to avoid listening on live ports
jest.mock('../../src/workers/notificationWorker', () => {
  return {
    notificationWorker: {
      on: jest.fn(),
    },
  };
});

describe('Notification API Integration Tests', () => {
  afterAll((done) => {
    // Gracefully shut down server
    server.close(done);
  });

  describe('GET /api/status', () => {
    test('should return 200 and success status payload', async () => {
      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Campus Notification System API is up and running');
    });
  });

  describe('POST /api/notifications', () => {
    test('should return 400 validation error if body parameters are invalid', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ studentId: 'not-an-int', type: 'InvalidType', message: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details.length).toBeGreaterThanOrEqual(1);
    });

    test('should return 201 and created object when parameters are correct', async () => {
      // Stub student query
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@uni.edu',
      });

      // Stub database insertion
      const mockResult = {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        studentId: 1,
        type: 'Placement',
        message: 'Google Interview scheduled on Monday.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/notifications')
        .send({
          studentId: 1,
          type: 'Placement',
          message: 'Google Interview scheduled on Monday.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockResult.id);
      expect(res.body.data.message).toBe(mockResult.message);
    });
  });

  describe('GET /api/notifications', () => {
    test('should return filtered paginated results list', async () => {
      const mockList = [
        { id: '1', studentId: 1, type: 'Placement', message: 'msg1', isRead: false, createdAt: new Date() },
      ];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockList);
      (prisma.notification.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/notifications')
        .query({ studentId: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });
  });
});
