import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!client) {
    client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    client.connect().catch(() => {
      client = null;
    });
  }
  return client;
}

export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days
