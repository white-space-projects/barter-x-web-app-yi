"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Bug, 
  Lightbulb, 
  Palette, 
  Sparkles, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface FeedbackAttachment {
  attachmentId: string;
  ticketId: string;
  storagePath: string;
  originalFilename: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

interface TestingFeedback {
  ticketId: string;
  userId: string | null;
  subject: string;
  description: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  attachments: FeedbackAttachment[];
}

// Feedback type icons and colors
const FEEDBACK_TYPE_CONFIG: Record<string, { icon: typeof Bug; color: string; bgColor: string }> = {
  "Bug / Issue": { icon: Bug, color: "text-red-500", bgColor: "bg-red-500/10" },
  "UX Improvement": { icon: Lightbulb, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  "UI / Design Suggestion": { icon: Palette, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  "Feature Idea": { icon: Sparkles, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  "General Feedback": { icon: MessageSquare, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  in_progress: { label: "In Progress", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  resolved: { label: "Resolved", color: "text-green-500", bgColor: "bg-green-500/10" },
  closed: { label: "Closed", color: "text-muted-foreground", bgColor: "bg-secondary" },
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "text-red-500" },
  high: { label: "High", color: "text-orange-500" },
  medium: { label: "Medium", color: "text-amber-500" },
  low: { label: "Low", color: "text-muted-foreground" },
};

export default function TestingFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<TestingFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  
  // Expanded cards
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Updating status
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch feedback
  useEffect(() => {
    async function fetchFeedback() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (priorityFilter) params.set("priority", priorityFilter);
        
        const response = await fetch(`/api/support/testing-feedback?${params}`);
        if (!response.ok) throw new Error("Failed to fetch feedback");
        
        const data = await response.json();
        setFeedbackList(data.tickets || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
        toast.error("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    }
    
    const debounce = setTimeout(fetchFeedback, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter, priorityFilter]);

  // Toggle expanded state
  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Update feedback status
  async function updateStatus(ticketId: string, newStatus: string) {
    setUpdatingStatus(ticketId);
    try {
      const response = await fetch("/api/backoffice/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      
      if (!response.ok) throw new Error("Failed to update status");
      
      setFeedbackList(prev => 
        prev.map(f => f.ticketId === ticketId ? { ...f, status: newStatus as TestingFeedback["status"] } : f)
      );
      toast.success("Status updated");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  // Extract feedback type from subject
  function getFeedbackType(subject: string): string {
    const match = subject.match(/\[([^\]]+)\]/);
    return match ? match[1] : "General Feedback";
  }

  // Format file size
  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Testing Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review feedback from testers during the F&F Beta phase
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Count */}
        <span className="text-sm text-muted-foreground">
          {total} feedback item{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading feedback...</p>
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No feedback yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Feedback from testers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map(feedback => {
            const feedbackType = getFeedbackType(feedback.subject);
            const typeConfig = FEEDBACK_TYPE_CONFIG[feedbackType] || FEEDBACK_TYPE_CONFIG["General Feedback"];
            const Icon = typeConfig.icon;
            const statusConfig = STATUS_CONFIG[feedback.status];
            const priorityConfig = PRIORITY_CONFIG[feedback.priority];
            const isExpanded = expandedIds.has(feedback.ticketId);

            return (
              <div
                key={feedback.ticketId}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Header Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleExpanded(feedback.ticketId)}
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-lg ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {feedback.subject.replace(/\[[^\]]+\]\s*-?\s*/, "")}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className={`font-medium ${typeConfig.color}`}>{feedbackType}</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {feedback.userName || feedback.userEmail || "Anonymous"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                            {feedback.attachments.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {feedback.attachments.length}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Priority Badge */}
                          <span className={`text-xs font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>

                          {/* Expand Icon */}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-4">
                    {/* Description */}
                    <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                        {feedback.description}
                      </pre>
                    </div>

                    {/* Attachments */}
                    {feedback.attachments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Attachments ({feedback.attachments.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {feedback.attachments.map(att => (
                            <div
                              key={att.attachmentId}
                              className="bg-secondary rounded-lg p-3 text-center"
                            >
                              <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                              </div>
                              <p className="text-xs text-foreground truncate" title={att.originalFilename || "Image"}>
                                {att.originalFilename || "Image"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(att.fileSize)}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 truncate mt-1" title={att.storagePath}>
                                Path: {att.storagePath}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: Image previews will be available once MinIO storage is configured
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground mr-2">Update Status:</span>
                      {(["open", "in_progress", "resolved", "closed"] as const).map(status => {
                        const config = STATUS_CONFIG[status];
                        const isActive = feedback.status === status;
                        const isUpdating = updatingStatus === feedback.ticketId;
                        
                        return (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) updateStatus(feedback.ticketId, status);
                            }}
                            disabled={isActive || isUpdating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? `${config.bgColor} ${config.color}`
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            } disabled:opacity-50`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              config.label
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
