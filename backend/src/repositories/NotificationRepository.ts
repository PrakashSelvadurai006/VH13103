import { NotificationType, Prisma } from '@prisma/client';
import prisma from '../prisma/client';

export interface NotificationFilters {
  studentId?: number;
  type?: NotificationType;
  isRead?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface SortOptions {
  field: 'createdAt';
  order: 'asc' | 'desc';
}

export class NotificationRepository {
  private selectFields: Prisma.NotificationSelect = {
    id: true,
    studentId: true,
    type: true,
    message: true,
    isRead: true,
    createdAt: true,
  };

  public async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      select: this.selectFields,
    });
  }

  public async create(data: {
    studentId: number;
    type: NotificationType;
    message: string;
    isRead?: boolean;
  }) {
    return prisma.notification.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        message: data.message,
        isRead: data.isRead ?? false,
      },
      select: this.selectFields,
    });
  }

  public async updateReadStatus(id: string, isRead: boolean) {
    return prisma.notification.update({
      where: { id },
      data: { isRead },
      select: this.selectFields,
    });
  }

  public async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
      select: this.selectFields,
    });
  }

  public async findMany(
    filters: NotificationFilters,
    pagination: PaginationOptions,
    sort: SortOptions = { field: 'createdAt', order: 'desc' }
  ) {
    const where: Prisma.NotificationWhereInput = {};

    if (filters.studentId !== undefined) {
      where.studentId = filters.studentId;
    }
    if (filters.type !== undefined) {
      where.type = filters.type;
    }
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    const limit = pagination.limit ?? 10;
    const orderBy = { [sort.field]: sort.order };

    // Cursor pagination takes precedence if cursor is supplied
    if (pagination.cursor) {
      return prisma.notification.findMany({
        where,
        take: limit,
        skip: 1, // Skip the cursor element itself
        cursor: { id: pagination.cursor },
        orderBy,
        select: this.selectFields,
      });
    }

    // Offset-based pagination fallback
    const offset = pagination.offset ?? 0;
    return prisma.notification.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
      select: this.selectFields,
    });
  }

  public async count(filters: NotificationFilters): Promise<number> {
    const where: Prisma.NotificationWhereInput = {};

    if (filters.studentId !== undefined) {
      where.studentId = filters.studentId;
    }
    if (filters.type !== undefined) {
      where.type = filters.type;
    }
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    return prisma.notification.count({ where });
  }

  /**
   * Stage 3: Optimized raw SQL query to find all students that received Placement notifications.
   * Leverages indexes on notification type and joins on student ID.
   */
  public async findStudentsWithPlacementNotificationsRaw() {
    return prisma.$queryRaw<Array<{ id: number; name: string; email: string }>>`
      SELECT DISTINCT s.id, s.name, s.email
      FROM students s
      INNER JOIN notifications n ON s.id = n.student_id
      WHERE n.type = 'Placement'::"NotificationType"
    `;
  }
}
