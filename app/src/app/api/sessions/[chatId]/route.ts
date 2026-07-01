import { headers } from "next/headers";
import { getDatabricksAuth } from "@/lib/auth";
import { getRedis, SESSION_TTL } from "@/lib/redis";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const host = getSessionsHost();
  const { chatId } = await params;
  const username = await resolveUsername();

  if (host) {
    const { data, status } = await safeFetchJson(
      `${host}/sessions/${encodeURIComponent(username)}/${encodeURIComponent(chatId)}`
    );
    return Response.json(data ?? { messages: [] }, { status: data ? status : 200 });
  }

  const redis = getRedis();
  if (!redis) return Response.json({ messages: [] });

  try {
    const data = await redis.hgetall(`session:${username}:${chatId}`);
    if (!data || !data.title) return Response.json({ messages: [] });

    const rawMessages = await redis.lrange(`session:${username}:${chatId}:messages`, 0, -1);
    const messages = rawMessages.map((m) => JSON.parse(m));

    return Response.json({
      id: chatId,
      title: data.title ?? "",
      createdAt: parseInt(data.createdAt ?? "0"),
      updatedAt: parseInt(data.updatedAt ?? "0"),
      messages,
    });
  } catch {
    return Response.json({ messages: [] });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const host = getSessionsHost();
  const { chatId } = await params;
  const username = await resolveUsername();
  const body = await req.json();

  if (host) {
    const { data, status } = await safeFetchJson(
      `${host}/sessions/${encodeURIComponent(username)}/${encodeURIComponent(chatId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return Response.json(data ?? {}, { status: data ? status : 200 });
  }

  const redis = getRedis();
  if (!redis) return Response.json({});

  try {
    const now = Date.now();
    const hashKey = `session:${username}:${chatId}`;
    const msgKey = `session:${username}:${chatId}:messages`;
    const idxKey = `sessions:${username}`;

    const pipe = redis.pipeline();

    const updates: Record<string, string> = { updatedAt: now.toString() };
    if (body.title) updates.title = body.title;
    pipe.hset(hashKey, updates);

    if (body.messages) {
      pipe.del(msgKey);
      for (const msg of body.messages) {
        pipe.rpush(msgKey, JSON.stringify(msg));
      }
    }

    pipe.zadd(idxKey, now, chatId);
    pipe.expire(hashKey, SESSION_TTL);
    pipe.expire(msgKey, SESSION_TTL);
    pipe.expire(idxKey, SESSION_TTL);
    await pipe.exec();

    return Response.json({ status: "ok" });
  } catch {
    return Response.json({});
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const host = getSessionsHost();
  const { chatId } = await params;
  const username = await resolveUsername();

  if (host) {
    const { data, status } = await safeFetchJson(
      `${host}/sessions/${encodeURIComponent(username)}/${encodeURIComponent(chatId)}`,
      { method: "DELETE" }
    );
    return Response.json(data ?? {}, { status: data ? status : 200 });
  }

  const redis = getRedis();
  if (!redis) return Response.json({});

  try {
    const pipe = redis.pipeline();
    pipe.del(`session:${username}:${chatId}`);
    pipe.del(`session:${username}:${chatId}:messages`);
    pipe.zrem(`sessions:${username}`, chatId);
    await pipe.exec();
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({});
  }
}
