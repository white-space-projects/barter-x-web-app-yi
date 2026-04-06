"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";
import { COUNTRIES_DATA, getCitiesForCountry } from "@/lib/countries-data";
import type { OfferImage, OfferInfoFieldValue, OfferInfoFieldDefinition } from "@/lib/types";
import { OfferImageSection } from "./offer-image-section";
import { OfferInfoSection } from "./offer-info-section";

type Props = {
  offerId: string;
  onClose: () => void;
};

export function EditOfferModal({ offerId, onClose }: Props) {
  const { getOfferById, updateOffer, deleteOffer, canDeleteOffer, products } = useBarterStore();
  const offer = getOfferById(offerId);
  const product = offer ? products.find((p) => p.productId === offer.productId) : null;

  const [title, setTitle] = useState(offer?.title || "");
  const [description, setDescription] = useState(offer?.description || "");
  
  // Address fields
  const existingAddress = offer?.pickupAddress;
  const [country, setCountry] = useState(existingAddress?.country || "");
  const [city, setCity] = useState(existingAddress?.city || "");
  const [state, setState] = useState(existingAddress?.state || "");
  const [zip, setZip] = useState(existingAddress?.zip || "");
  const [addressLine1, setAddressLine1] = useState(existingAddress?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(existingAddress?.addressLine2 || "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Images state - initialized from existing offer images
  const [images, setImages] = useState<OfferImage[]>(offer?.images || []);
  
  // Offer info state - initialized from existing offer
  const [offerInfo, setOfferInfo] = useState<OfferInfoFieldValue[]>(offer?.offerInfo || []);
  const [offerFieldDefinitions, setOfferFieldDefinitions] = useState<OfferInfoFieldDefinition[]>([]);

  const availableCities = useMemo(() => getCitiesForCountry(country), [country]);
  
  // Map database field types to OfferInfoFieldType
  function mapDbFieldType(dbType: string): "text" | "number" | "date_select" | "single_select" | "multi_select" | "attachment" {
    switch (dbType) {
      case "text":
      case "textarea":
        return "text";
      case "number":
        return "number";
      case "date":
        return "date_select";
      case "select":
        return "single_select";
      case "multiselect":
        return "multi_select";
      case "boolean":
        return "single_select";
      default:
        return "text";
    }
  }
  
  // Fetch offer field definitions from database (field_scope = 'offer')
  const loadOfferFields = useCallback(async () => {
    if (!product?.subcategory) {
      console.log("[v0] edit-offer loadOfferFields - no subcategory");
      setOfferFieldDefinitions([]);
      return;
    }
    
    try {
      // Lookup subcategory by name to get ID
      const subResponse = await fetch(`/api/data/subcategories?name=${encodeURIComponent(product.subcategory)}`);
      if (!subResponse.ok) {
        setOfferFieldDefinitions([]);
        return;
      }
      const subData = await subResponse.json();
      const subcategoryId = subData.subcategories?.[0]?.subcategoryId;
      
      if (!subcategoryId) {
        console.log("[v0] edit-offer loadOfferFields - subcategory not found:", product.subcategory);
        setOfferFieldDefinitions([]);
        return;
      }
      
      console.log("[v0] edit-offer loadOfferFields - fetching offer fields for subcategoryId:", subcategoryId);
      
      const response = await fetch(`/api/data/subcategories/${subcategoryId}/fields?scope=offer`);
      if (!response.ok) {
        setOfferFieldDefinitions([]);
        return;
      }
      
      const data = await response.json();
      const fields = data.offerFields || [];
      
      console.log("[v0] edit-offer loadOfferFields - loaded", fields.length, "offer fields");
      
      const mappedFields: OfferInfoFieldDefinition[] = fields.map((f: { fieldId: string; fieldLabel: string; fieldType: string; isRequired: boolean; options?: { optionValue: string }[] }) => ({
        fieldId: f.fieldId,
        fieldName: f.fieldLabel,
        fieldType: mapDbFieldType(f.fieldType),
        options: f.options?.map((o: { optionValue: string }) => o.optionValue),
        required: f.isRequired,
      }));
      
      setOfferFieldDefinitions(mappedFields);
    } catch (error) {
      console.error("[v0] edit-offer loadOfferFields error:", error);
      setOfferFieldDefinitions([]);
    }
  }, [product?.subcategory]);
  
  useEffect(() => {
    loadOfferFields();
  }, [loadOfferFields]);
  const canDelete = offer ? canDeleteOffer(offerId) : false;

  if (!offer || !product) {
    return null;
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!country || !city) {
      toast.error("Country and city are required");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    updateOffer(offerId, {
      title: title.trim(),
      description: description.trim(),
      pickupAddress: {
        country,
        city,
        state,
        zip,
        addressLine1,
        addressLine2,
      },
      images,
      offerInfo: offerInfo.length > 0 ? offerInfo : undefined,
    });

    setSaving(false);
    toast.success("Offer updated successfully");
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 500));
    deleteOffer(offerId);
    setDeleting(false);
    toast.success("Offer deleted successfully");
    onClose();
  }

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    if (newCountry !== country) {
      setCity("");
    }
  }

  return (
    <>
      {/* Backdrop - respects sidebar on desktop */}
      <div
        className="fixed inset-0 lg:left-56 z-[60] bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal - wider on desktop with better layout */}
      <div className="fixed z-[70] inset-4 lg:inset-auto lg:left-[calc(50%+7rem)] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-base font-semibold text-foreground">
            Edit Offer
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
          {/* Product info */}
          <div className="mb-5 p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Product</p>
            <p className="text-sm font-medium text-foreground">{product.title}</p>
            <p className="text-xs text-muted-foreground">{product.subcategory} / {product.brand}</p>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., iPhone 14 Pro Max - 256GB Space Black"
              className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your offer's condition, accessories, etc."
              rows={3}
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

{/* Images section */}
          <div className="mb-5">
            <OfferImageSection
              images={images}
              onImagesChange={setImages}
              offerId={offerId}
            />
          </div>
          
          {/* Offer Info section - only show if offer fields are defined in backoffice */}
          {offerFieldDefinitions.length > 0 && (
            <div className="mb-5">
              <OfferInfoSection
                subcategoryId={product.productId}
                fieldDefinitions={offerFieldDefinitions}
                values={offerInfo}
                onChange={setOfferInfo}
              />
            </div>
          )}
          
          {/* Address section */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Pickup Address
            </label>
            <div className="flex flex-col gap-3">
              {/* Country */}
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select country *</option>
                {COUNTRIES_DATA.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* City */}
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!country}
                className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Select city *</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* State & Zip */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="Zip"
                  className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Address lines */}
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Address line 1"
                className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Address line 2 (optional)"
                className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Delete section */}
          {!showDeleteConfirm ? (
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!canDelete}
                className={`flex items-center gap-2 text-sm ${
                  canDelete
                    ? "text-destructive hover:underline"
                    : "text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Delete this offer
              </button>
              {!canDelete && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cannot delete: This offer has a reserved or committed hook.
                </p>
              )}
            </div>
          ) : (
            <div className="border-t border-border pt-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Delete this offer?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This action cannot be undone. All hooks from this offer will also be removed.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex flex-1 items-center justify-center rounded-lg bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-5">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
