import { getDatabricksAuth } from "@/lib/auth";

export async function GET() {
  const auth = await getDatabricksAuth();
  // If Databricks proxy provides email, return it; otherwise null (frontend shows modal)
  return Response.json({ username: auth.email ?? null });
}
