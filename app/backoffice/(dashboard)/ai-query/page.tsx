"use client";

/**
 * ============================================================================
 * BACK OFFICE AI QUERY PAGE
 * ============================================================================
 * AI-assisted SQL query builder for engine schema only.
 */

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Play,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { runSqlQuery } from "@/lib/backoffice/api";
import type { SqlQueryResponse } from "@/lib/backoffice/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
}

// Simple mock AI responses based on input
function generateAiResponse(input: string): { message: string; sql?: string } {
  const lowerInput = input.toLowerCase();

  // Check for non-engine queries
  if (lowerInput.includes("application") || lowerInput.includes("users") || lowerInput.includes("products")) {
    return {
      message: "I can only help with queries on the engine.* schema. Queries against application.* or other schemas are not allowed for security reasons. Please ask about engine.nodes, engine.edges, engine.scc_snapshots, or engine.cycle_reservations.",
    };
  }

  // General questions
  if (!lowerInput.includes("node") && !lowerInput.includes("edge") && !lowerInput.includes("snapshot") && !lowerInput.includes("reservation") && !lowerInput.includes("cycle") && !lowerInput.includes("lock") && !lowerInput.includes("scc")) {
    return {
      message: "I can help you write SQL queries for the engine schema. What would you like to know? For example:\n- How many nodes are at each lock level?\n- Show me active edges\n- Find unpicked snapshots\n- List recent reservations",
    };
  }

  // Node queries
  if (lowerInput.includes("node") && lowerInput.includes("lock")) {
    if (lowerInput.includes("count") || lowerInput.includes("how many")) {
      return {
        message: "Here's a query to count nodes by lock level:",
        sql: `SELECT 
  lock_level,
  COUNT(*) as count
FROM engine.nodes
WHERE is_active = true
GROUP BY lock_level
ORDER BY lock_level;`,
      };
    }
    return {
      message: "Here's a query to get nodes by lock level:",
      sql: `SELECT 
  node_id,
  lock_level,
  ready_state,
  notification_state,
  updated_at
FROM engine.nodes
WHERE is_active = true
  AND lock_level = 0  -- Change to desired lock level (0-3)
ORDER BY updated_at DESC
LIMIT 50;`,
    };
  }

  if (lowerInput.includes("node") && lowerInput.includes("ready")) {
    return {
      message: "Here's a query to find ready nodes:",
      sql: `SELECT 
  node_id,
  ready_state,
  ready_updated_at,
  lock_level
FROM engine.nodes
WHERE is_active = true
  AND ready_state = true
ORDER BY ready_updated_at DESC
LIMIT 50;`,
    };
  }

  // Edge queries
  if (lowerInput.includes("edge") || lowerInput.includes("hook")) {
    if (lowerInput.includes("count")) {
      return {
        message: "Here's a query to count active edges:",
        sql: `SELECT COUNT(*) as active_edges
FROM engine.edges
WHERE is_active = true;`,
      };
    }
    return {
      message: "Here's a query to list edges:",
      sql: `SELECT 
  src_node_id,
  dst_node_id,
  is_active,
  lock_level,
  created_at
FROM engine.edges
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 50;`,
    };
  }

  // Snapshot queries
  if (lowerInput.includes("snapshot") || lowerInput.includes("scc")) {
    if (lowerInput.includes("unpicked") || lowerInput.includes("not picked")) {
      return {
        message: "Here's a query to find unpicked snapshots:",
        sql: `SELECT 
  id,
  scc_prefix,
  jsonb_array_length(nodes) as node_count,
  jsonb_array_length(cycles) as cycle_count,
  picked,
  created_at
FROM engine.scc_snapshots
WHERE picked = false
  AND is_active = true
ORDER BY created_at DESC
LIMIT 20;`,
      };
    }
    return {
      message: "Here's a query to view snapshots:",
      sql: `SELECT 
  id,
  scc_prefix,
  jsonb_array_length(nodes) as node_count,
  jsonb_array_length(cycles) as cycle_count,
  picked,
  is_active,
  created_at
FROM engine.scc_snapshots
ORDER BY id DESC
LIMIT 20;`,
    };
  }

  // Reservation queries
  if (lowerInput.includes("reservation") || lowerInput.includes("cycle")) {
    if (lowerInput.includes("status") || lowerInput.includes("count")) {
      return {
        message: "Here's a query to count reservations by status:",
        sql: `SELECT 
  status,
  COUNT(*) as count
FROM engine.cycle_reservations
GROUP BY status
ORDER BY count DESC;`,
      };
    }
    if (lowerInput.includes("expir")) {
      return {
        message: "Here's a query to find expiring reservations:",
        sql: `SELECT 
  id,
  cycle_fingerprint,
  status,
  cycle_length,
  reserved_at,
  expires_at
FROM engine.cycle_reservations
WHERE status = 'RESERVED'
  AND expires_at < NOW() + INTERVAL '1 hour'
ORDER BY expires_at ASC
LIMIT 20;`,
      };
    }
    return {
      message: "Here's a query to view cycle reservations:",
      sql: `SELECT 
  id,
  cycle_fingerprint,
  scc_prefix,
  cycle_length,
  status,
  reserved_at,
  expires_at
FROM engine.cycle_reservations
ORDER BY id DESC
LIMIT 20;`,
    };
  }

  // Default
  return {
    message: "I'll help you write a query. Could you be more specific about what data you need? Available tables:\n- engine.nodes (offer states)\n- engine.edges (hooks)\n- engine.scc_snapshots (SCC outputs)\n- engine.cycle_reservations (reserved cycles)",
  };
}

export default function AiQueryPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [runningQuery, setRunningQuery] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<SqlQueryResponse | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 800));

    const response = generateAiResponse(userMessage.content);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.message,
      sql: response.sql,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setSending(false);
  }

  async function handleRunQuery(sql: string) {
    setRunningQuery(sql);
    setQueryResult(null);

    try {
      const result = await runSqlQuery({ sql });
      setQueryResult(result);
    } catch (error) {
      setQueryResult({
        success: false,
        error: "Failed to execute query",
      });
    } finally {
      setRunningQuery(null);
    }
  }

  function copySql(sql: string) {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  }

  function clearChat() {
    setMessages([]);
    setQueryResult(null);
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Query</h1>
            <p className="text-sm text-muted-foreground">
              Engine-only SQL assistant
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Engine SQL Assistant
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask me to help write SQL queries for the engine schema. I can
                only access engine.nodes, engine.edges, engine.scc_snapshots,
                and engine.cycle_reservations.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "Count nodes by lock level",
                  "Show active edges",
                  "Find unpicked snapshots",
                  "List recent reservations",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.sql && (
                    <div className="mt-3 rounded-lg bg-background/50 p-3 overflow-x-auto">
                      <pre className="text-xs font-mono text-foreground">
                        {msg.sql}
                      </pre>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => copySql(msg.sql!)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedSql ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                        <button
                          onClick={() => handleRunQuery(msg.sql!)}
                          disabled={runningQuery === msg.sql}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                          {runningQuery === msg.sql ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Run Query
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Result */}
        {queryResult && (
          <div className="border-t border-border p-4 bg-secondary/30 max-h-64 overflow-y-auto">
            {queryResult.success ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    {queryResult.rowCount} row(s) returned
                    {queryResult.executionTime && ` in ${queryResult.executionTime}ms`}
                  </p>
                  <button
                    onClick={() => setQueryResult(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary">
                        {queryResult.columns?.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-medium text-muted-foreground"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows?.map((row, i) => (
                        <tr key={i} className="border-t border-border/50">
                          {queryResult.columns?.map((col) => (
                            <td
                              key={col}
                              className="px-3 py-2 font-mono text-foreground"
                            >
                              {String(row[col] ?? "-")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{queryResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about engine data..."
              disabled={sending}
              className="flex-1 h-11 rounded-lg border border-input bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Restricted to engine.* schema only. Application data access is blocked.
          </p>
        </div>
      </div>
    </div>
  );
}
