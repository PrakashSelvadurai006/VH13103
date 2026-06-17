import dotenv from 'dotenv';
// Load environment variables before other modules to ensure bindings exist
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { requestLogger, errorLogger } from './middleware/logger';
import { apiRateLimiter } from './middleware/rateLimiter';
import notificationRoutes from './routes/notificationRoutes';
import { initSocketIO } from './services/SocketService';

// Import BullMQ worker to register it and ensure it processes jobs
import './workers/notificationWorker';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO instance
initSocketIO(server);

// HTTP middleware configuration
app.use(cors());
app.use(express.json());

// Logging middleware (console and file logs)
app.use(requestLogger);

// Rate limiter for security
app.use('/api', apiRateLimiter);

// Endpoint mounting
app.use('/api/notifications', notificationRoutes);

// Server health check
app.get('/api/status', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Notification System API is up and running.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.redirect('/api/status');
});

// Express unhandled error logging middleware
app.use(errorLogger);

// Consistent client error responder
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Campus notification service running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Export server for integration tests
export { app, server };
