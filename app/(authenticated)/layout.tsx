import type { ReactNode } from "react";
import { requireSession } from "@/src/server/auth/guards";

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  await requireSession();
  return <>{children}</>;
}
