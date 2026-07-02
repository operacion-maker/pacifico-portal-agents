import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!client) {
    client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy: () => null, // disable automatic retries — fail fast in local dev
    });
    // Suppress unhandled error events (ETIMEDOUT, etc.) — connection is best-effort
    client.on("error", () => {});
    client.connect().catch(() => {
      client = null;
    });
  }
  return client;
}

export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days
