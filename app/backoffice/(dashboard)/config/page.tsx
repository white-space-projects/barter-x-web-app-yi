"use client";

/**
 * ============================================================================
 * BACK OFFICE CONFIG PAGE
 * ============================================================================
 * Trade engine configuration management.
 */

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { getConfig, updateConfig } from "@/lib/backoffice/api";
import type { EngineConfig } from "@/lib/backoffice/types";

export default function ConfigPage() {
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<EngineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const data = await getConfig();
      setConfig(data);
      setOriginalConfig(data);
    } catch (err) {
      setError("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!config) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const updated = await updateConfig(config);
      setConfig(updated);
      setOriginalConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (originalConfig) {
      setConfig({ ...originalConfig });
    }
  }

  function hasChanges(): boolean {
    if (!config || !originalConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Failed to load configuration
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Config</h1>
            <p className="text-sm text-muted-foreground">
              Trade engine configuration settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges() && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Config Form */}
      <div className="space-y-6">
        {/* Timing Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Timing Settings
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phase 2 Poll Interval (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={config.PHASE2_POLL_SECONDS}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    PHASE2_POLL_SECONDS: parseInt(e.target.value) || 5,
                  })
                }
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How often Phase 2 worker polls for work
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Max Prefix Per Tick
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={config.MAX_PREFIX_PER_TICK}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    MAX_PREFIX_PER_TICK: parseInt(e.target.value) || 10,
                  })
                }
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Max SCC prefixes processed per tick
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Reservation TTL (seconds)
              </label>
              <input
                type="number"
                min={60}
                max={3600}
                value={config.RESERVATION_TTL_SECONDS}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    RESERVATION_TTL_SECONDS: parseInt(e.target.value) || 300,
                  })
                }
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How long cycle reservations remain valid
              </p>
            </div>
          </div>
        </div>

        {/* Strategy Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Strategy Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ruleset 1 Strategy
              </label>
              <select
                value={config.RULESET1_STRATEGY}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    RULESET1_STRATEGY: e.target.value as "FIFO" | "LIFO" | "RANDOM",
                  })
                }
                className="h-11 w-full max-w-xs rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="FIFO">FIFO (First In, First Out)</option>
                <option value="LIFO">LIFO (Last In, First Out)</option>
                <option value="RANDOM">Random</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Order in which cycles are processed
              </p>
            </div>
          </div>
        </div>

        {/* Tie-Break Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Tie-Break Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Lock 0 Preference
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prefer nodes with lock_level = 0 when breaking ties
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    LOCK0_PREFERENCE: !config.LOCK0_PREFERENCE,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.LOCK0_PREFERENCE ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.LOCK0_PREFERENCE ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Shortest Cycle Tie-Break
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prefer shorter cycles when breaking ties
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    SHORTEST_CYCLE_TIEBREAK: !config.SHORTEST_CYCLE_TIEBREAK,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.SHORTEST_CYCLE_TIEBREAK ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.SHORTEST_CYCLE_TIEBREAK ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* API Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">
            API Endpoints
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-muted-foreground">
              <span className="text-blue-500">GET</span>{" "}
              <span className="text-foreground">/engine/config</span>
            </p>
            <p className="text-muted-foreground">
              <span className="text-yellow-500">PUT</span>{" "}
              <span className="text-foreground">/engine/config</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
