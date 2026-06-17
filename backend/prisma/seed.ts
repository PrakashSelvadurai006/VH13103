import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding students...');

  const studentsData = [
    { name: 'John Doe', email: 'john.doe@university.edu' },
    { name: 'Jane Smith', email: 'jane.smith@university.edu' },
    { name: 'Alice Johnson', email: 'alice.j@university.edu' },
    { name: 'Bob Brown', email: 'bob.b@university.edu' },
    { name: 'Charlie Green', email: 'charlie.g@university.edu' },
  ];

  const students = [];
  for (const data of studentsData) {
    const student = await prisma.student.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    });
    students.push(student);
  }

  console.log(`Seeded ${students.length} students.`);

  console.log('Seeding initial notifications...');
  const sampleNotifications = [
    {
      studentId: students[0].id,
      type: NotificationType.Placement,
      message: 'Congratulations! You have been shortlisted for Google interview round 1.',
      isRead: false,
    },
    {
      studentId: students[0].id,
      type: NotificationType.Result,
      message: 'The Mid-Term Results for Computer Science are out now. Check portal.',
      isRead: true,
    },
    {
      studentId: students[1].id,
      type: NotificationType.Event,
      message: 'Campus Hackathon registration closes tomorrow. Sign up today!',
      isRead: false,
    },
    {
      studentId: students[2].id,
      type: NotificationType.Placement,
      message: 'Placement drive with Microsoft starts on Friday.',
      isRead: false,
    },
  ];

  for (const notif of sampleNotifications) {
    await prisma.notification.create({
      data: notif,
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
