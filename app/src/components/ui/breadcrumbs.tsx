"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-[#7b8398]" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.href || item.label} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-1 h-4 w-4 text-[#aab2c6]" />
              )}
              {isLast ? (
                <span className="font-medium text-[#2f3339]">{item.label}</span>
              ) : (
                <Link
                  href={item.href!}
                  className="transition hover:text-[#3B9F41]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
