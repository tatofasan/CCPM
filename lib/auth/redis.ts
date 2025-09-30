import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';

// Create Redis client instance
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  return redisClient;
}

// Session key prefixes
const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const BLACKLIST_PREFIX = 'blacklist:';

/**
 * Store refresh token in Redis with TTL (7 days)
 */
export async function storeRefreshToken(
  userId: string,
  token: string,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): Promise<void> {
  const client = getRedisClient();
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;

  // Store token with TTL
  await client.setex(key, expiresInSeconds, token);
}

/**
 * Get refresh token from Redis
 */
export async function getRefreshToken(userId: string): Promise<string | null> {
  const client = getRedisClient();
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;

  return client.get(key);
}

/**
 * Delete refresh token from Redis (logout)
 */
export async function deleteRefreshToken(userId: string): Promise<void> {
  const client = getRedisClient();
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;

  await client.del(key);
}

/**
 * Blacklist an access token (for logout)
 * TTL should match the token's remaining lifetime
 */
export async function blacklistToken(
  token: string,
  expiresInSeconds: number
): Promise<void> {
  const client = getRedisClient();
  const key = `${BLACKLIST_PREFIX}${token}`;

  // Store in blacklist with TTL matching token expiration
  await client.setex(key, expiresInSeconds, '1');
}

/**
 * Check if a token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const client = getRedisClient();
  const key = `${BLACKLIST_PREFIX}${token}`;

  const result = await client.get(key);
  return result !== null;
}

/**
 * Rotate refresh token (delete old, store new)
 */
export async function rotateRefreshToken(
  userId: string,
  newToken: string,
  expiresInSeconds: number = 7 * 24 * 60 * 60
): Promise<void> {
  const client = getRedisClient();
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;

  // Atomically replace old token with new one
  await client.setex(key, expiresInSeconds, newToken);
}

/**
 * Store user session data (optional, for additional session info)
 */
export async function storeSessionData(
  userId: string,
  data: Record<string, any>,
  expiresInSeconds: number = 24 * 60 * 60 // 24 hours
): Promise<void> {
  const client = getRedisClient();
  const key = `session:${userId}`;

  await client.setex(key, expiresInSeconds, JSON.stringify(data));
}

/**
 * Get user session data
 */
export async function getSessionData(userId: string): Promise<Record<string, any> | null> {
  const client = getRedisClient();
  const key = `session:${userId}`;

  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Delete user session data
 */
export async function deleteSessionData(userId: string): Promise<void> {
  const client = getRedisClient();
  const key = `session:${userId}`;

  await client.del(key);
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}