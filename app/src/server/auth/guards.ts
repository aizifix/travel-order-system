import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionPayload, UserRole } from "@/src/server/auth/types";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import { getRoleDashboardPath } from "@/src/server/auth/service";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role) {
    redirect(getRoleDashboardPath(session.role));
  }
  return session;
}

