import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Explicit connection options parsing for BullMQ to resolve typescript compiler type clashes
export const connectionOptions = (() => {
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: parsed.port ? Number(parsed.port) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: parsed.pathname ? Number(parsed.pathname.split('/')[1]) || 0 : 0,
      maxRetriesPerRequest: null, // Critical setting for BullMQ
    };
  } catch (err) {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
})();

// Create live redis client for standard cache GET/SET operations
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export { redis };

/**
 * Generates a version-aware cache key for a student to support O(1) cache invalidation.
 */
export async function getStudentCacheKey(studentId: number, queryParams: any): Promise<string> {
  const versionKey = `notifications:student:${studentId}:version`;
  let version = await redis.get(versionKey);
  if (!version) {
    version = '1';
    await redis.set(versionKey, '1', 'EX', 86400);
  }
  const queryHash = Buffer.from(JSON.stringify(queryParams)).toString('base64');
  return `notifications:student:${studentId}:version:${version}:query:${queryHash}`;
}

/**
 * Invalidates cache for a student by incrementing their version counter.
 */
export async function invalidateStudentCache(studentId: number): Promise<void> {
  const versionKey = `notifications:student:${studentId}:version`;
  await redis.incr(versionKey);
}
