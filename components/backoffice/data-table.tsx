"use client";

/**
 * ============================================================================
 * REUSABLE DATA TABLE COMPONENT
 * ============================================================================
 * Generic data table with pagination, search, and filters for Back Office.
 */

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
} from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSearch?: (search: string) => void;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  filters?: React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total,
  page,
  pageSize,
  totalPages,
  loading,
  onPageChange,
  onSearch,
  onRowClick,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  filters,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  function handleSearch(value: string) {
    setSearchValue(value);
    onSearch?.(value);
  }

  function getValue(row: T, key: string): unknown {
    const keys = key.split(".");
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {(onSearch || filters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearch && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-input bg-secondary pl-10 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchValue && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-20 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-20 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-border/50 ${
                      onRowClick
                        ? "cursor-pointer hover:bg-secondary/50 transition-colors"
                        : ""
                    }`}
                  >
                    {columns.map((col) => {
                      const value = getValue(row, String(col.key));
                      return (
                        <td
                          key={String(col.key)}
                          className="px-4 py-3 text-foreground"
                        >
                          {col.render ? col.render(value, row) : String(value ?? "-")}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm text-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Filter select component
interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={label}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: string;
  variant?: "lock" | "notification" | "reservation" | "ticket" | "review";
}

export function StatusBadge({ status, variant = "reservation" }: StatusBadgeProps) {
  const getColors = () => {
    if (variant === "lock") {
      const level = parseInt(status);
      switch (level) {
        case 0:
          return "bg-green-500/10 text-green-500";
        case 1:
          return "bg-yellow-500/10 text-yellow-500";
        case 2:
          return "bg-orange-500/10 text-orange-500";
        case 3:
          return "bg-blue-500/10 text-blue-500";
        default:
          return "bg-muted text-muted-foreground";
      }
    }

    if (variant === "notification") {
      const level = parseInt(status);
      switch (level) {
        case 0:
          return "bg-muted text-muted-foreground";
        case 1:
          return "bg-blue-500/10 text-blue-500";
        case 2:
          return "bg-yellow-500/10 text-yellow-500";
        case 3:
          return "bg-green-500/10 text-green-500";
        default:
          return "bg-muted text-muted-foreground";
      }
    }

    if (variant === "ticket") {
      switch (status) {
        case "open":
          return "bg-yellow-500/10 text-yellow-500";
        case "in_progress":
          return "bg-blue-500/10 text-blue-500";
        case "resolved":
          return "bg-green-500/10 text-green-500";
        case "closed":
          return "bg-muted text-muted-foreground";
        default:
          return "bg-muted text-muted-foreground";
      }
    }

    if (variant === "review") {
      switch (status) {
        case "pending":
          return "bg-yellow-500/10 text-yellow-500";
        case "in_review":
          return "bg-blue-500/10 text-blue-500";
        case "approved":
          return "bg-green-500/10 text-green-500";
        case "rejected":
          return "bg-red-500/10 text-red-500";
        default:
          return "bg-muted text-muted-foreground";
      }
    }

    // reservation variant
    switch (status) {
      case "RESERVED":
        return "bg-yellow-500/10 text-yellow-500";
      case "COMMIT_READY":
        return "bg-blue-500/10 text-blue-500";
      case "EXECUTED":
        return "bg-green-500/10 text-green-500";
      case "EXPIRED":
        return "bg-red-500/10 text-red-500";
      case "CANCELLED":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getColors()}`}
    >
      {status}
    </span>
  );
}
