"use client";

/**
 * ============================================================================
 * BACK OFFICE DASHBOARD
 * ============================================================================
 * Main dashboard with key counters and summaries.
 */

import { useState, useEffect } from "react";
import {
  Activity,
  GitBranch,
  Circle,
  Camera,
  RotateCcw,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getMetrics } from "@/lib/backoffice/api";
import type { DashboardMetrics, TimeRange } from "@/lib/backoffice/types";

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "3h", label: "3h" },
  { value: "6h", label: "6h" },
  { value: "12h", label: "12h" },
  { value: "16h", label: "16h" },
  { value: "1d", label: "1d" },
  { value: "2d", label: "2d" },
  { value: "1w", label: "1w" },
  { value: "1m", label: "1m" },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMetrics(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Engine monitoring and metrics overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === range.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Ingest Events */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Ingest Events
                </h2>
                <p className="text-xs text-muted-foreground">
                  Events received by time window
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.entries(metrics.ingestEvents).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg bg-secondary/50 p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground mb-1">{key}</p>
                  <p className="text-xl font-semibold text-foreground">
                    {value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Active Edges */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Active Edges
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.activeEdges.toLocaleString()}
              </p>
            </div>

            {/* Snapshots */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                  <Camera className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">Snapshots</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.snapshots.total.toLocaleString()}
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-muted-foreground">
                  Active:{" "}
                  <span className="text-foreground">
                    {metrics.snapshots.active}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Unpicked:{" "}
                  <span className="text-foreground">
                    {metrics.snapshots.unpicked}
                  </span>
                </span>
              </div>
            </div>

            {/* Total Nodes */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                  <Circle className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Total Nodes
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {(
                  metrics.nodesByLockLevel.level0 +
                  metrics.nodesByLockLevel.level1 +
                  metrics.nodesByLockLevel.level2 +
                  metrics.nodesByLockLevel.level3
                ).toLocaleString()}
              </p>
            </div>

            {/* Total Reservations */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Reservations
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {Object.values(metrics.cycleReservations)
                  .reduce((a, b) => a + b, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          {/* Nodes by Lock Level */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Nodes by Lock Level
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Level 0 (Available)", value: metrics.nodesByLockLevel.level0, color: "bg-green-500" },
                { label: "Level 1 (Reserved)", value: metrics.nodesByLockLevel.level1, color: "bg-yellow-500" },
                { label: "Level 2 (Processing)", value: metrics.nodesByLockLevel.level2, color: "bg-orange-500" },
                { label: "Level 3 (Exchanged)", value: metrics.nodesByLockLevel.level3, color: "bg-blue-500" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-secondary/50 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`h-2 w-2 rounded-full ${item.color}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle Reservations by Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Cycle Reservations by Status
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.cycleReservations).map(
                    ([status, count]) => (
                      <tr key={status} className="border-b border-border/50">
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              status === "RESERVED"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : status === "COMMIT_READY"
                                ? "bg-blue-500/10 text-blue-500"
                                : status === "EXECUTED"
                                ? "bg-green-500/10 text-green-500"
                                : status === "EXPIRED"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-foreground">
                          {count.toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Failed to load metrics
        </div>
      )}
    </div>
  );
}
