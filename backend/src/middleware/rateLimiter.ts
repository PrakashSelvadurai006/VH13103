import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter to restrict clients from flooding endpoints.
 * Restricts each IP address to 200 requests per 15-minute window.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});
