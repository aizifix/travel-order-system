"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type NotificationBellItem = Readonly<{
  id: string;
  title: string;
  description?: string;
  href?: string;
  timestampLabel?: string;
  isNew?: boolean;
}>;

type NotificationBellButtonProps = Readonly<{
  count?: number;
  items?: readonly NotificationBellItem[];
  emptyMessage?: string;
  onOpenChange?: (isOpen: boolean) => void;
  onItemClick?: (itemId: string) => void;
  onMarkAllRead?: () => void;
}>;

export function NotificationBellButton({
  count,
  items = [],
  emptyMessage = "No notifications yet.",
  onOpenChange,
  onItemClick,
  onMarkAllRead,
}: NotificationBellButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const hasUnreadItems = (count ?? 0) > 0 || items.some((item) => item.isNew);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9F41]/40 ${
          hasUnreadItems ? "text-[#22c55e]" : "text-[#343a40]"
        }`}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleBellClick}
      >
        <Bell className="h-6 w-6" aria-hidden="true" />
        {typeof count === "number" && count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#22c55e] px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          id={panelId}
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-lg ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-semibold text-[#2f3339]">Notifications</h2>
            {hasUnreadItems && (
              <button
                type="button"
                onClick={() => onMarkAllRead?.()}
                className="flex cursor-pointer items-center gap-1 text-xs font-medium text-[#3B9F41] transition hover:text-[#2f7a32]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>
          {items.length > 0 ? (
            <ul className="max-h-80 space-y-1 overflow-y-auto p-2">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationItem
                    item={item}
                    onSelect={() => {
                      onItemClick?.(item.id);
                      setIsOpen(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-[#7b8398]">{emptyMessage}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function NotificationItem({
  item,
  onSelect,
}: Readonly<{
  item: NotificationBellItem;
  onSelect: () => void;
}>) {
  const content = (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1.5 h-2 w-2 flex-none rounded-full ${
          item.isNew ? "bg-[#22c55e]" : "bg-[#9ca3af]"
        }`}
        aria-hidden="true"
      />
      <div className="flex-1">
        <p className={`text-sm ${item.isNew ? "font-semibold text-[#2f3339]" : "font-medium text-[#5d6780]"}`}>
          {item.title}
        </p>
        {item.description ? (
          <p className="mt-0.5 text-xs text-[#5d6780]">{item.description}</p>
        ) : null}
        {item.timestampLabel ? (
          <p className="mt-1 text-[11px] text-[#8c93a8]">{item.timestampLabel}</p>
        ) : null}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={`block rounded-lg px-3 py-2.5 transition hover:bg-gray-50 ${item.isNew ? "bg-gray-50/50" : ""}`}
        onClick={onSelect}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${item.isNew ? "bg-gray-50/50" : ""}`}
      onClick={onSelect}
    >
      {content}
    </div>
  );
}
