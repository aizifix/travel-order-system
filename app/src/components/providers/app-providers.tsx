"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/src/components/ui/toast-provider";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return <ToastProvider>{children}</ToastProvider>;
}
