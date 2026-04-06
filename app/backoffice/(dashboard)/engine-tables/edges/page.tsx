"use client";

import { useState, useEffect, useCallback } from "react";
import { GitBranch, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getEdges } from "@/lib/backoffice/api";
import type { EngineEdge, EdgesFilter, PaginatedResponse } from "@/lib/backoffice/types";
import { DataTable, FilterSelect, StatusBadge } from "@/components/backoffice/data-table";

export default function EdgesPage() {
  const [data, setData] = useState<PaginatedResponse<EngineEdge> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<EdgesFilter>({});
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEdges(filters, { page, pageSize });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch edges:", error);
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

  function handleFilterChange(key: keyof EdgesFilter, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value === "true" ? true : value === "false" ? false : value,
    }));
    setPage(1);
  }

  const columns = [
    {
      key: "src_node_id",
      label: "Source Node",
      render: (value: unknown) => (
        <span className="font-mono text-xs">{String(value).substring(0, 8)}...</span>
      ),
    },
    {
      key: "_arrow",
      label: "",
      render: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
      width: "40px",
    },
    {
      key: "dst_node_id",
      label: "Destination Node",
      render: (value: unknown) => (
        <span className="font-mono text-xs">{String(value).substring(0, 8)}...</span>
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
      key: "lock_level",
      label: "Lock Level",
      render: (value: unknown) => (
        <StatusBadge status={String(value)} variant="lock" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <GitBranch className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Edges</h1>
            <p className="text-sm text-muted-foreground font-mono">
              engine.edges
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
        searchPlaceholder="Search by node ID..."
        emptyMessage="No edges found"
        filters={
          <FilterSelect
            label="Active Status"
            value={filters.is_active?.toString() || ""}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            onChange={(v) => handleFilterChange("is_active", v)}
          />
        }
      />
    </div>
  );
}
