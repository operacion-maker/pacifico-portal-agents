import { headers } from "next/headers";
import { getDatabricksAuth } from "@/lib/auth";
import { getRedis, SESSION_TTL } from "@/lib/redis";

// SESSIONS_HOST: optional FastAPI backend with /sessions/ routes (Docker dev).
// If not set, talk to Redis directly (Databricks Apps).
function getSessionsHost(): string | null {
  return process.env.SESSIONS_HOST ?? null;
}

async function resolveUsername(): Promise<string> {
  const auth = await getDatabricksAuth();
  if (auth.email) return auth.email;
  const headersList = await headers();
  return headersList.get("x-user-id") ?? "anonymous";
}

async function safeFetchJson(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return { data: text ? JSON.parse(text) : null, status: res.status };
  } catch {
    return { data: null, status: 502 };
  }
}

export async function GET() {
  const host = getSessionsHost();
  const username = await resolveUsername();

  if (host) {
    const { data, status } = await safeFetchJson(
      `${host}/sessions/${encodeURIComponent(username)}`
    );
    return Response.json(Array.isArray(data) ? data : data?.sessions ?? [], { status: data ? status : 200 });
  }

  // Direct Redis
  const redis = getRedis();
  if (!redis) return Response.json([]);

  try {
    const chatIds = await redis.zrevrange(`sessions:${username}`, 0, -1);
    const sessions = [];
    for (const chatId of chatIds) {
      const data = await redis.hgetall(`session:${username}:${chatId}`);
      if (data && data.title) {
        sessions.push({
          id: chatId,
          title: data.title ?? "",
          createdAt: parseInt(data.createdAt ?? "0"),
          updatedAt: parseInt(data.updatedAt ?? "0"),
        });
      }
    }
    return Response.json(sessions);
  } catch {
    return Response.json([]);
  }
}

export async function POST(req: Request) {
  const host = getSessionsHost();
  const username = await resolveUsername();
  const body = await req.json();

  if (host) {
    const { data, status } = await safeFetchJson(
      `${host}/sessions/${encodeURIComponent(username)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return Response.json(data ?? {}, { status: data ? status : 200 });
  }

  // Direct Redis
  const redis = getRedis();
  if (!redis) return Response.json({});

  try {
    const chatId = body.chatId ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const title = body.title ?? "Nueva conversación";
    const now = Date.now();

    const hashKey = `session:${username}:${chatId}`;
    const msgKey = `session:${username}:${chatId}:messages`;
    const idxKey = `sessions:${username}`;

    const pipe = redis.pipeline();
    pipe.hset(hashKey, { title, createdAt: now.toString(), updatedAt: now.toString() });
    pipe.zadd(idxKey, now, chatId);
    pipe.expire(hashKey, SESSION_TTL);
    pipe.expire(msgKey, SESSION_TTL);
    pipe.expire(idxKey, SESSION_TTL);
    await pipe.exec();

    return Response.json({ id: chatId, title, createdAt: now, updatedAt: now });
  } catch {
    return Response.json({});
  }
}
