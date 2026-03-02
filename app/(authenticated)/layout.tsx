import type { ReactNode } from "react";
import { requireSession } from "@/src/server/auth/guards";
import { WebSocketProvider } from "@/src/components/providers/WebSocketProvider";

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  await requireSession();
  return <WebSocketProvider>{children}</WebSocketProvider>;
}
