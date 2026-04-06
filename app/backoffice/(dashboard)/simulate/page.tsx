"use client";

/**
 * ============================================================================
 * BACK OFFICE SIMULATE PAGE
 * ============================================================================
 * Enhanced simulation page for generating test data.
 */

import { useState } from "react";
import {
  FlaskConical,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { simulate } from "@/lib/backoffice/api";
import type { SimulateRequest, SimulateResponse } from "@/lib/backoffice/types";

export default function SimulatePage() {
  // Form state
  const [users, setUsers] = useState(100);
  const [nodes, setNodes] = useState(150);
  const [edges, setEdges] = useState(300);
  const [seed, setSeed] = useState<number | undefined>(42);
  const [useSeed, setUseSeed] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);

  // Validation
  const maxPossible = nodes * 3; // Assuming max 3 outgoing edges per node
  const showWarning = edges > maxPossible && maxPossible > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload: SimulateRequest = {
      users: Math.floor(users),
      nodes: Math.floor(nodes),
      edges: Math.floor(edges),
    };

    if (useSeed && seed !== undefined) {
      payload.seed = Math.floor(seed);
    }

    try {
      const response = await simulate(payload);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to run simulation",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Simulate</h1>
          <p className="text-sm text-muted-foreground">
            Generate test users, nodes (offers), and edges (hooks) for the trade
            engine
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Users */}
            <div>
              <label
                htmlFor="sim-users"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Number of Users
              </label>
              <input
                id="sim-users"
                type="number"
                min={1}
                max={10000}
                value={users}
                onChange={(e) =>
                  setUsers(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={loading}
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Test users to create
              </p>
            </div>

            {/* Nodes */}
            <div>
              <label
                htmlFor="sim-nodes"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Number of Nodes
              </label>
              <input
                id="sim-nodes"
                type="number"
                min={1}
                max={10000}
                value={nodes}
                onChange={(e) =>
                  setNodes(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={loading}
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Offers to create
              </p>
            </div>

            {/* Edges */}
            <div>
              <label
                htmlFor="sim-edges"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Number of Edges
              </label>
              <input
                id="sim-edges"
                type="number"
                min={0}
                max={50000}
                value={edges}
                onChange={(e) =>
                  setEdges(Math.max(0, parseInt(e.target.value) || 0))
                }
                disabled={loading}
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Hooks to create
              </p>
            </div>
          </div>

          {/* Warning */}
          {showWarning && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
              <p className="text-sm text-yellow-200">
                Edges ({edges}) exceeds estimated max possible ({maxPossible})
                based on {nodes} nodes. Some edges may not be created.
              </p>
            </div>
          )}

          {/* Seed Option */}
          <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUseSeed(!useSeed)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useSeed ? "bg-primary" : "bg-muted"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useSeed ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <label className="text-sm font-medium text-foreground">
                Use random seed for reproducibility
              </label>
            </div>

            {useSeed && (
              <div className="mt-3">
                <input
                  type="number"
                  value={seed ?? ""}
                  onChange={(e) =>
                    setSeed(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  disabled={loading}
                  placeholder="Enter seed (e.g., 42)"
                  className="h-10 w-full max-w-xs rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Result Panel */}
      {result && (
        <div
          className={`rounded-xl border p-6 ${
            result.success
              ? "border-green-500/30 bg-green-500/5"
              : "border-destructive/30 bg-destructive/5"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            )}
            <div className="flex-1">
              <h3
                className={`font-medium ${
                  result.success ? "text-green-500" : "text-destructive"
                }`}
              >
                {result.success ? "Simulation Complete" : "Simulation Failed"}
              </h3>

              {result.error && (
                <p className="mt-1 text-sm text-destructive">{result.error}</p>
              )}

              {result.success && (
                <div className="mt-4 space-y-4">
                  {/* Run ID */}
                  {result.run_id && (
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Run ID</p>
                      <p className="mt-0.5 font-mono text-sm text-foreground">
                        {result.run_id}
                      </p>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Users Created
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.created_users?.toLocaleString() ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Nodes Created
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.created_nodes?.toLocaleString() ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Edges Created
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.created_edges?.toLocaleString() ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        SCC Snapshots
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.created_scc_snapshots?.toLocaleString() ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-3">
          API Endpoint
        </h2>
        <div className="rounded-lg bg-secondary/50 p-4 font-mono text-sm">
          <p className="text-muted-foreground">
            <span className="text-green-500">POST</span>{" "}
            <span className="text-foreground">/engine/simulate</span>
          </p>
          <pre className="mt-3 text-xs text-muted-foreground overflow-x-auto">
            {JSON.stringify(
              {
                users: users,
                nodes: nodes,
                edges: edges,
                seed: useSeed ? seed : undefined,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
