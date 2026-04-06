"use client";

import { useState, useEffect, useCallback } from "react";
import { Circle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getNodes } from "@/lib/backoffice/api";
import type { EngineNode, NodesFilter, PaginatedResponse } from "@/lib/backoffice/types";
import { DataTable, FilterSelect, StatusBadge } from "@/components/backoffice/data-table";

export default function NodesPage() {
  const [data, setData] = useState<PaginatedResponse<EngineNode> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<NodesFilter>({});
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNodes(filters, { page, pageSize });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
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

  function handleFilterChange(key: keyof NodesFilter, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : key === "lock_level" || key === "notification_state" ? parseInt(value) : value === "true",
    }));
    setPage(1);
  }

  const columns = [
    {
      key: "node_id",
      label: "Node ID",
      render: (value: unknown) => (
        <span className="font-mono text-xs">{String(value).substring(0, 8)}...</span>
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
      key: "ready_state",
      label: "Ready",
      render: (value: unknown) => (
        <span className={value ? "text-green-500" : "text-muted-foreground"}>
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "notification_state",
      label: "Notification",
      render: (value: unknown) => (
        <StatusBadge status={String(value)} variant="notification" />
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
      key: "updated_at",
      label: "Updated",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Circle className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Nodes</h1>
            <p className="text-sm text-muted-foreground font-mono">
              engine.nodes
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
        emptyMessage="No nodes found"
        filters={
          <>
            <FilterSelect
              label="Lock Level"
              value={filters.lock_level?.toString() || ""}
              options={[
                { value: "0", label: "Level 0 (Available)" },
                { value: "1", label: "Level 1 (Reserved)" },
                { value: "2", label: "Level 2 (Processing)" },
                { value: "3", label: "Level 3 (Exchanged)" },
              ]}
              onChange={(v) => handleFilterChange("lock_level", v)}
            />
            <FilterSelect
              label="Ready State"
              value={filters.ready_state?.toString() || ""}
              options={[
                { value: "true", label: "Ready" },
                { value: "false", label: "Not Ready" },
              ]}
              onChange={(v) => handleFilterChange("ready_state", v)}
            />
            <FilterSelect
              label="Notification"
              value={filters.notification_state?.toString() || ""}
              options={[
                { value: "0", label: "None" },
                { value: "1", label: "First" },
                { value: "2", label: "Reserved" },
                { value: "3", label: "Final" },
              ]}
              onChange={(v) => handleFilterChange("notification_state", v)}
            />
          </>
        }
      />
    </div>
  );
}
