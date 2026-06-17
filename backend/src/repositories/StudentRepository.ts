import prisma from '../prisma/client';

export class StudentRepository {
  public async findById(id: number) {
    return prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  public async findAll() {
    return prisma.student.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  public async create(data: { name: string; email: string }) {
    return prisma.student.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }
}
