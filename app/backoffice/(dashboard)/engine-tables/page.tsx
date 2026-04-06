"use client";

import Link from "next/link";
import { Database, Circle, GitBranch, Camera, RotateCcw } from "lucide-react";

const tables = [
  {
    id: "nodes",
    label: "Nodes",
    description: "Internal node-state mirror for offers",
    icon: Circle,
    href: "/backoffice/engine-tables/nodes",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    id: "edges",
    label: "Edges",
    description: "Directed graph edges (hooks)",
    icon: GitBranch,
    href: "/backoffice/engine-tables/edges",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    id: "snapshots",
    label: "SCC Snapshots",
    description: "Strongly Connected Component snapshots",
    icon: Camera,
    href: "/backoffice/engine-tables/snapshots",
    color: "text-green-500 bg-green-500/10",
  },
  {
    id: "reservations",
    label: "Cycle Reservations",
    description: "Reserved cycles and their lifecycle",
    icon: RotateCcw,
    href: "/backoffice/engine-tables/reservations",
    color: "text-orange-500 bg-orange-500/10",
  },
];

export default function EngineTablesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Engine Tables
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse and inspect engine schema tables
          </p>
        </div>
      </div>

      {/* Table Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {tables.map((table) => {
          const Icon = table.icon;
          return (
            <Link
              key={table.id}
              href={table.href}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${table.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {table.label}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {table.description}
                  </p>
                  <p className="mt-2 text-xs font-mono text-primary">
                    engine.{table.id === "reservations" ? "cycle_reservations" : table.id === "snapshots" ? "scc_snapshots" : table.id}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
