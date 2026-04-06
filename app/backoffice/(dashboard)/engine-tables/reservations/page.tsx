"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { getReservations } from "@/lib/backoffice/api";
import type { CycleReservation, ReservationsFilter, PaginatedResponse, ReservationStatus } from "@/lib/backoffice/types";
import { DataTable, FilterSelect, StatusBadge } from "@/components/backoffice/data-table";

export default function ReservationsPage() {
  const [data, setData] = useState<PaginatedResponse<CycleReservation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ReservationsFilter>({});
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReservations(filters, { page, pageSize });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSearch(search: string) {
    setFilters((prev) => ({ ...prev, search }));
    setPage(1);
  }

  function handleFilterChange(key: keyof ReservationsFilter, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value as ReservationStatus,
    }));
    setPage(1);
  }

  // Check if reservation is expiring soon (within 1 hour)
  function isExpiringSoon(expiresAt: string): boolean {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() < oneHour && expiry.getTime() > now.getTime();
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: unknown) => (
        <span className="font-mono text-sm">#{value}</span>
      ),
      width: "80px",
    },
    {
      key: "cycle_fingerprint",
      label: "Fingerprint",
      render: (value: unknown) => (
        <span className="font-mono text-xs">{String(value).substring(0, 12)}...</span>
      ),
    },
    {
      key: "scc_prefix",
      label: "SCC Prefix",
      render: (value: unknown) => (
        <span className="font-mono text-xs text-primary">{String(value)}</span>
      ),
    },
    {
      key: "cycle_length",
      label: "Length",
      render: (value: unknown) => (
        <span className="text-sm">{value} nodes</span>
      ),
      width: "100px",
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <StatusBadge status={String(value)} variant="reservation" />
      ),
    },
    {
      key: "expires_at",
      label: "Expires",
      render: (value: unknown, row: CycleReservation) => {
        const expiringSoon = isExpiringSoon(String(value));
        return (
          <span className={`flex items-center gap-1 text-xs ${expiringSoon ? "text-yellow-500" : "text-muted-foreground"}`}>
            {expiringSoon && <Clock className="h-3 w-3" />}
            {new Date(String(value)).toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "reserved_at",
      label: "Reserved",
      render: (value: unknown) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/backoffice/engine-tables"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <RotateCcw className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Cycle Reservations
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              engine.cycle_reservations
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        total={data?.total || 0}
        page={data?.page || 1}
        pageSize={pageSize}
        totalPages={data?.totalPages || 1}
        loading={loading}
        onPageChange={setPage}
        onSearch={handleSearch}
        searchPlaceholder="Search by fingerprint or SCC prefix..."
        emptyMessage="No reservations found"
        filters={
          <FilterSelect
            label="Status"
            value={filters.status || ""}
            options={[
              { value: "RESERVED", label: "Reserved" },
              { value: "COMMIT_READY", label: "Commit Ready" },
              { value: "EXECUTED", label: "Executed" },
              { value: "EXPIRED", label: "Expired" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            onChange={(v) => handleFilterChange("status", v)}
          />
        }
      />
    </div>
  );
}
