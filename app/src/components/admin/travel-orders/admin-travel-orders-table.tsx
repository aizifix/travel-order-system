"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Copy,
} from "lucide-react";
import type {
  AdminTravelOrderItem,
  TravelOrderPagination,
  TravelOrderSortColumn,
  TravelOrderSortDirection,
} from "@/src/server/travel-orders/service";
import { useRealtimeTravelOrderRefresh } from "@/src/hooks/useRealtimeTravelOrderRefresh";
import { useDrawerFocusManagement } from "@/src/hooks/useDrawerFocusManagement";
import { useVirtualRows } from "@/src/hooks/useVirtualRows";

type CurrentFilter = Readonly<{
  search?: string;
  status?: string;
  sortBy?: TravelOrderSortColumn;
  sortDir?: TravelOrderSortDirection;
  page?: number;
  limit?: number;
}>;

type AdminTravelOrdersTableProps = Readonly<{
  rows: readonly AdminTravelOrderItem[];
  pagination?: TravelOrderPagination;
  currentFilter?: CurrentFilter;
  onReview: (formData: FormData) => Promise<void>;
  initialOrderId?: number;
}>;

type SortDirection = "asc" | "desc" | null;
type SortColumn =
  | "orderNo"
  | "orderDate"
  | "requestedBy"
  | "destination"
  | "purpose"
  | "departureDate"
  | "status"
  | null;

const DRAWER_CLOSE_DELAY_MS = 300;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const VIRTUAL_SCROLL_THRESHOLD = 50;
const VIRTUAL_ROW_HEIGHT = 56;
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "STEP1_APPROVED", label: "Step 1 Approved" },
  { value: "APPROVED", label: "Approved" },
  { value: "RETURNED", label: "Returned" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DRAFT", label: "Draft" },
] as const;

const AdminTravelOrderDrawer = dynamic(
  () =>
    import("@/src/components/admin/travel-orders/admin-travel-order-drawer").then(
      (mod) => ({ default: mod.AdminTravelOrderDrawer }),
    ),
  {
    ssr: false,
    loading: () => <DrawerPanelFallback />,
  },
);

function useTableSort() {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback(
    (column: SortColumn) => {
      setSortColumn((prev) => {
        if (prev !== column) {
          setSortDirection("asc");
          return column;
        }
        return prev;
      });

      setSortDirection((prev) => {
        if (sortColumn !== column) return "asc";
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    },
    [sortColumn],
  );

  const getSortIcon = useCallback(
    (column: SortColumn): ReactNode => {
      if (sortColumn !== column) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
      if (sortDirection === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
      if (sortDirection === "desc") return <ChevronDown className="h-3.5 w-3.5" />;
      return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    },
    [sortColumn, sortDirection],
  );

  return { sortColumn, sortDirection, handleSort, getSortIcon };
}

function useTableFilter() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const clearFilter = useCallback(() => {
    setStatusFilter("all");
    setSearchQuery("");
  }, []);

  return {
    statusFilter,
    setStatusFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    searchQuery,
    setSearchQuery,
    clearFilter,
    hasActiveFilter: statusFilter !== "all" || searchQuery !== "",
  };
}

function useTablePagination(totalItems: number, pageSize: number = DEFAULT_PAGE_SIZE) {
  const [currentPageState, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSizeState));
  const currentPage = Math.min(currentPageState, totalPages);
  const startIndex = (currentPage - 1) * pageSizeState;
  const endIndex = Math.min(startIndex + pageSizeState, totalItems);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = endIndex;

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  const changePageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    pageSize: pageSizeState,
    showingFrom,
    showingTo,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
}

function useDrawer(rows: readonly AdminTravelOrderItem[], initialOrderId?: number) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(() => {
    if (!initialOrderId) {
      return null;
    }
    return rows.some((row) => row.id === initialOrderId) ? initialOrderId : null;
  });
  const [isDrawerOpenState, setIsDrawerOpen] = useState(() => selectedOrderId !== null);

  const selectedOrder = useMemo(() => {
    if (selectedOrderId === null) {
      return null;
    }
    return rows.find((row) => row.id === selectedOrderId) ?? null;
  }, [rows, selectedOrderId]);
  const isDrawerOpen = isDrawerOpenState && selectedOrder !== null;

  const handleOpenDrawer = useCallback((order: AdminTravelOrderItem) => {
    setSelectedOrderId(order.id);
    requestAnimationFrame(() => setIsDrawerOpen(true));
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedOrderId(null), DRAWER_CLOSE_DELAY_MS);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDrawerOpen) {
        handleCloseDrawer();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleCloseDrawer, isDrawerOpen]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  return {
    selectedOrder,
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
  };
}

export function AdminTravelOrdersTable({
  rows,
  pagination,
  currentFilter,
  onReview,
  initialOrderId,
}: AdminTravelOrdersTableProps) {
  useRealtimeTravelOrderRefresh();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const canUseDom = typeof window !== "undefined";

  const statusFilter = currentFilter?.status ?? "all";
  const searchQuery = currentFilter?.search ?? "";
  const sortColumn = currentFilter?.sortBy ?? null;
  const sortDirection = currentFilter?.sortDir ?? null;

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const hasActiveFilter = statusFilter !== "all" || searchQuery !== "";

  const handleSort = useCallback((column: SortColumn) => {
    if (!column) return;
    const params = new URLSearchParams(searchParams.toString());
    const newSortDir = sortColumn !== column || sortDirection !== "desc" ? "desc" : "asc";
    params.set("sortBy", column);
    params.set("sortDir", newSortDir);
    params.set("page", "1");
    router.push(`/admin/travel-orders?${params.toString()}`);
  }, [searchParams, router, sortColumn, sortDirection]);

  const getSortIcon = useCallback((column: SortColumn): ReactNode => {
    if (sortColumn !== column) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    if (sortDirection === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
    if (sortDirection === "desc") return <ChevronDown className="h-3.5 w-3.5" />;
    return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
  }, [sortColumn, sortDirection]);

  const handleSearchChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/travel-orders?${params.toString()}`);
  }, [searchParams, router]);

  const handleStatusFilterChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/admin/travel-orders?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilter = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`/admin/travel-orders?${params.toString()}`);
  }, [router]);

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/travel-orders?${params.toString()}`);
  }, [searchParams, router]);

  const handleLimitChange = useCallback((newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`/admin/travel-orders?${params.toString()}`);
  }, [searchParams, router]);

  const { selectedOrder, isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useDrawer(
    rows,
    initialOrderId,
  );
  const openDrawerFromTrigger = useCallback(
    (order: AdminTravelOrderItem, triggerElement?: HTMLElement | null) => {
      if (triggerElement) {
        returnFocusRef.current = triggerElement;
      } else if (document.activeElement instanceof HTMLElement) {
        returnFocusRef.current = document.activeElement;
      }
      handleOpenDrawer(order);
    },
    [handleOpenDrawer],
  );
  const handleRowKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLTableRowElement>,
      row: AdminTravelOrderItem,
    ) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDrawerFromTrigger(row, event.currentTarget);
      }
    },
    [openDrawerFromTrigger],
  );

  useDrawerFocusManagement({
    isOpen: isDrawerOpen,
    drawerRef,
    returnFocusRef,
  });

  const displayedRows = useMemo(() => rows, [rows]);
  const shouldVirtualizeRows = displayedRows.length > VIRTUAL_SCROLL_THRESHOLD;
  const {
    containerRef: tableScrollRef,
    handleScroll: handleTableScroll,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
  } = useVirtualRows({
    rowCount: displayedRows.length,
    estimateRowHeight: VIRTUAL_ROW_HEIGHT,
    enabled: shouldVirtualizeRows,
  });
  const visibleRows = shouldVirtualizeRows
    ? displayedRows.slice(startIndex, endIndex)
    : displayedRows;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowFilterDropdown]);

  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-white">
      <div className="flex items-center justify-between border-b border-[#dfe1ed] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8398]" />
            <input
              type="text"
              placeholder="Search TO no., requester, destination, purpose..."
              defaultValue={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-9 w-80 rounded-md border border-[#dfe1ed] bg-white pl-9 pr-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                showFilterDropdown || hasActiveFilter
                  ? "border-[#3B9F41] bg-[#f1fbf5] text-[#3B9F41]"
                  : "border-[#dfe1ed] bg-white text-[#5d6780] hover:bg-[#f3f5fa]"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
            {showFilterDropdown ? (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#dfe1ed] bg-white p-2 shadow-lg">
                <p className="px-2 py-1.5 text-xs font-semibold text-[#5d6780]">Status</p>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleStatusFilterChange(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                      statusFilter === option.value
                        ? "bg-[#f1fbf5] font-semibold text-[#3B9F41]"
                        : "text-[#4a5266] hover:bg-[#f3f5fa]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusFilter === option.value ? "bg-[#3B9F41]" : "bg-[#dfe1ed]"
                      }`}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={clearFilter}
              className="cursor-pointer text-xs text-[#5d6780] underline hover:text-[#3B9F41]"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={tableScrollRef}
        onScroll={handleTableScroll}
        className="overflow-x-auto overflow-y-auto w-full max-h-[calc(100vh-320px)]"
      >
        <table className="w-full min-w-[1160px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#f3f5fa] text-[#5d6780]">
            <tr className="border-b border-[#cfd4e2]">
              <SortableHeaderCell
                label="TO no."
                sortIcon={getSortIcon("orderNo")}
                onSort={() => handleSort("orderNo")}
                isActive={sortColumn === "orderNo"}
              />
              <SortableHeaderCell
                label="Date Posted"
                sortIcon={getSortIcon("orderDate")}
                onSort={() => handleSort("orderDate")}
                isActive={sortColumn === "orderDate"}
              />
              <SortableHeaderCell
                label="Requested By"
                sortIcon={getSortIcon("requestedBy")}
                onSort={() => handleSort("requestedBy")}
                isActive={sortColumn === "requestedBy"}
              />
              <SortableHeaderCell
                label="Destination"
                sortIcon={getSortIcon("destination")}
                onSort={() => handleSort("destination")}
                isActive={sortColumn === "destination"}
              />
              <SortableHeaderCell
                label="Purpose"
                sortIcon={getSortIcon("purpose")}
                onSort={() => handleSort("purpose")}
                isActive={sortColumn === "purpose"}
              />
              <SortableHeaderCell
                label="Travel Dates"
                sortIcon={getSortIcon("departureDate")}
                onSort={() => handleSort("departureDate")}
                isActive={sortColumn === "departureDate"}
              />
              <SortableHeaderCell
                label="Status"
                sortIcon={getSortIcon("status")}
                onSort={() => handleSort("status")}
                isActive={sortColumn === "status"}
              />
              <HeaderCell>Action</HeaderCell>
            </tr>
          </thead>
          <tbody className="text-sm text-[#4a5266]">
            {displayedRows.length > 0 ? (
              <>
                {shouldVirtualizeRows && topSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={8} style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
                {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-[#dfe1ed] transition-colors hover:bg-[#f8f9fc] focus:outline-none focus-visible:bg-[#f8f9fc] last:border-b-0"
                  onClick={(event) => openDrawerFromTrigger(row, event.currentTarget)}
                  onKeyDown={(event) => handleRowKeyDown(event, row)}
                  tabIndex={0}
                  aria-label={`Open details for travel order ${row.orderNo}`}
                >
                  <BodyCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <span>{row.orderNo}</span>
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          try {
                            if (navigator.clipboard?.writeText) {
                              await navigator.clipboard.writeText(row.orderNo);
                            } else {
                              // Fallback for non-secure contexts
                              const textarea = document.createElement('textarea');
                              textarea.value = row.orderNo;
                              textarea.style.position = 'fixed';
                              textarea.style.left = '-9999px';
                              document.body.appendChild(textarea);
                              textarea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textarea);
                            }
                          } catch {
                            // Silently fail - clipboard is not critical functionality
                          }
                        }}
                        className="inline-flex cursor-pointer items-center justify-center rounded p-0.5 text-[#7b8398] transition hover:bg-[#f3f5fa] hover:text-[#3B9F41]"
                        title="Copy TO number"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </BodyCell>
                  <BodyCell>{row.orderDateLabel}</BodyCell>
                  <BodyCell>{row.requestedBy}</BodyCell>
                  <BodyCell>
                    <span className="block max-w-[180px] truncate" title={row.destination}>
                      {row.destination}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <span className="block max-w-[160px] truncate" title={row.purpose}>
                      {row.purpose}
                    </span>
                  </BodyCell>
                  <BodyCell className="whitespace-nowrap">
                    {row.departureDateLabel} - {row.returnDateLabel}
                  </BodyCell>
                  <BodyCell>
                    <StatusPill status={row.status} />
                  </BodyCell>
                  <BodyCell>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDrawerFromTrigger(row, event.currentTarget);
                      }}
                      className="inline-flex cursor-pointer items-center rounded-md border border-[#dfe1ed] px-2.5 py-1.5 text-xs font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
                    >
                      Review
                    </button>
                  </BodyCell>
                </tr>
                ))}
                {shouldVirtualizeRows && bottomSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={8} style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
              </>
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#7d8598]">
                  {hasActiveFilter
                    ? "No travel orders found matching your filters."
                    : "No travel orders available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 ? (
        <div className="flex items-center justify-between border-t border-[#dfe1ed] px-4 py-3">
          <p className="text-xs text-[#7b8398]">
            Showing{" "}
            <span className="font-semibold text-[#2f3339]">
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-semibold text-[#2f3339]">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-4">
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-md border border-[#dfe1ed] bg-white px-2 py-1.5 text-xs font-medium text-[#5d6780] outline-none focus:border-[#3B9F41]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[80px] text-center text-xs text-[#5d6780]">
                Page <span className="font-semibold text-[#2f3339]">{pagination.page}</span> of{" "}
                <span className="font-semibold text-[#2f3339]">{pagination.totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedOrder ? (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out ${
              isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />
          {canUseDom
            ? createPortal(
                <div
                  ref={drawerRef}
                  className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[760px] transform bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
                    isDrawerOpen ? "translate-x-0" : "translate-x-full"
                  }`}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Travel order details"
                  tabIndex={-1}
                >
                  <AdminTravelOrderDrawer
                    order={selectedOrder}
                    onReview={onReview}
                    onClose={handleCloseDrawer}
                  />
                </div>,
                document.body,
              )
            : null}
        </>
      ) : null}
    </div>
  );
}

function SortableHeaderCell({
  label,
  sortIcon,
  onSort,
  isActive,
}: Readonly<{
  label: string;
  sortIcon: ReactNode;
  onSort: () => void;
  isActive: boolean;
}>) {
  return (
    <th className="px-5 py-4 text-xs font-semibold tracking-tight whitespace-nowrap">
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex cursor-pointer items-center gap-1.5 transition ${
          isActive ? "text-[#3B9F41]" : "text-[#5d6780] hover:text-[#2f3339]"
        }`}
      >
        {label}
        {sortIcon}
      </button>
    </th>
  );
}

function HeaderCell({ children }: Readonly<{ children: string }>) {
  return <th className="px-5 py-4 text-xs font-semibold tracking-tight whitespace-nowrap">{children}</th>;
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return <td className={`px-5 py-3.5 align-middle ${className ?? ""}`}>{children}</td>;
}

function DrawerPanelFallback() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-[#dfe1ed] px-6 py-4">
        <div className="h-6 w-52 animate-pulse rounded bg-[#e5e7eb]" />
      </div>
      <div className="flex-1 px-6 py-5">
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-[#e5e7eb]" />
          <div className="h-4 w-[88%] animate-pulse rounded bg-[#e5e7eb]" />
          <div className="h-4 w-[72%] animate-pulse rounded bg-[#e5e7eb]" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: Readonly<{ status: string }>) {
  const normalized = status.toUpperCase();
  const styles =
    normalized === "REJECTED" || normalized === "CANCELLED"
      ? "bg-[#FFB1B1] text-[#E35E5E]"
      : normalized === "APPROVED" || normalized === "STEP1_APPROVED"
        ? "bg-[#B3FBD2] text-[#26AF5D]"
        : normalized === "RETURNED"
          ? "bg-[#FFE7B3] text-[#B57900]"
          : "bg-[#FEF6D2] text-[#C9AF37]";

  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {formatStatusLabel(normalized)}
    </span>
  );
}

function formatStatusLabel(normalizedStatus: string): string {
  return normalizedStatus
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
