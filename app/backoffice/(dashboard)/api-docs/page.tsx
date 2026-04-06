"use client";

/**
 * ============================================================================
 * BACK OFFICE API DOCS PAGE
 * ============================================================================
 * API documentation with sample requests and responses.
 */

import { useState } from "react";
import { FileCode, Copy, Check } from "lucide-react";

interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  category: string;
  request?: object | null;
  response: object;
}

const endpoints: ApiEndpoint[] = [
  // Phase 1 - Ingest
  {
    id: "ingest",
    method: "POST",
    path: "/v1/ingest",
    description: "Ingest offer/hook events from the application layer",
    category: "Phase 1 - Ingest",
    request: {
      event_type: "OFFER_CREATED | OFFER_UPDATED | HOOK_CREATED | HOOK_DELETED",
      offer_id: "uuid",
      user_id: "uuid",
      timestamp: "ISO 8601 timestamp",
      payload: {
        ready_state: "boolean (optional)",
        lock_level: "0-3 (optional)",
        source_offer_id: "uuid (for hook events)",
        target_offer_id: "uuid (for hook events)",
      },
    },
    response: {
      success: true,
      event_id: "uuid",
      processed_at: "ISO 8601 timestamp",
    },
  },

  // Simulate
  {
    id: "simulate",
    method: "POST",
    path: "/engine/simulate",
    description: "Generate test data for the trade engine",
    category: "Back Office",
    request: {
      users: 100,
      nodes: 150,
      edges: 300,
      seed: 42,
    },
    response: {
      success: true,
      run_id: "uuid",
      created_users: 100,
      created_nodes: 150,
      created_edges: 300,
      created_scc_snapshots: 15,
    },
  },

  // Config
  {
    id: "config-get",
    method: "GET",
    path: "/engine/config",
    description: "Get current engine configuration",
    category: "Back Office",
    request: null,
    response: {
      PHASE2_POLL_SECONDS: 5,
      MAX_PREFIX_PER_TICK: 10,
      RESERVATION_TTL_SECONDS: 300,
      RULESET1_STRATEGY: "FIFO",
      LOCK0_PREFERENCE: true,
      SHORTEST_CYCLE_TIEBREAK: true,
    },
  },
  {
    id: "config-put",
    method: "PUT",
    path: "/engine/config",
    description: "Update engine configuration",
    category: "Back Office",
    request: {
      PHASE2_POLL_SECONDS: 10,
      RULESET1_STRATEGY: "LIFO",
    },
    response: {
      PHASE2_POLL_SECONDS: 10,
      MAX_PREFIX_PER_TICK: 10,
      RESERVATION_TTL_SECONDS: 300,
      RULESET1_STRATEGY: "LIFO",
      LOCK0_PREFERENCE: true,
      SHORTEST_CYCLE_TIEBREAK: true,
    },
  },

  // Metrics
  {
    id: "metrics",
    method: "GET",
    path: "/engine/metrics",
    description: "Get engine metrics and statistics",
    category: "Back Office",
    request: null,
    response: {
      ingest_events: {
        "15m": 45,
        "1h": 180,
        "6h": 1200,
      },
      active_edges: 350,
      nodes_by_lock_level: {
        "0": 280,
        "1": 45,
        "2": 15,
        "3": 10,
      },
      snapshots: {
        total: 120,
        active: 85,
        unpicked: 25,
      },
    },
  },

  // Query
  {
    id: "query",
    method: "POST",
    path: "/engine/query",
    description: "Execute SQL query on engine schema (read-only)",
    category: "Back Office",
    request: {
      sql: "SELECT * FROM engine.nodes WHERE lock_level = 0 LIMIT 10",
    },
    response: {
      success: true,
      columns: ["node_id", "lock_level", "ready_state", "is_active"],
      rows: [
        {
          node_id: "abc-123",
          lock_level: 0,
          ready_state: true,
          is_active: true,
        },
      ],
      row_count: 1,
      execution_time_ms: 12,
    },
  },
];

export default function ApiDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const categories = [...new Set(endpoints.map((e) => e.category))];

  const methodColors = {
    GET: "text-blue-500",
    POST: "text-green-500",
    PUT: "text-yellow-500",
    DELETE: "text-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileCode className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">API Docs</h1>
          <p className="text-sm text-muted-foreground">
            Sample requests and responses for engine APIs
          </p>
        </div>
      </div>

      {/* Endpoints by Category */}
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{category}</h2>

          {endpoints
            .filter((e) => e.category === category)
            .map((endpoint) => (
              <div
                key={endpoint.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Endpoint Header */}
                <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-3">
                  <span
                    className={`font-mono text-sm font-medium ${
                      methodColors[endpoint.method]
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {endpoint.path}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {endpoint.description}
                  </p>

                  {/* Request */}
                  {endpoint.request && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          Request
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(endpoint.request, null, 2),
                              `${endpoint.id}-req`
                            )
                          }
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedId === `${endpoint.id}-req` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>
                      <pre className="rounded-lg bg-secondary/50 p-3 overflow-x-auto text-xs font-mono text-foreground">
                        {JSON.stringify(endpoint.request, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        Response
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(endpoint.response, null, 2),
                            `${endpoint.id}-res`
                          )
                        }
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedId === `${endpoint.id}-res` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy
                      </button>
                    </div>
                    <pre className="rounded-lg bg-secondary/50 p-3 overflow-x-auto text-xs font-mono text-foreground">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
