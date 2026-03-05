"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Calendar,
  FileText,
} from "lucide-react";
import type {
  PtrSummaryItem,
  PtrSummaryPagination,
} from "@/src/server/ptr-summary/service";
import { useRealtimeTravelOrderRefresh } from "@/src/hooks/useRealtimeTravelOrderRefresh";

type PtrSummaryFilter = Readonly<{
  search?: string;
  status?: string;
  divisionId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}>;

type PtrSummaryTableProps = Readonly<{
  rows: readonly PtrSummaryItem[];
  pagination?: PtrSummaryPagination;
  currentFilter?: PtrSummaryFilter;
  basePath: string;
  title?: string;
  subtitle?: string;
  showDivision?: boolean;
  divisions?: readonly { id: number; name: string }[];
  divisionName?: string | null;
}>;

type SortDirection = "asc" | "desc" | null;
type SortColumn =
  | "orderNo"
  | "orderDate"
  | "requestedBy"
  | "destination"
  | "departureDate"
  | "status"
  | "travelDays"
  | null;

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
    [sortColumn]
  );

  const getSortIcon = useCallback(
    (column: SortColumn): ReactNode => {
      if (sortColumn !== column)
        return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
      if (sortDirection === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
      if (sortDirection === "desc")
        return <ChevronDown className="h-3.5 w-3.5" />;
      return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    },
    [sortColumn, sortDirection]
  );

  return { sortColumn, sortDirection, handleSort, getSortIcon };
}

function useTableFilter() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const clearFilter = useCallback(() => {
    setStatusFilter("all");
    setDivisionFilter("all");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  }, []);

  return {
    statusFilter,
    setStatusFilter,
    divisionFilter,
    setDivisionFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    searchQuery,
    setSearchQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilter,
    hasActiveFilter:
      statusFilter !== "all" ||
      divisionFilter !== "all" ||
      searchQuery !== "" ||
      startDate !== "" ||
      endDate !== "",
  };
}

function useTablePagination(
  totalItems: number,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
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
    [totalPages]
  );

  const nextPage = useCallback(
    () => goToPage(currentPage + 1),
    [currentPage, goToPage]
  );
  const prevPage = useCallback(
    () => goToPage(currentPage - 1),
    [currentPage, goToPage]
  );
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(
    () => goToPage(totalPages),
    [goToPage, totalPages]
  );

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

function getStatusBadgeClasses(status: string): string {
  const baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  switch (status.toUpperCase()) {
    case "APPROVED":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "PENDING":
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case "STEP1_APPROVED":
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case "REJECTED":
      return `${baseClasses} bg-red-100 text-red-800`;
    case "RETURNED":
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case "CANCELLED":
      return `${baseClasses} bg-gray-100 text-gray-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
}

export function PtrSummaryTable({
  rows,
  pagination,
  currentFilter,
  basePath,
  title = "PTR Summary",
  subtitle = "View travel order summaries",
  showDivision = false,
  divisions = [],
  divisionName,
}: PtrSummaryTableProps) {
  useRealtimeTravelOrderRefresh();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use server-side pagination if provided, otherwise client-side
  const isServerPaginated = pagination !== undefined;
  const totalItems = isServerPaginated ? pagination.total : rows.length;

  const {
    statusFilter,
    setStatusFilter,
    divisionFilter,
    setDivisionFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    searchQuery,
    setSearchQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilter,
    hasActiveFilter,
  } = useTableFilter();

  const {
    currentPage,
    totalPages,
    pageSize,
    showingFrom,
    showingTo,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
    canGoNext,
    canGoPrev,
  } = useTablePagination(totalItems, currentFilter?.limit ?? DEFAULT_PAGE_SIZE);

  const { sortColumn, sortDirection, handleSort, getSortIcon } = useTableSort();

  // Filter dropdown ref for click outside handling
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowFilterDropdown]);

  // Apply filters to URL for server-side filtering
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }

    if (showDivision && divisionFilter !== "all") {
      params.set("divisionId", divisionFilter);
    } else {
      params.delete("divisionId");
    }

    if (startDate) {
      params.set("startDate", startDate);
    } else {
      params.delete("startDate");
    }

    if (endDate) {
      params.set("endDate", endDate);
    } else {
      params.delete("endDate");
    }

    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
    setShowFilterDropdown(false);
  }, [
    searchQuery,
    statusFilter,
    divisionFilter,
    startDate,
    endDate,
    showDivision,
    searchParams,
    basePath,
    router,
    setShowFilterDropdown,
  ]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      if (isServerPaginated) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`${basePath}?${params.toString()}`);
      } else {
        goToPage(page);
      }
    },
    [isServerPaginated, searchParams, basePath, router, goToPage]
  );

  // Client-side sorting
  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return rows;

    return [...rows].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case "orderNo":
          comparison = a.orderNo.localeCompare(b.orderNo);
          break;
        case "orderDate":
          comparison = a.orderDateLabel.localeCompare(b.orderDateLabel);
          break;
        case "requestedBy":
          comparison = a.requestedBy.localeCompare(b.requestedBy);
          break;
        case "destination":
          comparison = a.destination.localeCompare(b.destination);
          break;
        case "departureDate":
          comparison = a.departureDateLabel.localeCompare(b.departureDateLabel);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "travelDays":
          comparison = a.travelDays - b.travelDays;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortColumn, sortDirection]);

  // Paginate rows (client-side)
  const paginatedRows = useMemo(() => {
    if (isServerPaginated) return sortedRows;

    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize, isServerPaginated]);

  // Sync URL params with state on mount
  useEffect(() => {
    if (currentFilter?.search !== undefined) {
      setSearchQuery(currentFilter.search);
    }
    if (currentFilter?.status !== undefined) {
      setStatusFilter(currentFilter.status);
    }
    if (currentFilter?.divisionId !== undefined) {
      setDivisionFilter(currentFilter.divisionId.toString());
    }
    if (currentFilter?.startDate !== undefined) {
      setStartDate(currentFilter.startDate);
    }
    if (currentFilter?.endDate !== undefined) {
      setEndDate(currentFilter.endDate);
    }
  }, [currentFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B9F41]/10">
            <FileText className="h-5 w-5 text-[#3B9F41]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#2f3339] sm:text-2xl">
              {title}
            </h2>
            {divisionName && (
              <p className="text-sm text-[#5d6780]">Department: {divisionName}</p>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-[#5d6780]">{subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, destination, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                hasActiveFilter
                  ? "border-[#3B9F41] bg-[#f1fbf5] text-[#3B9F41]"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilter && (
                <span className="ml-1 rounded-full bg-[#3B9F41] px-1.5 py-0.5 text-xs text-white">
                  !
                </span>
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B9F41]"
                    >
                      {STATUS_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showDivision && divisions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Division
                      </label>
                      <select
                        value={divisionFilter}
                        onChange={(e) => setDivisionFilter(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B9F41]"
                      >
                        <option value="all">All Divisions</option>
                        {divisions.map((division) => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-2 text-sm outline-none focus:border-[#3B9F41]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-2 text-sm outline-none focus:border-[#3B9F41]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 rounded-lg bg-[#3B9F41] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e7a32]"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={clearFilter}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#dfe1ed] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("orderNo")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Order No
                    {getSortIcon("orderNo")}
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("orderDate")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Order Date
                    {getSortIcon("orderDate")}
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("requestedBy")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Requested By
                    {getSortIcon("requestedBy")}
                  </button>
                </th>
                {showDivision && (
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                    Division
                  </th>
                )}
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("destination")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Destination
                    {getSortIcon("destination")}
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("departureDate")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Departure
                    {getSortIcon("departureDate")}
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  Return
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("travelDays")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Days
                    {getSortIcon("travelDays")}
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Status
                    {getSortIcon("status")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={showDivision ? 9 : 8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No PTR summary records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <PtrSummaryRow
                    key={row.id}
                    row={row}
                    showDivision={showDivision}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing {showingFrom} to {showingTo} of {totalItems} entries
          </span>
          <select
            value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-[#3B9F41]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={firstPage}
            disabled={!canGoPrev}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={prevPage}
            disabled={!canGoPrev}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[32px] rounded-lg px-2 py-1 text-sm font-medium ${
                    pageNum === currentPage
                      ? "bg-[#3B9F41] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={nextPage}
            disabled={!canGoNext}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={lastPage}
            disabled={!canGoNext}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PtrSummaryRow({
  row,
  showDivision,
}: {
  row: PtrSummaryItem;
  showDivision: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
        {row.orderNo}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {row.orderDateLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {row.requestedBy}
      </td>
      {showDivision && (
        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
          {row.division || "-"}
        </td>
      )}
      <td
        className="max-w-xs truncate px-4 py-3 text-gray-600"
        title={row.destination}
      >
        {row.destination}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {row.departureDateLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {row.returnDateLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {row.travelDays}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className={getStatusBadgeClasses(row.status)}>
          {row.status.replace(/_/g, " ")}
        </span>
      </td>
    </tr>
  );
}
