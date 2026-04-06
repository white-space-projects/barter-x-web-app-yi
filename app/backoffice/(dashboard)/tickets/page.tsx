"use client";

import { useState, useEffect } from "react";
import { backofficeApi } from "@/lib/backoffice/api";
import { Ticket, TicketStatus, TicketSource, PaginatedResponse } from "@/lib/backoffice/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Search, ChevronLeft, ChevronRight, MessageSquare, AlertCircle, Package, User, Calendar, Clock, ExternalLink } from "lucide-react";

const statusColors: Record<TicketStatus, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const sourceLabels: Record<TicketSource, string> = {
  login_issue: "Login Issue",
  feedback: "Feedback",
  product_review: "Product Review",
  support: "Support",
};

const sourceIcons: Record<TicketSource, typeof AlertCircle> = {
  login_issue: AlertCircle,
  feedback: MessageSquare,
  product_review: Package,
  support: MessageSquare,
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  urgent: "bg-red-500/20 text-red-400",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<TicketSource | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [page, statusFilter, sourceFilter, search]);

  async function loadTickets() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (sourceFilter !== "all") params.source = sourceFilter;
      if (search) params.search = search;

      const response: PaginatedResponse<Ticket> = await backofficeApi.getTickets(params);
      setTickets(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    try {
      await backofficeApi.updateTicketStatus(ticketId, newStatus);
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update ticket status:", error);
    }
  }

  function openTicketDetail(ticket: Ticket) {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage support issues, feedback, and product review requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as TicketSource | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="login_issue">Login Issues</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="product_review">Product Review</SelectItem>
            <SelectItem value="support">Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No tickets found</div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => {
              const SourceIcon = sourceIcons[ticket.source];
              return (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => openTicketDetail(ticket)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted">
                        <SourceIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {ticket.subject}
                          </span>
                          <Badge variant="outline" className={priorityColors[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.user_email || ticket.user_id?.slice(0, 8)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          <span>{sourceLabels[ticket.source]}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[ticket.status]}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Ticket Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTicket.subject}</SheetTitle>
                <SheetDescription>
                  Ticket #{selectedTicket.id.slice(0, 8)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) => handleStatusChange(selectedTicket.id, v as TicketStatus)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Source</label>
                    <p className="text-sm font-medium">{sourceLabels[selectedTicket.source]}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Priority</label>
                    <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Created</label>
                    <p className="text-sm">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Updated</label>
                    <p className="text-sm">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <label className="text-xs text-muted-foreground">Submitted By</label>
                  <p className="text-sm font-medium mt-1">
                    {selectedTicket.user_email || "Unknown"}
                  </p>
                  {selectedTicket.user_id && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      ID: {selectedTicket.user_id}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Related IDs */}
                {(selectedTicket.related_product_id || selectedTicket.related_offer_id) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Related Items</label>
                    {selectedTicket.related_product_id && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                        <span className="text-sm">Product</span>
                        <code className="text-xs font-mono text-muted-foreground">
                          {selectedTicket.related_product_id.slice(0, 12)}...
                        </code>
                      </div>
                    )}
                    {selectedTicket.related_offer_id && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                        <span className="text-sm">Offer</span>
                        <code className="text-xs font-mono text-muted-foreground">
                          {selectedTicket.related_offer_id.slice(0, 12)}...
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                {selectedTicket.metadata && Object.keys(selectedTicket.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Additional Data</label>
                    <pre className="mt-1.5 p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto">
                      {JSON.stringify(selectedTicket.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
