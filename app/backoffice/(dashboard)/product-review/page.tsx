"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Search, ChevronLeft, ChevronRight, Package, User, Calendar, 
  Check, X, AlertTriangle, Sparkles, ArrowRight, Loader2,
  Tag, Layers, Box
} from "lucide-react";
import { toast } from "sonner";

type TicketStatus = "pending" | "in_review" | "approved" | "rejected";
type ActionType = "reuse_existing" | "create_new_product" | "create_new_brand_and_product";

interface TempProduct {
  temp_product_id: string;
  created_by_user_id: string;
  barter_type_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  brand_name: string | null;
  model_name: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface DuplicateSuggestion {
  type: "brand" | "product";
  id: string;
  name: string;
  similarity: number;
  matchedField: string;
}

interface ReviewTicket {
  ticket_id: string;
  temp_product_id: string;
  created_by_user_id: string;
  assigned_to_user_id: string | null;
  status: TicketStatus;
  duplicate_suggestions_json: {
    brands?: DuplicateSuggestion[];
    products?: DuplicateSuggestion[];
  };
  reviewer_notes: string | null;
  selected_brand_id: string | null;
  selected_product_id: string | null;
  action_taken: ActionType | null;
  created_at: string;
  updated_at: string;
  // Joined data
  temp_product?: TempProduct;
  user_email?: string;
  user_name?: string;
}

const statusColors: Record<TicketStatus, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  in_review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<TicketStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function ProductReviewPage() {
  const [tickets, setTickets] = useState<ReviewTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<ReviewTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Review form state
  const [reviewAction, setReviewAction] = useState<ActionType | "">("");
  const [selectedExistingProduct, setSelectedExistingProduct] = useState<string>("");
  const [selectedExistingBrand, setSelectedExistingBrand] = useState<string>("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("offset", String((page - 1) * 20));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/data/review-tickets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tickets");
      
      const data = await response.json();
      setTickets(data.tickets || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (error) {
      console.error("Failed to load tickets:", error);
      toast.error("Failed to load review tickets");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function openTicketDetail(ticket: ReviewTicket) {
    setSelectedTicket(ticket);
    setReviewAction(ticket.action_taken || "");
    setSelectedExistingProduct(ticket.selected_product_id || "");
    setSelectedExistingBrand(ticket.selected_brand_id || "");
    setReviewerNotes(ticket.reviewer_notes || "");
    setDetailOpen(true);
  }

  async function handleApprove() {
    if (!selectedTicket || !reviewAction) {
      toast.error("Please select an action");
      return;
    }

    if (reviewAction === "reuse_existing" && !selectedExistingProduct) {
      toast.error("Please select an existing product to link");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/data/review-tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticket_id,
          status: "approved",
          actionTaken: reviewAction,
          selectedProductId: reviewAction === "reuse_existing" ? selectedExistingProduct : null,
          selectedBrandId: reviewAction === "create_new_product" ? selectedExistingBrand : null,
          reviewerNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }

      toast.success("Product approved and offer updated");
      setDetailOpen(false);
      loadTickets();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selectedTicket) return;

    if (!reviewerNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/data/review-tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticket_id,
          status: "rejected",
          reviewerNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject");
      }

      toast.success("Product rejected");
      setDetailOpen(false);
      loadTickets();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setSubmitting(false);
    }
  }

  const suggestions = selectedTicket?.duplicate_suggestions_json || {};
  const brandSuggestions = suggestions.brands || [];
  const productSuggestions = suggestions.products || [];
  const hasSuggestions = brandSuggestions.length > 0 || productSuggestions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Product Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve custom product submissions from users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product title, brand, or user..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No review tickets found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => openTicketDetail(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {ticket.temp_product?.title || "Untitled Product"}
                        </span>
                        {ticket.duplicate_suggestions_json?.products?.length ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Possible duplicate
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {ticket.temp_product?.brand_name && (
                          <span className="font-medium">{ticket.temp_product.brand_name}</span>
                        )}
                        {ticket.temp_product?.brand_name && ticket.temp_product?.model_name && " / "}
                        {ticket.temp_product?.model_name}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.user_email || ticket.created_by_user_id?.slice(0, 8)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[ticket.status]}>
                    {statusLabels[ticket.status]}
                  </Badge>
                </div>
              </div>
            ))}
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

      {/* Review Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle>Review Product Submission</SheetTitle>
                <SheetDescription>
                  Ticket #{selectedTicket.ticket_id.slice(0, 8)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Submitted Product Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Submitted Product</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm font-medium">{selectedTicket.temp_product?.title}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Brand</Label>
                        <p className="text-sm font-medium">{selectedTicket.temp_product?.brand_name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Model</Label>
                        <p className="text-sm font-medium">{selectedTicket.temp_product?.model_name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Submitted By</Label>
                        <p className="text-sm">{selectedTicket.user_email || selectedTicket.created_by_user_id?.slice(0, 12)}</p>
                      </div>
                    </div>
                    {selectedTicket.temp_product?.description && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTicket.temp_product.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Suggestions */}
                {hasSuggestions && (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Smart Suggestions
                      </CardTitle>
                      <CardDescription>
                        Possible matches found in the catalog
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue={productSuggestions.length > 0 ? "products" : "brands"}>
                        <TabsList className="w-full">
                          <TabsTrigger value="products" className="flex-1">
                            <Box className="h-3.5 w-3.5 mr-1.5" />
                            Products ({productSuggestions.length})
                          </TabsTrigger>
                          <TabsTrigger value="brands" className="flex-1">
                            <Tag className="h-3.5 w-3.5 mr-1.5" />
                            Brands ({brandSuggestions.length})
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="products" className="mt-3 space-y-2">
                          {productSuggestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No similar products found</p>
                          ) : (
                            productSuggestions.map((s) => (
                              <div
                                key={s.id}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedExistingProduct === s.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                }`}
                                onClick={() => {
                                  setSelectedExistingProduct(s.id);
                                  setReviewAction("reuse_existing");
                                }}
                              >
                                <div>
                                  <p className="text-sm font-medium">{s.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Matched: {s.matchedField} ({Math.round(s.similarity * 100)}% similar)
                                  </p>
                                </div>
                                {selectedExistingProduct === s.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </TabsContent>
                        <TabsContent value="brands" className="mt-3 space-y-2">
                          {brandSuggestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No similar brands found</p>
                          ) : (
                            brandSuggestions.map((s) => (
                              <div
                                key={s.id}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedExistingBrand === s.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                }`}
                                onClick={() => {
                                  setSelectedExistingBrand(s.id);
                                  setReviewAction("create_new_product");
                                }}
                              >
                                <div>
                                  <p className="text-sm font-medium">{s.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.round(s.similarity * 100)}% similar
                                  </p>
                                </div>
                                {selectedExistingBrand === s.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}

                {/* Review Action */}
                {selectedTicket.status === "pending" || selectedTicket.status === "in_review" ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Review Action</CardTitle>
                      <CardDescription>
                        Choose how to handle this submission
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup
                        value={reviewAction}
                        onValueChange={(v) => setReviewAction(v as ActionType)}
                      >
                        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="reuse_existing" id="reuse" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="reuse" className="cursor-pointer font-medium">
                              Link to Existing Product
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              This product already exists. Link the offer to the catalog product.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="create_new_product" id="new_product" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="new_product" className="cursor-pointer font-medium">
                              Create New Product
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Add this as a new product under an existing brand.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="create_new_brand_and_product" id="new_brand" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="new_brand" className="cursor-pointer font-medium">
                              Create New Brand + Product
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              This is a new brand not yet in the catalog.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>

                      <div>
                        <Label htmlFor="notes">Reviewer Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes about this review decision..."
                          value={reviewerNotes}
                          onChange={(e) => setReviewerNotes(e.target.value)}
                          className="mt-1.5"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Review Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColors[selectedTicket.status]}>
                          {statusLabels[selectedTicket.status]}
                        </Badge>
                        {selectedTicket.action_taken && (
                          <span className="text-sm text-muted-foreground">
                            Action: {selectedTicket.action_taken.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {selectedTicket.reviewer_notes && (
                        <p className="text-sm text-muted-foreground mt-3">
                          Notes: {selectedTicket.reviewer_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              {(selectedTicket.status === "pending" || selectedTicket.status === "in_review") && (
                <SheetFooter className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={submitting || !reviewAction}
                    className="flex-1"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
