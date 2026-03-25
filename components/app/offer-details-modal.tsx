"use client";

import { useState, useMemo } from "react";
import { X, Package, Loader2, ArrowRightLeft, ChevronRight, ChevronLeft, Info, Calendar, Shield, Wrench, AlertTriangle, FileText } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";
import type { Offer, Product, OfferInfoFieldValue, ProductInfoField } from "@/lib/types";
import { getProductInfo } from "@/lib/offer-info-fields";

type Props = {
  offerId: string;
  onClose: () => void;
  onNavigateToProduct?: (productId: string) => void;
};

export function OfferDetailsModal({ offerId, onClose, onNavigateToProduct }: Props) {
  const {
    getOfferById,
    products,
    hooks,
    auth,
    getMyOffers,
    addNotification,
  } = useBarterStore();

  const offer = getOfferById(offerId);
  const product = offer ? products.find((p) => p.productId === offer.productId) : null;
  const myOffers = getMyOffers();
  const isOwnOffer = offer?.ownerUserId === auth.user?.userId;

  const [requestingExchange, setRequestingExchange] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<"offer" | "product" | null>(null);

  // Get product info (static)
  const productInfo = product ? getProductInfo(product.productId) : [];

  // Get hooked products
  const hookedProducts = useMemo(() => {
    if (!offer) return [];
    const offerHooks = hooks.filter((h) => h.fromOfferId === offerId);
    const productIds = new Set<string>();
    const productsList: Product[] = [];
    offerHooks.forEach((hook) => {
      const targetOffer = getOfferById(hook.toOfferId);
      if (targetOffer && !productIds.has(targetOffer.productId)) {
        productIds.add(targetOffer.productId);
        const prod = products.find((p) => p.productId === targetOffer.productId);
        if (prod) productsList.push(prod);
      }
    });
    return productsList;
  }, [offer, hooks, offerId, getOfferById, products]);

  // Check for direct exchange opportunities
  const myOffersInHookedProducts = useMemo(() => {
    if (!offer || isOwnOffer) return [];
    const matches: { myOffer: Offer; product: Product }[] = [];
    hookedProducts.forEach((prod) => {
      const myOfferInProduct = myOffers.find((o) => o.productId === prod.productId);
      if (myOfferInProduct) matches.push({ myOffer: myOfferInProduct, product: prod });
    });
    return matches;
  }, [hookedProducts, myOffers, offer, isOwnOffer]);

  if (!offer || !product) return null;

  const images = offer.images || [];
  const hasImages = images.length > 0;

  async function handleRequestDirectExchange(myOffer: Offer) {
    setRequestingExchange(myOffer.offerId);
    await new Promise((r) => setTimeout(r, 800));
    addNotification({
      type: "direct_exchange_req",
      offerId: offer!.offerId,
      title: "Direct Exchange Request",
      message: `Someone wants to directly exchange their "${myOffer.title}" for your "${offer!.title}".`,
      actionType: "view_status",
      actionLabel: "View Request",
    });
    setRequestingExchange(null);
    toast.success("Direct exchange request sent!");
  }

  function handleNavigateToProduct(productId: string) {
    if (onNavigateToProduct) onNavigateToProduct(productId);
    onClose();
  }

  // Helper to render offer info field value
  function renderFieldValue(field: OfferInfoFieldValue) {
    if (!field.value) return <span className="text-muted-foreground/60">Not specified</span>;
    if (Array.isArray(field.value)) {
      if (field.value.length === 0) return <span className="text-muted-foreground/60">None</span>;
      return field.value.join(", ");
    }
    return field.value;
  }

  // Group offer info fields by category
  const offerInfoGroups = useMemo(() => {
    if (!offer.offerInfo || offer.offerInfo.length === 0) return null;
    
    const groups: { title: string; icon: React.ReactNode; fields: OfferInfoFieldValue[] }[] = [];
    
    // Basic info (condition, color, purchase date, usage)
    const basicFields = offer.offerInfo.filter(f => 
      ["condition", "color", "purchase_date", "usage_level", "size"].includes(f.fieldId)
    );
    if (basicFields.length > 0) {
      groups.push({ title: "Basic Info", icon: <Info className="h-4 w-4" />, fields: basicFields });
    }

    // Warranty & Documents
    const warrantyFields = offer.offerInfo.filter(f => 
      ["warranty_status", "invoice_available", "documents"].includes(f.fieldId)
    );
    if (warrantyFields.length > 0) {
      groups.push({ title: "Warranty & Documents", icon: <Shield className="h-4 w-4" />, fields: warrantyFields });
    }

    // Condition & Issues
    const conditionFields = offer.offerInfo.filter(f => 
      ["functional_issues", "visible_damages", "repairs_done", "repaired_components"].includes(f.fieldId)
    );
    if (conditionFields.length > 0) {
      groups.push({ title: "Condition Details", icon: <Wrench className="h-4 w-4" />, fields: conditionFields });
    }

    // Included items
    const includedFields = offer.offerInfo.filter(f => 
      ["included_items"].includes(f.fieldId)
    );
    if (includedFields.length > 0) {
      groups.push({ title: "What's Included", icon: <Package className="h-4 w-4" />, fields: includedFields });
    }

    // Additional notes
    const noteFields = offer.offerInfo.filter(f => 
      ["additional_notes"].includes(f.fieldId)
    );
    if (noteFields.length > 0) {
      groups.push({ title: "Additional Notes", icon: <FileText className="h-4 w-4" />, fields: noteFields });
    }

    return groups.length > 0 ? groups : null;
  }, [offer.offerInfo]);

  return (
    <>
      {/* Backdrop - respects sidebar on desktop */}
      <div className="fixed inset-0 lg:left-56 z-[60] bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal container - full screen on mobile, centered panel on desktop */}
      <div className="fixed inset-0 lg:left-56 z-[70] overflow-y-auto">
        <div className="min-h-full flex items-start justify-center p-4 lg:p-8">
          {/* Offer details modal - moderate width */}
          <div className="w-full max-w-lg lg:max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            
            {/* Header - Apple style minimal */}
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 lg:px-8 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{product.brand} / {product.subcategory}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content with product thumbnail */}
            <div className="p-5 lg:p-6">
              {/* Product thumbnail and title row */}
              <div className="flex gap-4 mb-5">
                {/* Product image - thumbnail 64x64 */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-secondary/30 border border-border">
                  {hasImages ? (
                    <img
                      src={images[0].url}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Title and description */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-1 text-balance">
                    {offer.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {offer.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {offer.hookedCount} {offer.hookedCount === 1 ? "person" : "people"} interested
                  </p>
                </div>
              </div>

              {/* Image gallery strip - horizontal thumbnails if multiple images */}
              {hasImages && images.length > 1 && (
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={img.imageId}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === activeImageIndex 
                          ? "border-primary" 
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Info Section */}
              {productInfo.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setExpandedSection(expandedSection === "product" ? null : "product")}
                    className="w-full flex items-center justify-between py-3 border-t border-border"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Product Specifications</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSection === "product" ? "rotate-90" : ""}`} />
                  </button>
                  
                  {expandedSection === "product" && (
                    <div className="pb-3 grid grid-cols-2 gap-x-4 gap-y-2">
                      {productInfo.map((info, idx) => (
                        <div key={idx} className="py-1">
                          <p className="text-xs text-muted-foreground">{info.fieldName}</p>
                          <p className="text-sm text-foreground">{info.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Offer Info Section */}
              {offerInfoGroups && (
                <div className="mb-4">
                  <button
                    onClick={() => setExpandedSection(expandedSection === "offer" ? null : "offer")}
                    className="w-full flex items-center justify-between py-3 border-t border-border"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Offer Details</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSection === "offer" ? "rotate-90" : ""}`} />
                  </button>
                  
                  {expandedSection === "offer" && (
                    <div className="pb-3 space-y-4">
                      {offerInfoGroups.map((group, gIdx) => (
                        <div key={gIdx}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-primary">{group.icon}</span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{group.title}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-6">
                            {group.fields.map((field, fIdx) => (
                              <div key={fIdx} className={field.fieldType === "text" || field.fieldType === "multi_select" ? "col-span-2" : ""}>
                                <p className="text-xs text-muted-foreground">{field.fieldName}</p>
                                <p className="text-sm text-foreground">{renderFieldValue(field)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hooked Products - What they're looking for */}
              {hookedProducts.length > 0 && (
                <div className="mb-4 border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    Looking to exchange for
                  </h4>
                  <div className="flex flex-col gap-2">
                    {hookedProducts.map((prod) => {
                      const hasMyOffer = myOffersInHookedProducts.some((m) => m.product.productId === prod.productId);
                      return (
                        <button
                          key={prod.productId}
                          onClick={() => handleNavigateToProduct(prod.productId)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{prod.title}</p>
                            <p className="text-xs text-muted-foreground">{prod.brand}</p>
                          </div>
                          {hasMyOffer && (
                            <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 flex-shrink-0">
                              You have an offer
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Direct Exchange CTA */}
              {myOffersInHookedProducts.length > 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Direct Exchange Available</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    You have an offer in a product this user wants. Request a direct 1-to-1 exchange.
                  </p>
                  {myOffersInHookedProducts.map(({ myOffer, product: prod }) => (
                    <button
                      key={myOffer.offerId}
                      onClick={() => handleRequestDirectExchange(myOffer)}
                      disabled={requestingExchange === myOffer.offerId}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-background border border-border mb-2 last:mb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {myOffer.images && myOffer.images[0] ? (
                            <img src={myOffer.images[0].url} alt={myOffer.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{myOffer.title}</p>
                          <p className="text-xs text-muted-foreground">Your offer</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                        {requestingExchange === myOffer.offerId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>Request</>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Own offer notice */}
              {isOwnOffer && (
                <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    This is your offer. Manage it from the My Offers tab.
                  </p>
                </div>
              )}

              {/* Privacy note */}
              <p className="text-xs text-muted-foreground/50 text-center mt-4">
                Pickup address visible after exchange is confirmed.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 lg:p-5">
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
