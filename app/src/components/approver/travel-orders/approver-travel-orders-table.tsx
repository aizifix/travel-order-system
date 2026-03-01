"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
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
  ApproverTravelOrderItem,
  RequesterTravelOrderStep,
  TravelOrderApprovalAction,
} from "@/src/server/travel-orders/service";
import { ApprovalWorkflowTimeline } from "@/src/components/travel-orders/approval-workflow-timeline";
import { OrderNumberCopy } from "@/src/components/travel-orders/order-number-copy";
import { RequesterAvatar } from "@/src/components/travel-orders/requester-avatar";

type ApproverTravelOrdersTableProps = Readonly<{
  rows: readonly ApproverTravelOrderItem[];
  onReview: (formData: FormData) => Promise<void>;
  initialOrderId?: number;
}>;

type StepTone = "success" | "pending" | "danger" | "muted";

type StepVisualState = Readonly<{
  label: string;
  tone: StepTone;
  summary: string;
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

function useDrawer(rows: readonly ApproverTravelOrderItem[], initialOrderId?: number) {
  const [selectedOrder, setSelectedOrder] = useState<ApproverTravelOrderItem | null>(() => {
    if (!initialOrderId) return null;
    return rows.find((row) => row.id === initialOrderId) ?? null;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(
    () => initialOrderId !== undefined && rows.some((row) => row.id === initialOrderId),
  );

  const handleOpenDrawer = useCallback((order: ApproverTravelOrderItem) => {
    setSelectedOrder(order);
    requestAnimationFrame(() => setIsDrawerOpen(true));
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedOrder(null), DRAWER_CLOSE_DELAY_MS);
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

export function ApproverTravelOrdersTable({
  rows,
  onReview,
  initialOrderId,
}: ApproverTravelOrdersTableProps) {
  const filterRef = useRef<HTMLDivElement>(null);
  const canUseDom = typeof window !== "undefined";
  const { sortColumn, sortDirection, handleSort, getSortIcon } = useTableSort();
  const {
    statusFilter,
    setStatusFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    searchQuery,
    setSearchQuery,
    clearFilter,
    hasActiveFilter,
  } = useTableFilter();
  const { selectedOrder, isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useDrawer(
    rows,
    initialOrderId,
  );

  const prioritizedRows = useMemo(() => {
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const priorityDiff = getStatusPriority(a.row.status) - getStatusPriority(b.row.status);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return a.index - b.index;
      })
      .map((entry) => entry.row);
  }, [rows]);

  const filteredAndSortedRows = useMemo(() => {
    let result = [...prioritizedRows];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (row) =>
          row.orderNo.toLowerCase().includes(query) ||
          row.requestedBy.toLowerCase().includes(query) ||
          row.destination.toLowerCase().includes(query) ||
          row.purpose.toLowerCase().includes(query) ||
          (row.division ?? "").toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((row) => row.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";

        switch (sortColumn) {
          case "orderNo":
            aVal = a.orderNo;
            bVal = b.orderNo;
            break;
          case "orderDate":
            aVal = new Date(a.orderDateIso || 0).getTime();
            bVal = new Date(b.orderDateIso || 0).getTime();
            break;
          case "requestedBy":
            aVal = a.requestedBy;
            bVal = b.requestedBy;
            break;
          case "destination":
            aVal = a.destination;
            bVal = b.destination;
            break;
          case "purpose":
            aVal = a.purpose;
            bVal = b.purpose;
            break;
          case "departureDate":
            aVal = new Date(a.departureDateIso || 0).getTime();
            bVal = new Date(b.departureDateIso || 0).getTime();
            break;
          case "status":
            aVal = getStatusPriority(a.status);
            bVal = getStatusPriority(b.status);
            break;
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [prioritizedRows, searchQuery, statusFilter, sortColumn, sortDirection]);

  const pagination = useTablePagination(filteredAndSortedRows.length, DEFAULT_PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredAndSortedRows.slice(start, end);
  }, [filteredAndSortedRows, pagination.currentPage, pagination.pageSize]);

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
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 w-80 rounded-md border border-[#dfe1ed] bg-white pl-9 pr-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
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
                      setStatusFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
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
              className="text-xs text-[#5d6780] underline hover:text-[#3B9F41]"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-[#dfe1ed] transition-colors hover:bg-[#f8f9fc] last:border-b-0"
                  onClick={() => handleOpenDrawer(row)}
                >
                  <BodyCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <span>{row.orderNo}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void navigator.clipboard.writeText(row.orderNo);
                        }}
                        className="inline-flex items-center justify-center rounded p-0.5 text-[#7b8398] transition hover:bg-[#f3f5fa] hover:text-[#3B9F41]"
                        title="Copy TO number"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </BodyCell>
                  <BodyCell>{row.orderDateLabel}</BodyCell>
                  <BodyCell>{row.requestedBy}</BodyCell>
                  <BodyCell>{row.destination}</BodyCell>
                  <BodyCell>
                    <span className="block max-w-[200px] truncate" title={row.purpose}>
                      {row.purpose}
                    </span>
                  </BodyCell>
                  <BodyCell>
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
                        handleOpenDrawer(row);
                      }}
                      className="inline-flex cursor-pointer items-center rounded-md border border-[#dfe1ed] px-2.5 py-1.5 text-xs font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
                    >
                      Review
                    </button>
                  </BodyCell>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#7d8598]">
                  {hasActiveFilter
                    ? "No travel orders found matching your filters."
                    : "No assigned travel orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredAndSortedRows.length > 0 ? (
        <div className="flex items-center justify-between border-t border-[#dfe1ed] px-4 py-3">
          <p className="text-xs text-[#7b8398]">
            Showing{" "}
            <span className="font-semibold text-[#2f3339]">
              {pagination.showingFrom}-{pagination.showingTo}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#2f3339]">{filteredAndSortedRows.length}</span>
          </p>
          <div className="flex items-center gap-4">
            <select
              value={pagination.pageSize}
              onChange={(event) => pagination.changePageSize(Number(event.target.value))}
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
                onClick={pagination.firstPage}
                disabled={!pagination.canGoPrev}
                className="inline-flex items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={pagination.prevPage}
                disabled={!pagination.canGoPrev}
                className="inline-flex items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[80px] text-center text-xs text-[#5d6780]">
                Page <span className="font-semibold text-[#2f3339]">{pagination.currentPage}</span> of{" "}
                <span className="font-semibold text-[#2f3339]">{pagination.totalPages}</span>
              </span>
              <button
                type="button"
                onClick={pagination.nextPage}
                disabled={!pagination.canGoNext}
                className="inline-flex items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={pagination.lastPage}
                disabled={!pagination.canGoNext}
                className="inline-flex items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
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
                  className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[720px] transform bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
                    isDrawerOpen ? "translate-x-0" : "translate-x-full"
                  }`}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Travel order details"
                >
                  <TravelOrderDrawer
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

function TravelOrderDrawer({
  order,
  onReview,
  onClose,
}: Readonly<{
  order: ApproverTravelOrderItem;
  onReview: (formData: FormData) => Promise<void>;
  onClose: () => void;
}>) {
  const normalizedStatus = order.status.toUpperCase();
  const isPending = normalizedStatus === "PENDING";
  const isPrintable = normalizedStatus === "APPROVED";
  const printHref = `/api/travel-orders/${order.id}/print`;
  const confirmFormId = `approver-step1-confirm-${order.id}`;
  const rejectFormId = `approver-step1-reject-${order.id}`;
  const step1State = getStepVisualState(order, order.step1);
  const step2State = getStepVisualState(order, order.step2);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-[#dfe1ed] px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <RequesterAvatar fullName={order.requestedBy} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[#1a1d1f]">Travel Order Details</h2>
                <StatusPill status={order.status} />
              </div>
              <p className="mt-0.5 text-sm font-medium text-[#5d6780]">{order.requestedBy}</p>
              <OrderNumberCopy orderNo={order.orderNo} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
          <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Approval Progress
            </h3>
            <p className="mt-1 text-xs text-[#7d8598]">
              {normalizedStatus === "PENDING"
                ? "Awaiting your Step 1 review. Confirm to forward to RED/Admin or reject with reason."
                : normalizedStatus === "STEP1_APPROVED"
                  ? "Step 1 completed by you. Awaiting final RED/Admin approval."
                  : normalizedStatus === "APPROVED"
                    ? "Fully approved and ready for printing."
                    : normalizedStatus === "REJECTED"
                      ? "Request was rejected."
                      : normalizedStatus === "RETURNED"
                        ? "Returned to requester for changes."
                        : normalizedStatus === "CANCELLED"
                          ? "Request was cancelled by the requester."
                          : "Viewing approval workflow status."}
            </p>
            <div className="mt-4 rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
              <ApprovalWorkflowTimeline order={order} />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4">
            <div className="grid gap-3 text-sm text-[#4a5266] sm:grid-cols-2">
              <SummaryRow label="Date Posted" value={order.orderDateLabel} />
              <SummaryRow label="Requested By" value={order.requestedBy} />
              <SummaryRow label="Division" value={order.division ?? "-"} />
              <SummaryRow
                label="Travel Dates"
                value={`${order.departureDateLabel} - ${order.returnDateLabel}`}
              />
              <SummaryRow label="Destination" value={order.destination} />
            </div>
            <div className="mt-3 rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#4a5266]">
              <p className="font-semibold text-[#2f3339]">Purpose</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{order.purpose || "-"}</p>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Approval Details
            </h3>
            <div className="mt-4 space-y-3">
              <ApprovalStepCard
                stepLabel="Step 1 - First Approver"
                expectedApproverName={order.step1.expectedApproverName}
                step={order.step1}
                visual={step1State}
              />
              <ApprovalStepCard
                stepLabel="Step 2 - RED/Admin"
                expectedApproverName={order.step2.expectedApproverName}
                step={order.step2}
                visual={step2State}
              />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Request Details
            </h3>
            <div className="mt-3 grid gap-3 text-sm text-[#4a5266] sm:grid-cols-2">
              <SummaryRow label="Funding Source" value={order.fundingSource || "-"} />
              <SummaryRow label="Travel Days" value={String(order.travelDays)} />
              <SummaryRow
                label="Includes Other Staff"
                value={order.hasOtherStaff ? "Yes" : "No"}
              />
              <SummaryRow
                label="Travel Status Remarks"
                value={order.travelStatusRemarks || "-"}
              />
            </div>
            <div className="mt-3 rounded-lg border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-sm text-[#4a5266]">
              <p className="font-semibold text-[#2f3339]">Requester Remarks</p>
              <p className="mt-1 whitespace-pre-wrap">{order.remarks || "-"}</p>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Step 1 Review Actions
            </h3>
            {isPending ? (
              <>
                <p className="mt-1 text-xs text-[#7d8598]">
                  Confirm to forward this request to RED/Admin, or reject with a reason.
                </p>

                <form
                  id={confirmFormId}
                  action={onReview}
                  className="mt-4 rounded-lg border border-[#dfe1ed] p-3"
                >
                  <input type="hidden" name="travelOrderId" value={order.id} />
                  <input type="hidden" name="action" value="APPROVED" />
                  <FieldWrapper label="Confirmation Notes (Optional)">
                    <textarea
                      name="remarks"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
                      placeholder="Optional context before forwarding to RED/Admin"
                    />
                  </FieldWrapper>
                </form>

                <form
                  id={rejectFormId}
                  action={onReview}
                  className="mt-3 rounded-lg border border-[#ffcece] bg-[#fff7f7] p-3"
                >
                  <input type="hidden" name="travelOrderId" value={order.id} />
                  <input type="hidden" name="action" value="REJECTED" />
                  <FieldWrapper label="Rejection Reason">
                    <textarea
                      name="remarks"
                      rows={3}
                      required
                      className="w-full resize-none rounded-lg border border-[#ffcece] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#e35e5e] focus:ring-1 focus:ring-[#e35e5e]"
                      placeholder="State the reason for rejecting this request"
                    />
                  </FieldWrapper>
                </form>
              </>
            ) : (
              <p className="mt-2 rounded-lg border border-[#dfe1ed] bg-[#f8f9fc] px-3 py-2 text-sm text-[#5d6780]">
                {normalizedStatus === "PENDING"
                  ? "This request is awaiting Step 1 review by the first approver."
                  : "Step 1 review is already completed for this request."}
              </p>
            )}
          </section>
        </div>

        <div className="flex-none border-t border-[#dfe1ed] bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="grid gap-2">
            {isPrintable ? (
              <a
                href={printHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#3B9F41] bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436]"
              >
                Print Travel Order
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-[#dfe1ed] bg-[#f8f9fc] px-4 text-sm font-semibold text-[#9aa3b8]"
              >
                Print Travel Order
              </button>
            )}
          </div>

          {isPending ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                form={confirmFormId}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436]"
              >
                Confirm Step 1
              </button>

              <button
                type="submit"
                form={rejectFormId}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#E35E5E] px-4 text-sm font-semibold text-white transition hover:bg-[#ca4e4e]"
              >
                Reject Request
              </button>
            </div>
          ) : null}
        </div>
      </div>
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
        className={`inline-flex items-center gap-1.5 transition ${
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

function SummaryRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <p>
      <span className="font-semibold text-[#2f3339]">{label}:</span> {value}
    </p>
  );
}

function ApprovalStepCard({
  stepLabel,
  expectedApproverName,
  step,
  visual,
}: Readonly<{
  stepLabel: string;
  expectedApproverName: string | null;
  step: RequesterTravelOrderStep;
  visual: StepVisualState;
}>) {
  return (
    <article className={`rounded-lg border p-3 ${getStepToneClasses(visual.tone)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{stepLabel}</h4>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
          {visual.label}
        </span>
      </div>
      <p className="mt-1 text-xs">{visual.summary}</p>
      {expectedApproverName ? <p className="mt-1 text-xs">Expected approver: {expectedApproverName}</p> : null}
      {step.actionAtLabel ? <p className="mt-1 text-xs">Updated: {step.actionAtLabel}</p> : null}
      {step.remarks ? <p className="mt-1 text-xs">Remarks: {step.remarks}</p> : null}
    </article>
  );
}

function FieldWrapper({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">{label}</span>
      {children}
    </label>
  );
}

function getStatusPriority(status: string): number {
  const normalized = status.toUpperCase();
  if (normalized === "STEP1_APPROVED") return 0;
  if (normalized === "PENDING") return 1;
  if (normalized === "APPROVED") return 2;
  if (normalized === "RETURNED") return 3;
  if (normalized === "REJECTED" || normalized === "CANCELLED") return 4;
  return 5;
}

function getStepVisualState(
  order: ApproverTravelOrderItem,
  step: RequesterTravelOrderStep,
): StepVisualState {
  if (step.action) {
    return {
      label: formatActionLabel(step.action),
      tone: getActionTone(step.action),
      summary: step.actedByName
        ? `${formatActionLabel(step.action)} by ${step.actedByName}`
        : formatActionLabel(step.action),
    };
  }

  const normalizedStatus = order.status.toUpperCase();

  if (step.stepNo === 1) {
    if (normalizedStatus === "PENDING") {
      return { label: "Pending", tone: "pending", summary: "Awaiting your first-level review." };
    }
    if (normalizedStatus === "STEP1_APPROVED" || normalizedStatus === "APPROVED") {
      return { label: "Approved", tone: "success", summary: "Step 1 completed and forwarded." };
    }
    if (normalizedStatus === "REJECTED") {
      return { label: "Rejected", tone: "danger", summary: "Request was rejected at step 1." };
    }
    if (normalizedStatus === "RETURNED") {
      return {
        label: "Returned",
        tone: "pending",
        summary: "Request was returned for requester changes.",
      };
    }
  }

  if (step.stepNo === 2) {
    if (normalizedStatus === "PENDING") {
      return { label: "Waiting", tone: "muted", summary: "Waiting for step 1 review." };
    }
    if (normalizedStatus === "STEP1_APPROVED") {
      return { label: "Pending", tone: "pending", summary: "Awaiting RED/Admin final approval." };
    }
    if (normalizedStatus === "APPROVED") {
      return { label: "Approved", tone: "success", summary: "Final approval completed." };
    }
  }

  return { label: "Not Started", tone: "muted", summary: "No final-step action recorded yet." };
}

function getActionTone(action: TravelOrderApprovalAction): StepTone {
  if (action === "APPROVED") return "success";
  if (action === "RETURNED") return "pending";
  return "danger";
}

function formatActionLabel(action: TravelOrderApprovalAction): string {
  if (action === "RETURNED") return "Returned";
  if (action === "REJECTED") return "Rejected";
  return "Approved";
}

function getStepToneClasses(tone: StepTone): string {
  if (tone === "success") return "border-[#cdeedb] bg-[#f1fbf5] text-[#1f7d42]";
  if (tone === "danger") return "border-[#ffcece] bg-[#fff3f3] text-[#a33a3a]";
  if (tone === "pending") return "border-[#ffe4b5] bg-[#fff9ed] text-[#8a5b00]";
  return "border-[#dfe1ed] bg-[#f8f9fc] text-[#5d6780]";
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
