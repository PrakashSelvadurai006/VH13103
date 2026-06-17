import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

/**
 * Initializes Socket.IO with standard settings and event handlers.
 */
export function initSocketIO(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: '*', // Allows cross-origin for local testing
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Allow student client to subscribe to their specific notification room
    socket.on('join', (data: { studentId: number }) => {
      if (data && data.studentId) {
        const room = `student:${data.studentId}`;
        socket.join(room);
        console.log(`Client ${socket.id} subscribed to room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emits a real-time notification update to a student's WebSocket room.
 */
export function sendRealTimeNotification(studentId: number, notification: any): void {
  if (io) {
    const room = `student:${studentId}`;
    io.to(room).emit('notification', notification);
    console.log(`Real-time notification broadcasted to ${room}`);
  } else {
    console.warn('Socket.IO server instance not initialized. Real-time message skipped.');
  }
}
