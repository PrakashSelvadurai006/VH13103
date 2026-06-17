import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Define log directory and file
const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Extend Request type to include request ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Custom logging middleware to capture and log HTTP requests and performance metadata.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const reqId = uuidv4();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);

  const start = process.hrtime();
  const timestamp = new Date().toISOString();

  // Listen to completion of the request
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const statusCode = res.statusCode;
    
    const logMessage = `[${timestamp}] [ReqID: ${reqId}] ${req.method} ${req.originalUrl} - Status: ${statusCode} - Duration: ${durationMs}ms`;

    // Console output
    console.log(logMessage);

    // File output
    fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
      if (err) {
        console.error('Failed to write request log to file:', err);
      }
    });
  });

  next();
}

/**
 * Custom error logging middleware to capture and record request stack traces.
 */
export function errorLogger(err: any, req: Request, _res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const reqId = req.id || 'N/A';
  const errorMessage = `[${timestamp}] [ReqID: ${reqId}] ERROR occurred on ${req.method} ${req.originalUrl}:\n${err.stack || err.message || err}`;

  // Log to console
  console.error(errorMessage);

  // Log to file
  fs.appendFile(LOG_FILE, errorMessage + '\n', (fileErr) => {
    if (fileErr) {
      console.error('Failed to write error log to file:', fileErr);
    }
  });

  next(err);
}
