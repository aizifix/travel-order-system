import type { ReactNode } from "react";
import { requireRole } from "@/src/server/auth/guards";

type ApproverLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function ApproverLayout({
  children,
}: ApproverLayoutProps) {
  await requireRole("approver");
  return <>{children}</>;
}

