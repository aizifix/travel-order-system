import type { ReactNode } from "react";
import { requireRole } from "@/src/server/auth/guards";

type RegularLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RegularLayout({ children }: RegularLayoutProps) {
  await requireRole("regular");
  return <>{children}</>;
}

