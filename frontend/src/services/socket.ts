import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Returns a singleton instance of the Socket.IO connection client.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:5000', {
      autoConnect: true,
    });
  }
  return socket;
}
