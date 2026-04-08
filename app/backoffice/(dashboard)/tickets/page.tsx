"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, X, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/lib/db/repositories/tickets";

// Status configuration
const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-500/20 text-gray-400" },
  medium: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
  high: { label: "High", color: "bg-orange-500/20 text-orange-400" },
  urgent: { label: "Urgent", color: "bg-red-500/20 text-red-400" },
};

const CATEGORY_CONFIG = {
  general: { label: "General" },
  technical: { label: "Technical" },
  billing: { label: "Billing" },
  account: { label: "Account" },
  other: { label: "Other" },
};

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  high: number;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      params.set("includeStats", "true");

      const res = await fetch(`/api/backoffice/tickets?${params.toString()}`);
      const data = await res.json();
      
      if (data.tickets) {
        setTickets(data.tickets);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/backoffice/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => prev.map(t => t.ticketId === ticketId ? data.ticket : t));
        if (selectedTicket?.ticketId === ticketId) {
          setSelectedTicket(data.ticket);
        }
        fetchTickets(); // Refresh stats
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const res = await fetch(`/api/backoffice/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => prev.map(t => t.ticketId === ticketId ? data.ticket : t));
        if (selectedTicket?.ticketId === ticketId) {
          setSelectedTicket(data.ticket);
        }
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
  };

  const hasFilters = search || statusFilter || priorityFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and respond to user support requests
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Open" value={stats.open} color="text-blue-400" />
          <StatCard label="In Progress" value={stats.inProgress} color="text-yellow-400" />
          <StatCard label="Resolved" value={stats.resolved} color="text-green-400" />
          <StatCard label="Closed" value={stats.closed} color="text-gray-400" />
          <StatCard label="Urgent" value={stats.urgent} color="text-red-400" highlight />
          <StatCard label="High" value={stats.high} color="text-orange-400" highlight />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 h-10 px-4 rounded-lg border transition-colors",
            showFilters || hasFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasFilters && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">
              {[statusFilter, priorityFilter].filter(Boolean).length + (search ? 1 : 0)}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-border bg-card">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "All Statuses" },
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ]}
          />
          <FilterSelect
            label="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: "", label: "All Priorities" },
              { value: "urgent", label: "Urgent" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tickets List */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <TicketCardShimmer key={i} />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No tickets found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters ? "Try adjusting your filters" : "No support tickets yet"}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.ticketId}
                ticket={ticket}
                isSelected={selectedTicket?.ticketId === ticket.ticketId}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))
          )}
        </div>

        {/* Ticket Detail Panel */}
        {selectedTicket && (
          <TicketDetailPanel
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  color = "text-foreground",
  highlight = false 
}: { 
  label: string; 
  value: number; 
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card",
      highlight && value > 0 ? "border-red-500/30" : "border-border"
    )}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
    </div>
  );
}

// Filter Select Component
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 pl-3 pr-8 rounded-lg border border-border bg-secondary text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// Ticket Card Component
function TicketCard({
  ticket,
  isSelected,
  onClick,
}: {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[ticket.status];
  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const StatusIcon = statusConfig.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", statusConfig.color)}>
          <StatusIcon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", priorityConfig.color)}>
              {priorityConfig.label}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {ticket.description}
          </p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{ticket.userName || ticket.userEmail || "Unknown User"}</span>
            <span>-</span>
            <span>{CATEGORY_CONFIG[ticket.category]?.label || ticket.category}</span>
            <span>-</span>
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// Ticket Card Shimmer
function TicketCardShimmer() {
  return (
    <div className="p-4 rounded-lg border border-border bg-card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-48 rounded bg-secondary" />
            <div className="h-4 w-16 rounded bg-secondary" />
          </div>
          <div className="h-3 w-full rounded bg-secondary" />
          <div className="h-3 w-2/3 rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}

// Ticket Detail Panel
function TicketDetailPanel({
  ticket,
  onClose,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => void;
  onPriorityChange: (ticketId: string, priority: string) => void;
}) {
  const statusConfig = STATUS_CONFIG[ticket.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="lg:w-96 lg:sticky lg:top-6 space-y-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Ticket Details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", statusConfig.color)}>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium text-foreground">{statusConfig.label}</p>
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Subject</p>
            <p className="font-medium text-foreground">{ticket.subject}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* User Info */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
            <p className="text-sm text-foreground">{ticket.userName || "Unknown"}</p>
            {ticket.userEmail && (
              <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Category</p>
            <p className="text-sm text-foreground">{CATEGORY_CONFIG[ticket.category]?.label || ticket.category}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm text-foreground">{formatDate(ticket.createdAt)}</p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                <p className="text-sm text-foreground">{formatDate(ticket.resolvedAt)}</p>
              </div>
            )}
          </div>

          {/* Resolution Notes */}
          {ticket.resolutionNotes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Resolution Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.resolutionNotes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Status Change */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Change Status</label>
            <div className="relative">
              <select
                value={ticket.status}
                onChange={(e) => onStatusChange(ticket.ticketId, e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-lg border border-border bg-secondary text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Priority Change */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Change Priority</label>
            <div className="relative">
              <select
                value={ticket.priority}
                onChange={(e) => onPriorityChange(ticket.ticketId, e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-lg border border-border bg-secondary text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format dates
function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
