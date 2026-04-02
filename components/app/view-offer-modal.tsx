"use client";

import { X, Package, MapPin, Calendar, Info } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { LOCK_LEVEL_LABELS, LOCK_LEVEL_COLORS, LOCK_LEVEL_BG_COLORS } from "@/lib/types";

type Props = {
  offerId: string;
  onClose: () => void;
};

export function ViewOfferModal({ offerId, onClose }: Props) {
  const { getOfferById, products } = useBarterStore();
  const offer = getOfferById(offerId);
  const product = offer ? products.find((p) => p.productId === offer.productId) : null;

  if (!offer || !product) {
    return null;
  }

  const address = offer.pickupAddress;

  return (
    <>
      {/* Backdrop - respects sidebar on desktop */}
      <div
        className="fixed inset-0 lg:left-56 z-[60] bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed z-[70] inset-4 lg:inset-auto lg:left-[calc(50%+7rem)] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-base font-semibold text-foreground">
            Offer Details
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Offer images */}
          {offer.images && offer.images.length > 0 && (
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-2">
                {offer.images.map((img, idx) => (
                  <div
                    key={img.imageId || idx}
                    className={`rounded-lg overflow-hidden bg-secondary ${
                      idx === 0 ? "col-span-3 aspect-video" : "aspect-square"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${offer.title} - Image ${idx + 1}`}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title and status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h4 className="text-lg font-semibold text-foreground">{offer.title}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]}`}>
              {LOCK_LEVEL_LABELS[offer.lockLevel]}
            </span>
          </div>

          {/* Product info */}
          <div className="mb-4 p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Product</p>
              <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
              <p className="text-xs text-muted-foreground">{product.subcategory} / {product.brand}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{offer.description || "No description provided."}</p>
          </div>

          {/* Offer info fields */}
          {offer.offerInfo && offer.offerInfo.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Additional Info</p>
              <div className="grid grid-cols-2 gap-2">
                {offer.offerInfo.map((info, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="text-sm font-medium text-foreground">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hooks count */}
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Outgoing hooks: <span className="font-medium text-foreground">{offer.outgoingHookCount}/3</span>
            </p>
          </div>

          {/* Pickup readiness */}
          {offer.readyState && (
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-500 font-medium">
                Ready for Pick-up
                {offer.pickupReadyDate && <span className="text-muted-foreground font-normal"> - {offer.pickupReadyDate}</span>}
              </p>
            </div>
          )}

          {/* Pickup address */}
          {address && (address.country || address.city) && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pickup Address</p>
              <div className="flex items-start gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p>
                  {[
                    address.addressLine1,
                    address.addressLine2,
                    address.city,
                    address.state,
                    address.zip,
                    address.country
                  ].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Created date */}
          <div className="text-xs text-muted-foreground">
            Created: {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : "N/A"}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-5">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
