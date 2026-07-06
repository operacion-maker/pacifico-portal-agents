import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRedis } from "@/lib/redis";
import { getDatabricksAuth } from "@/lib/auth";

interface WorkspacePreferences {
  sidebarCollapsed: boolean;
  auditModeEnabled: boolean;
  lastFqn?: string;
  updatedAt: number;
}

function prefKey(userId: string): string {
  return `workspace:prefs:${userId}`;
}

function resolveUserId(request: NextRequest, auth: { userId?: string; email?: string }): string {
  return (
    request.headers.get("x-user-id") ??
    auth.userId ??
    auth.email ??
    "anonymous"
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getDatabricksAuth();
    const userId = resolveUserId(request, auth);
    const redis = getRedis();

    if (!redis) {
      return NextResponse.json(
        { sidebarCollapsed: false, auditModeEnabled: false, updatedAt: 0 },
        { status: 200 }
      );
    }

    const raw = await redis.get(prefKey(userId));
    if (!raw) {
      return NextResponse.json(
        { sidebarCollapsed: false, auditModeEnabled: false, updatedAt: 0 },
        { status: 200 }
      );
    }

    const prefs = JSON.parse(raw) as WorkspacePreferences;
    return NextResponse.json(prefs);
  } catch (err) {
    console.error("[Workspace Prefs GET]", err);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getDatabricksAuth();
    const userId = resolveUserId(request, auth);
    const redis = getRedis();

    // sendBeacon sends text/plain; fetch sends application/json.
    // Parse defensively so both work.
    let body: Partial<WorkspacePreferences>;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = (await request.json()) as Partial<WorkspacePreferences>;
    } else {
      // text/plain fallback (sendBeacon with Blob)
      const text = await request.text();
      body = JSON.parse(text) as Partial<WorkspacePreferences>;
    }

    const prefs: WorkspacePreferences = {
      sidebarCollapsed: body.sidebarCollapsed ?? false,
      auditModeEnabled: body.auditModeEnabled ?? false,
      lastFqn: body.lastFqn,
      updatedAt: Date.now(),
    };

    if (redis) {
      // Keep preferences for 30 days
      await redis.set(prefKey(userId), JSON.stringify(prefs), "EX", 60 * 60 * 24 * 30);
    }

    return NextResponse.json(prefs);
  } catch (err) {
    console.error("[Workspace Prefs PUT]", err);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
