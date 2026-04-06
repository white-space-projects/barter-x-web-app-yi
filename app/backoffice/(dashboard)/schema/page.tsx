"use client";

/**
 * ============================================================================
 * BACK OFFICE SCHEMA REFERENCE PAGE
 * ============================================================================
 * Engine schema documentation with table structures.
 */

import { BookOpen, Database } from "lucide-react";

interface Column {
  name: string;
  type: string;
  meaning: string;
}

interface Table {
  name: string;
  schema: string;
  description: string;
  columns: Column[];
}

const tables: Table[] = [
  {
    name: "nodes",
    schema: "engine",
    description: "Internal node-state mirror for graph processing. Maps 1:1 with application.offers.offer_id",
    columns: [
      { name: "node_id", type: "UUID", meaning: "Primary key, matches offer_id from application.offers" },
      { name: "ready_state", type: "BOOLEAN", meaning: "Whether the offer is ready for trading (user confirmed pickup readiness)" },
      { name: "ready_updated_at", type: "TIMESTAMPTZ", meaning: "When ready_state was last changed" },
      { name: "lock_level", type: "SMALLINT (0-3)", meaning: "0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED" },
      { name: "lock_updated_at", type: "TIMESTAMPTZ", meaning: "When lock_level was last changed" },
      { name: "notification_state", type: "SMALLINT (0-3)", meaning: "0=none, 1=first notification, 2=reserved, 3=final" },
      { name: "notification_updated_at", type: "TIMESTAMPTZ", meaning: "When notification_state was last changed" },
      { name: "is_active", type: "BOOLEAN", meaning: "Whether the node is active in the graph" },
      { name: "is_active_updated_at", type: "TIMESTAMPTZ", meaning: "When is_active was last changed" },
      { name: "created_at", type: "TIMESTAMPTZ", meaning: "When the node was created" },
      { name: "updated_at", type: "TIMESTAMPTZ", meaning: "When the node was last modified" },
    ],
  },
  {
    name: "edges",
    schema: "engine",
    description: "Internal directed graph edges. Maps to application.hooks (source_offer_id -> target_offer_id)",
    columns: [
      { name: "src_node_id", type: "UUID", meaning: "Source node ID (the offer that wants something)" },
      { name: "dst_node_id", type: "UUID", meaning: "Destination node ID (the offer being wanted)" },
      { name: "is_active", type: "BOOLEAN", meaning: "Whether the edge is active in the graph" },
      { name: "lock_level", type: "SMALLINT (0-3)", meaning: "Edge lock level, similar to node lock_level" },
      { name: "lock_updated_at", type: "TIMESTAMPTZ", meaning: "When lock_level was last changed" },
      { name: "created_at", type: "TIMESTAMPTZ", meaning: "When the edge was created" },
      { name: "updated_at", type: "TIMESTAMPTZ", meaning: "When the edge was last modified" },
    ],
  },
  {
    name: "scc_snapshots",
    schema: "engine",
    description: "Stores SCC (Strongly Connected Components) snapshot outputs for cycle detection",
    columns: [
      { name: "id", type: "BIGSERIAL", meaning: "Primary key, auto-incrementing" },
      { name: "scc_prefix", type: "TEXT", meaning: "Identifier prefix for grouping related SCCs" },
      { name: "nodes", type: "JSONB", meaning: "Array of node UUIDs in this SCC" },
      { name: "cycles", type: "JSONB", meaning: "Array of cycle objects: [{cycle:[], cycle_length:int, cycle_fingerprint:text}]" },
      { name: "picked", type: "BOOLEAN", meaning: "Whether a cycle from this snapshot has been selected for processing" },
      { name: "is_active", type: "BOOLEAN", meaning: "Whether this snapshot is still valid/active" },
      { name: "created_at", type: "TIMESTAMPTZ", meaning: "When the snapshot was created" },
    ],
  },
  {
    name: "cycle_reservations",
    schema: "engine",
    description: "Stores reserved cycles and their lifecycle state",
    columns: [
      { name: "id", type: "BIGSERIAL", meaning: "Primary key, auto-incrementing" },
      { name: "cycle_fingerprint", type: "TEXT", meaning: "Unique identifier for the cycle path" },
      { name: "snapshot_id", type: "BIGINT", meaning: "Foreign key to scc_snapshots.id" },
      { name: "scc_prefix", type: "TEXT", meaning: "SCC prefix this cycle belongs to" },
      { name: "cycle", type: "JSONB", meaning: "The cycle path as array of node IDs" },
      { name: "node_ids", type: "JSONB", meaning: "Array of all node UUIDs participating in cycle" },
      { name: "cycle_length", type: "INT", meaning: "Number of nodes in the cycle" },
      { name: "status", type: "TEXT", meaning: "RESERVED | COMMIT_READY | EXECUTED | EXPIRED | CANCELLED" },
      { name: "reserved_at", type: "TIMESTAMPTZ", meaning: "When the cycle was reserved" },
      { name: "expires_at", type: "TIMESTAMPTZ", meaning: "When the reservation expires" },
      { name: "updated_at", type: "TIMESTAMPTZ", meaning: "When the record was last modified" },
    ],
  },
];

export default function SchemaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Schema Reference
          </h1>
          <p className="text-sm text-muted-foreground">
            Engine schema table structures and column definitions
          </p>
        </div>
      </div>

      {/* Tables */}
      <div className="space-y-8">
        {tables.map((table) => (
          <div
            key={`${table.schema}.${table.name}`}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Table Header */}
            <div className="border-b border-border bg-secondary/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-mono text-lg font-semibold text-primary">
                    {table.schema}.{table.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {table.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Columns Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Column
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr
                      key={col.name}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="px-6 py-3 font-mono text-foreground">
                        {col.name}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-primary">
                        {col.type}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {col.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Notes</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            All engine tables have Row Level Security (RLS) enabled with no public policies.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            Access is restricted to service_role only. Backend services using the service_role key bypass RLS automatically.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            Sync triggers automatically propagate changes from application.offers to engine.nodes and application.hooks to engine.edges.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            Lock levels: 0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED
          </li>
        </ul>
      </div>
    </div>
  );
}
