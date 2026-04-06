"use client";

import { useState, useEffect, useCallback } from "react";
import { Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSnapshots } from "@/lib/backoffice/api";
import type { SccSnapshot, SnapshotsFilter, PaginatedResponse } from "@/lib/backoffice/types";
import { DataTable, FilterSelect } from "@/components/backoffice/data-table";

export default function SnapshotsPage() {
  const [data, setData] = useState<PaginatedResponse<SccSnapshot> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SnapshotsFilter>({});
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSnapshots(filters, { page, pageSize });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch snapshots:", error);
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

  function handleFilterChange(key: keyof SnapshotsFilter, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value === "true" ? true : value === "false" ? false : value,
    }));
    setPage(1);
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
      key: "scc_prefix",
      label: "SCC Prefix",
      render: (value: unknown) => (
        <span className="font-mono text-xs text-primary">{String(value)}</span>
      ),
    },
    {
      key: "nodes",
      label: "Nodes",
      render: (value: unknown) => {
        const nodes = value as string[];
        return (
          <span className="text-sm">
            {nodes?.length || 0} nodes
          </span>
        );
      },
    },
    {
      key: "cycles",
      label: "Cycles",
      render: (value: unknown) => {
        const cycles = value as Array<{ cycle_length: number }>;
        return (
          <span className="text-sm">
            {cycles?.length || 0} cycles
          </span>
        );
      },
    },
    {
      key: "picked",
      label: "Picked",
      render: (value: unknown) => (
        <span className={value ? "text-green-500" : "text-muted-foreground"}>
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Active",
      render: (value: unknown) => (
        <span className={value ? "text-green-500" : "text-red-500"}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Camera className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              SCC Snapshots
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              engine.scc_snapshots
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
        searchPlaceholder="Search by SCC prefix..."
        emptyMessage="No snapshots found"
        filters={
          <>
            <FilterSelect
              label="Picked Status"
              value={filters.picked?.toString() || ""}
              options={[
                { value: "true", label: "Picked" },
                { value: "false", label: "Not Picked" },
              ]}
              onChange={(v) => handleFilterChange("picked", v)}
            />
            <FilterSelect
              label="Active Status"
              value={filters.is_active?.toString() || ""}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              onChange={(v) => handleFilterChange("is_active", v)}
            />
          </>
        }
      />
    </div>
  );
}
