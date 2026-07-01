import type { AgentConfig } from "./agent-registry";

/**
 * Default roles when no role information is available (local dev / no auth).
 * Grants access to all agents.
 */
const DEFAULT_ROLES = ["admin"];

/**
 * Resolve user roles from authentication context.
 *
 * In production (Databricks OBO), roles come from the user's token claims
 * or workspace group memberships. In local development, all roles are granted.
 */
export function resolveUserRoles(
  email?: string,
  groups?: string[]
): string[] {
  // In production, map Databricks workspace groups to portal roles
  if (groups && groups.length > 0) {
    return groups.map(mapGroupToRole).filter(Boolean) as string[];
  }

  // Fallback: grant full access in development
  return DEFAULT_ROLES;
}

/**
 * Map a Databricks workspace group name to a portal role.
 */
function mapGroupToRole(group: string): string | null {
  const GROUP_ROLE_MAP: Record<string, string> = {
    "data-engineers": "data-engineer",
    "data-stewards": "data-steward",
    "data-analysts": "data-analyst",
    "portal-admins": "admin",
  };
  return GROUP_ROLE_MAP[group.toLowerCase()] ?? null;
}

/**
 * Check if a user can access a specific agent based on their roles.
 */
export function hasAgentAccess(
  agent: AgentConfig,
  userRoles: string[]
): boolean {
  if (userRoles.includes("admin")) return true;
  return agent.requiredRoles.some((role) => userRoles.includes(role));
}
