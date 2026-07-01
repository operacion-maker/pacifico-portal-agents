import { headers } from "next/headers";
import type { DatabricksAuthInfo } from "@/types";

export async function getDatabricksAuth(): Promise<DatabricksAuthInfo> {
  const headersList = await headers();

  return {
    userId: headersList.get("x-forwarded-user-id") ?? undefined,
    email: headersList.get("x-forwarded-email") ?? undefined,
    accessToken: headersList.get("x-forwarded-access-token") ?? undefined,
  };
}
