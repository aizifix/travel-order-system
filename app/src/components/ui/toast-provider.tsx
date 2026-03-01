"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

type ToastPayload = Readonly<{
  type?: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}>;

type ToastContextValue = Readonly<{
  showToast: (payload: ToastPayload) => void;
}>;

type ToastItem = Readonly<{
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}>;

const DEFAULT_DURATION_MS = 3200;
const ToastContext = createContext<ToastContextValue | null>(null);
const noopSubscribe = () => () => {};

export function ToastProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const timeoutMapRef = useRef<Map<number, number>>(new Map());
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, description, durationMs = DEFAULT_DURATION_MS }: ToastPayload) => {
      if (!title.trim()) {
        return;
      }

      const id = Date.now() + Math.floor(Math.random() * 10_000);
      const nextToast: ToastItem = {
        id,
        type,
        title: title.trim(),
        description: description?.trim() || undefined,
      };

      setToasts((current) => [...current, nextToast]);
      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, Math.max(800, durationMs));
      timeoutMapRef.current.set(id, timeoutId);
    },
    [dismissToast],
  );

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;
    return () => {
      timeoutMap.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutMap.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isClient
        ? createPortal(
            <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
              {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

function ToastCard({
  toast,
  onDismiss,
}: Readonly<{
  toast: ToastItem;
  onDismiss: (id: number) => void;
}>) {
  const icon =
    toast.type === "success" ? (
      <CheckCircle2 className="h-4 w-4 text-[#22a35a]" />
    ) : toast.type === "error" ? (
      <AlertCircle className="h-4 w-4 text-[#d43f3f]" />
    ) : (
      <Info className="h-4 w-4 text-[#5d6780]" />
    );

  const borderClass =
    toast.type === "success"
      ? "border-[#cdeedb]"
      : toast.type === "error"
        ? "border-[#f2cccc]"
        : "border-[#dfe1ed]";

  return (
    <div
      className={`pointer-events-auto rounded-xl border bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${borderClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1a1d1f]">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-xs text-[#5d6780]">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#7d8598] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
