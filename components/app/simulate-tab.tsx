"use client";

import { useState } from "react";
import { simulateData } from "@/lib/simulate-api";
import type { SimulateResponse } from "@/lib/simulate-types";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FlaskConical,
} from "lucide-react";

export function SimulateTab() {
  // Form state
  const [users, setUsers] = useState(100);
  const [offers, setOffers] = useState(150);
  const [hooks, setHooks] = useState(300);
  const [maxOut, setMaxOut] = useState(3);
  const [seed, setSeed] = useState(42);
  const [dryRun, setDryRun] = useState(false);

  // UI state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);

  // Validation
  const maxPossible = offers * maxOut;
  const showWarning = hooks > maxPossible && maxPossible > 0;

  async function handleRunSimulation(isDryRun: boolean) {
    setLoading(true);
    setResult(null);

    const response = await simulateData({
      users: Math.floor(users),
      offers: Math.floor(offers),
      hooks: Math.floor(hooks),
      max_out: Math.floor(maxOut),
      seed: Math.floor(seed),
      dry_run: isDryRun,
    });

    setResult(response);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Simulate Data
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate test users, offers, and hooks for the trade engine
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Users */}
          <div>
            <label
              htmlFor="sim-users"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Users (N)
            </label>
            <input
              id="sim-users"
              type="number"
              min={0}
              value={users}
              onChange={(e) => setUsers(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Offers */}
          <div>
            <label
              htmlFor="sim-offers"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Offers (M)
            </label>
            <input
              id="sim-offers"
              type="number"
              min={0}
              value={offers}
              onChange={(e) => setOffers(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Hooks */}
          <div>
            <label
              htmlFor="sim-hooks"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Hooks (K)
            </label>
            <input
              id="sim-hooks"
              type="number"
              min={0}
              value={hooks}
              onChange={(e) => setHooks(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        {/* Warning */}
        {showWarning && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
            <p className="text-sm text-yellow-200">
              Hooks ({hooks}) exceeds max possible ({maxPossible}) based on{" "}
              {offers} offers x {maxOut} max out-degree. Only {maxPossible} hooks
              will be created.
            </p>
          </div>
        )}

        {/* Advanced section */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {advancedOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Advanced Options
          </button>

          {advancedOpen && (
            <div className="mt-4 grid gap-4 rounded-lg border border-border bg-secondary/50 p-4 sm:grid-cols-3">
              {/* Max Out Degree */}
              <div>
                <label
                  htmlFor="sim-maxout"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Max Out Degree
                </label>
                <input
                  id="sim-maxout"
                  type="number"
                  min={1}
                  value={maxOut}
                  onChange={(e) => setMaxOut(Math.max(1, parseInt(e.target.value) || 3))}
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Max hooks per offer (default: 3)
                </p>
              </div>

              {/* Seed */}
              <div>
                <label
                  htmlFor="sim-seed"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Seed
                </label>
                <input
                  id="sim-seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Random seed for reproducibility
                </p>
              </div>

              {/* Dry Run Toggle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Dry Run
                </label>
                <button
                  type="button"
                  onClick={() => setDryRun(!dryRun)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dryRun ? "bg-primary" : "bg-secondary"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dryRun ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview without creating data
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleRunSimulation(dryRun)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && !dryRun ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            Run Simulation
          </button>
          <button
            type="button"
            onClick={() => handleRunSimulation(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
          >
            {loading && dryRun ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Dry Run
          </button>
        </div>
      </div>

      {/* Result Panel */}
      {result && (
        <div
          className={`rounded-xl border p-6 ${
            result.status === "success"
              ? "border-green-500/30 bg-green-500/5"
              : "border-destructive/30 bg-destructive/5"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.status === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            )}
            <div className="flex-1">
              <h3
                className={`font-medium ${
                  result.status === "success"
                    ? "text-green-500"
                    : "text-destructive"
                }`}
              >
                {result.status === "success" ? "Simulation Complete" : "Error"}
              </h3>

              {result.status === "error" && result.error && (
                <p className="mt-1 text-sm text-destructive">{result.error}</p>
              )}

              {result.status === "success" && (
                <div className="mt-4 space-y-4">
                  {/* Stats grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Run ID</p>
                      <p className="mt-0.5 font-mono text-sm text-foreground">
                        {result.run_id}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Users Created</p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.users_created.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Offers Created</p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.offers_created.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Hooks Created</p>
                      <p className="mt-0.5 text-lg font-semibold text-foreground">
                        {result.hooks_created.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Max possible hooks */}
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Max Possible Hooks</p>
                    <p className="mt-0.5 text-sm text-foreground">
                      {result.max_possible_hooks.toLocaleString()}
                    </p>
                  </div>

                  {/* Note */}
                  {result.note && (
                    <div className="rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="text-sm text-muted-foreground">{result.note}</p>
                    </div>
                  )}

                  {/* Sample IDs */}
                  {result.sample_user_ids.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Sample User IDs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.sample_user_ids.map((id) => (
                          <code
                            key={id}
                            className="rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground"
                          >
                            {id}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.sample_offer_ids.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Sample Offer IDs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.sample_offer_ids.map((id) => (
                          <code
                            key={id}
                            className="rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground"
                          >
                            {id}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.sample_hook_pairs.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Sample Hook Pairs (from → to)
                      </p>
                      <div className="space-y-1">
                        {result.sample_hook_pairs.map(([from, to], i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <code className="rounded bg-secondary px-2 py-1 font-mono text-foreground">
                              {from}
                            </code>
                            <span className="text-muted-foreground">→</span>
                            <code className="rounded bg-secondary px-2 py-1 font-mono text-foreground">
                              {to}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
