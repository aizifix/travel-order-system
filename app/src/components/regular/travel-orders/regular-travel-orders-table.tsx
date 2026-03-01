"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Filter, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Copy } from "lucide-react";
import type {
  RequesterTravelOrderItem,
  TravelOrderCreationLookups,
  TravelOrderLookupOption,
} from "@/src/server/travel-orders/service";
import {
  OtherStaffFields,
  TravelScheduleFields,
} from "@/src/components/regular/travel-orders/travel-order-schedule-and-staff-fields";
import { ApprovalWorkflowTimeline } from "@/src/components/travel-orders/approval-workflow-timeline";
import { OrderNumberCopy } from "@/src/components/travel-orders/order-number-copy";

type RegularTravelOrdersTableProps = Readonly<{
  rows: readonly RequesterTravelOrderItem[];
  lookups: TravelOrderCreationLookups;
  onUpdate: (formData: FormData) => Promise<void>;
  onCancel: (formData: FormData) => Promise<void>;
}>;

type SortDirection = "asc" | "desc" | null;
type SortColumn = "orderNo" | "orderDate" | "destination" | "purpose" | "departureDate" | "status" | null;

const DRAWER_CLOSE_DELAY_MS = 300;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Custom hook for table sorting
function useTableSort() {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback((column: SortColumn) => {
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
  }, [sortColumn]);

  const getSortIcon = useCallback((column: SortColumn): ReactNode => {
    if (sortColumn !== column) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    if (sortDirection === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
    if (sortDirection === "desc") return <ChevronDown className="h-3.5 w-3.5" />;
    return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
  }, [sortColumn, sortDirection]);

  return { sortColumn, sortDirection, handleSort, getSortIcon };
}

// Custom hook for table filtering
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

// Custom hook for table pagination
function useTablePagination(totalItems: number, pageSize: number = DEFAULT_PAGE_SIZE) {
  const [currentPageState, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSizeState));
  const currentPage = Math.min(currentPageState, totalPages);
  const startIndex = (currentPage - 1) * pageSizeState;
  const endIndex = Math.min(startIndex + pageSizeState, totalItems);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = endIndex;

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

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
    totalItems,
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

// Custom hook for drawer state
function useDrawer() {
  const [selectedOrder, setSelectedOrder] = useState<RequesterTravelOrderItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = useCallback((order: RequesterTravelOrderItem) => {
    setSelectedOrder(order);
    requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedOrder(null);
    }, DRAWER_CLOSE_DELAY_MS);
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
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

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

export function RegularTravelOrdersTable({
  rows,
  lookups,
  onUpdate,
  onCancel,
}: RegularTravelOrdersTableProps) {
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks
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
  const pagination = useTablePagination(rows.length, DEFAULT_PAGE_SIZE);
  const { selectedOrder, isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useDrawer();

  // Filter and sort data
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        row.orderNo.toLowerCase().includes(query) ||
        row.destination.toLowerCase().includes(query) ||
        row.purpose.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((row) => row.status.toUpperCase() === statusFilter.toUpperCase());
    }

    // Apply sorting
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
  }, [rows, searchQuery, statusFilter, sortColumn, sortDirection]);

  // Paginate data
  const paginatedRows = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredAndSortedRows.slice(start, end);
  }, [filteredAndSortedRows, pagination.currentPage, pagination.pageSize]);

  // Close filter dropdown when clicking outside
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
    <>
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between border-b border-[#dfe1ed] px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8398]" />
            <input
              type="text"
              placeholder="Search TO no., destination, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-72 rounded-md border border-[#dfe1ed] bg-white pl-9 pr-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
            />
          </div>
          
          {/* Filter Dropdown */}
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
            {showFilterDropdown && (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#dfe1ed] bg-white p-2 shadow-lg">
                <p className="px-2 py-1.5 text-xs font-semibold text-[#5d6780]">Status</p>
                {[
                  { value: "all", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "STEP1_APPROVED", label: "Step 1 Approved" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "RETURNED", label: "Returned" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "DRAFT", label: "Draft" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                      statusFilter === option.value
                        ? "bg-[#f1fbf5] text-[#3B9F41] font-semibold"
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
            )}
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilter}
              className="text-xs text-[#5d6780] underline hover:text-[#3B9F41]"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
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
              paginatedRows.map((row) => {
                return (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(row.orderNo);
                          }}
                          className="inline-flex items-center justify-center rounded p-0.5 text-[#7b8398] transition hover:bg-[#f3f5fa] hover:text-[#3B9F41]"
                          title="Copy TO number"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </BodyCell>
                    <BodyCell>{row.orderDateLabel}</BodyCell>
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
                        View
                      </button>
                    </BodyCell>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-sm text-[#7d8598]"
                >
                  {hasActiveFilter
                    ? `No travel orders found matching your filters.`
                    : "You have not created any travel orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedRows.length > 0 && (
        <div className="flex items-center justify-between border-t border-[#dfe1ed] px-4 py-3">
          <p className="text-xs text-[#7b8398]">
            Showing <span className="font-semibold text-[#2f3339]">{pagination.showingFrom}-{pagination.showingTo}</span> of{" "}
            <span className="font-semibold text-[#2f3339]">{filteredAndSortedRows.length}</span>
          </p>
          <div className="flex items-center gap-4">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.changePageSize(Number(e.target.value))}
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
      )}

      {/* Drawer Portal */}
      {selectedOrder && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out ${
              isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />
          {createPortal(
            <div
              className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[620px] transform bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
                isDrawerOpen ? "translate-x-0" : "translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Travel order details"
            >
              <TravelOrderDrawer
                order={selectedOrder}
                lookups={lookups}
                onUpdate={onUpdate}
                onCancel={onCancel}
                onClose={handleCloseDrawer}
              />
            </div>,
            document.body,
          )}
        </>
      )}
    </>
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
  return (
    <th className="px-5 py-4 text-xs font-semibold tracking-tight whitespace-nowrap">
      {children}
    </th>
  );
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <td className={`px-5 py-3.5 align-middle ${className ?? ""}`}>{children}</td>
  );
}

function TravelOrderDrawer({
  order,
  lookups,
  onUpdate,
  onCancel,
  onClose,
}: Readonly<{
  order: RequesterTravelOrderItem;
  lookups: TravelOrderCreationLookups;
  onUpdate: (formData: FormData) => Promise<void>;
  onCancel: (formData: FormData) => Promise<void>;
  onClose: () => void;
}>) {
  const normalizedStatus = order.status.toUpperCase();
  const isEditable = normalizedStatus === "PENDING";
  const isPrintable = normalizedStatus === "APPROVED";
  const updateFormId = `update-travel-order-${order.id}`;
  const printHref = `/api/travel-orders/${order.id}/print`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-[#dfe1ed] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#1a1d1f]">Travel Order Details</h2>
              <StatusPill status={order.status} />
            </div>
            <OrderNumberCopy orderNo={order.orderNo} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f] cursor-pointer"
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
                ? "Awaiting Step 1 review by first approver."
                : normalizedStatus === "STEP1_APPROVED"
                  ? "Step 1 completed. Awaiting RED/Admin final approval."
                  : normalizedStatus === "APPROVED"
                    ? "Fully approved and ready for printing."
                    : normalizedStatus === "REJECTED"
                      ? "Request was rejected."
                      : normalizedStatus === "RETURNED"
                        ? "Returned to requester for changes."
                        : normalizedStatus === "CANCELLED"
                          ? "Request was cancelled."
                          : normalizedStatus === "DRAFT"
                            ? "Still in draft mode."
                            : "Viewing approval workflow status."}
            </p>
            <div className="mt-4 rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
              <ApprovalWorkflowTimeline order={order} />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4">
            <div className="grid gap-3 text-sm text-[#4a5266] sm:grid-cols-2">
              <SummaryRow label="Date Posted" value={order.orderDateLabel} />
              <SummaryRow
                label="Travel Dates"
                value={`${order.departureDateLabel} - ${order.returnDateLabel}`}
              />
              <SummaryRow label="Destination" value={order.destination} />
            </div>
            <div className="mt-3 rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#4a5266]">
              <p className="font-semibold text-[#2f3339]">Purpose</p>
              <p className="mt-1 whitespace-pre-wrap break-words">
                {order.purpose.trim() ? order.purpose : "-"}
              </p>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
            Editable Details
          </h3>
          {isEditable ? (
            <p className="mt-1 text-xs text-[#7d8598]">
              This request is still pending step 1. You can update details or
              cancel the request.
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#7d8598]">
              Editing is disabled because this request is no longer in pending
              step 1.
            </p>
          )}

          <form
            id={updateFormId}
            key={`update-${order.id}`}
            action={onUpdate}
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="travelOrderId" value={order.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name="travelTypeId"
                label="Type of Travel"
                options={lookups.travelTypes}
                defaultValue={order.travelTypeId}
                required
                disabled={!isEditable}
              />
              <SelectField
                name="transportationId"
                label="Means of Transportation"
                options={lookups.transportations}
                defaultValue={order.transportationId}
                required
                disabled={!isEditable}
              />
              <SelectField
                name="programId"
                label="Program"
                options={lookups.programs}
                defaultValue={order.programId}
                includeEmptyOption
                emptyOptionLabel="None / Not Applicable"
                disabled={!isEditable}
              />
              <SelectField
                name="recommendingApproverId"
                label="Recommending Approver (Step 1)"
                options={lookups.recommendingApprovers}
                defaultValue={order.recommendingApproverId}
                required
                disabled={!isEditable}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextareaField
                name="specificDestination"
                label="Specific Destination"
                rows={3}
                defaultValue={order.destination}
                required
                disabled={!isEditable}
              />
              <TextareaField
                name="specificPurpose"
                label="Specific Purpose"
                rows={3}
                defaultValue={order.purpose}
                required
                disabled={!isEditable}
              />
              <InputField
                name="fundingSource"
                label="Funding Source"
                defaultValue={order.fundingSource}
                disabled={!isEditable}
              />
              <TextareaField
                name="remarks"
                label="Remarks / Special Instructions"
                rows={2}
                defaultValue={order.remarks}
                disabled={!isEditable}
              />
            </div>

            <TravelScheduleFields
              disabled={!isEditable}
              departureDateDefault={order.departureDateIso}
              returnDateDefault={order.returnDateIso}
              travelDaysDefault={order.travelDays}
              destinationDefault={order.destination}
              purposeDefault={order.purpose}
            />

            <div className="space-y-4">
              <InputField
                name="travelStatusRemarks"
                label="Travel Status Remarks"
                defaultValue={order.travelStatusRemarks}
                disabled={!isEditable}
              />
              <OtherStaffFields
                disabled={!isEditable}
                hasOtherStaffDefault={order.hasOtherStaff}
              />
            </div>
          </form>

          {isEditable ? (
            <form
              key={`cancel-${order.id}`}
              action={onCancel}
              className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff7f7] p-3"
            >
              <input type="hidden" name="travelOrderId" value={order.id} />
              <FieldWrapper label="Cancellation Reason (Optional)">
                <textarea
                  name="cancelReason"
                  rows={2}
                  className="w-full rounded-lg border border-[#ffcece] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#e35e5e] focus:ring-1 focus:ring-[#e35e5e] resize-none"
                  placeholder="Add context for why this pending request is being cancelled"
                />
              </FieldWrapper>
              <button
                type="submit"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#E35E5E] px-4 text-sm font-semibold text-white transition hover:bg-[#ca4e4e] cursor-pointer"
              >
                Cancel Request
              </button>
            </form>
          ) : null}
          </section>
        </div>

        <div className="flex-none border-t border-[#dfe1ed] bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="grid grid-cols-2 gap-2">
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
            <button
              type="submit"
              form={updateFormId}
              disabled={!isEditable}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              Save Pending Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusPriority(status: string): number {
  const normalized = status.toUpperCase();
  if (normalized === "PENDING") {
    return 0;
  }
  if (normalized === "STEP1_APPROVED") {
    return 1;
  }
  if (normalized === "DRAFT") {
    return 2;
  }
  return 3;
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

function InputField({
  name,
  label,
  defaultValue,
  type = "text",
  min,
  max,
  required,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  defaultValue?: string;
  type?: "text" | "date" | "number";
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
}>) {
  return (
    <FieldWrapper label={label}>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
      />
    </FieldWrapper>
  );
}

function TextareaField({
  name,
  label,
  rows,
  defaultValue,
  required,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  rows: number;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}>) {
  return (
    <FieldWrapper label={label}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7] resize-none"
      />
    </FieldWrapper>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
  required,
  disabled,
  includeEmptyOption,
  emptyOptionLabel = "Select an option",
}: Readonly<{
  name: string;
  label: string;
  options: readonly TravelOrderLookupOption[];
  defaultValue?: number | null;
  required?: boolean;
  disabled?: boolean;
  includeEmptyOption?: boolean;
  emptyOptionLabel?: string;
}>) {
  return (
    <FieldWrapper label={label}>
      <select
        name={name}
        required={required}
        disabled={disabled || options.length === 0}
        defaultValue={
          defaultValue != null
            ? String(defaultValue)
            : includeEmptyOption
              ? ""
              : String(options[0]?.id ?? "")
        }
        className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
      >
        {includeEmptyOption ? (
          <option value="">{emptyOptionLabel}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </FieldWrapper>
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
