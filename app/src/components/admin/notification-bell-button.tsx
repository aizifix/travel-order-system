"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
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
}>;

export function NotificationBellButton({
  count,
  items = [],
  emptyMessage = "No notifications yet.",
}: NotificationBellButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const notificationCount =
    typeof count === "number" && !hasBeenOpened ? count : 0;

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

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
    setHasBeenOpened(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#343a40] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9F41]/40"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleBellClick}
      >
        <Bell className="h-6 w-6" aria-hidden="true" />
        {notificationCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
            {notificationCount > 99 ? "99+" : notificationCount}
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
          {items.length > 0 ? (
            <ul className="max-h-80 space-y-1 overflow-y-auto p-2">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationItem item={item} />
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

function NotificationItem({ item }: Readonly<{ item: NotificationBellItem }>) {
  const content = (
    <div className="flex items-start gap-3">
      {item.isNew && (
        <span className="mt-1.5 flex h-2 w-2 flex-none">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </span>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-[#2f3339]">{item.title}</p>
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
        className="block rounded-lg px-3 py-2.5 transition hover:bg-gray-50"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg px-3 py-2.5">
      {content}
    </div>
  );
}
