"use client";

import React, { useEffect, useCallback } from "react"

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";
import { getOfferTitlePlaceholder, getOfferDescPlaceholder } from "@/lib/mock-data";
import { getCountryNames, getCitiesForCountry } from "@/lib/countries-data";
import type { Product, OfferPickupAddress, OfferImage, OfferInfoFieldValue, OfferInfoFieldDefinition } from "@/lib/types";
import { OfferImageSection } from "./offer-image-section";
import { OfferInfoSection } from "./offer-info-section";

type Props = {
  product: Product;
  onClose?: () => void;
  onOfferAdded?: () => void;
};

export function InlineAddOffer({ product, onClose, onOfferAdded }: Props) {
  const { auth, addOffer } = useBarterStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Pickup address fields
  const [pickupCountry, setPickupCountry] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupState, setPickupState] = useState("");
  const [pickupZip, setPickupZip] = useState("");
  const [pickupAddressLine1, setPickupAddressLine1] = useState("");
  const [pickupAddressLine2, setPickupAddressLine2] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<OfferImage[]>([]);
  const [offerInfo, setOfferInfo] = useState<OfferInfoFieldValue[]>([]);
  const [offerFieldDefinitions, setOfferFieldDefinitions] = useState<OfferInfoFieldDefinition[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  const titlePlaceholder = getOfferTitlePlaceholder(product.subcategory);
  const descPlaceholder = getOfferDescPlaceholder(product.subcategory);
  
  const countryNames = getCountryNames();
  const availableCities = pickupCountry ? getCitiesForCountry(pickupCountry) : [];

  // Fetch offer field definitions from database (field_scope = 'offer')
  const loadOfferFields = useCallback(async () => {
    // Product must have a subcategoryId (UUID) to fetch fields
    // Note: product.subcategory is the name, we need the ID
    // For now, we'll fetch by subcategory name via API that looks it up
    if (!product.subcategory) {
      console.log("[v0] loadOfferFields - no subcategory, returning empty fields");
      setOfferFieldDefinitions([]);
      return;
    }
    
    setLoadingFields(true);
    try {
      // Fetch subcategory by name to get ID, then fetch offer fields
      const subResponse = await fetch(`/api/data/subcategories?name=${encodeURIComponent(product.subcategory)}`);
      if (!subResponse.ok) {
        console.log("[v0] loadOfferFields - failed to fetch subcategory");
        setOfferFieldDefinitions([]);
        return;
      }
      const subData = await subResponse.json();
      const subcategoryId = subData.subcategories?.[0]?.subcategoryId;
      
      if (!subcategoryId) {
        console.log("[v0] loadOfferFields - subcategory not found:", product.subcategory);
        setOfferFieldDefinitions([]);
        return;
      }
      
      console.log("[v0] loadOfferFields - fetching offer fields for subcategoryId:", subcategoryId);
      
      const response = await fetch(`/api/data/subcategories/${subcategoryId}/fields?scope=offer`);
      if (!response.ok) {
        console.log("[v0] loadOfferFields - failed to fetch fields");
        setOfferFieldDefinitions([]);
        return;
      }
      
      const data = await response.json();
      const fields = data.offerFields || [];
      
      console.log("[v0] loadOfferFields - loaded", fields.length, "offer fields for subcategory:", product.subcategory);
      
      // Map database fields to OfferInfoFieldDefinition format
      const mappedFields: OfferInfoFieldDefinition[] = fields.map((f: { fieldId: string; fieldLabel: string; fieldType: string; isRequired: boolean; options?: { optionValue: string }[] }) => ({
        fieldId: f.fieldId,
        fieldName: f.fieldLabel,
        fieldType: mapDbFieldType(f.fieldType),
        options: f.options?.map((o: { optionValue: string }) => o.optionValue),
        required: f.isRequired,
      }));
      
      setOfferFieldDefinitions(mappedFields);
    } catch (error) {
      console.error("[v0] loadOfferFields error:", error);
      setOfferFieldDefinitions([]);
    } finally {
      setLoadingFields(false);
    }
  }, [product.subcategory]);
  
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
        return "single_select"; // Boolean rendered as Yes/No single select
      default:
        return "text";
    }
  }
  
  useEffect(() => {
    loadOfferFields();
  }, [loadOfferFields]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Offer title is required.";
    if (!description.trim()) errs.description = "Offer description is required.";
    if (!pickupCountry) errs.pickupCountry = "Country is required.";
    if (!pickupCity) errs.pickupCity = "City is required.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const pickupAddress: OfferPickupAddress = {
      country: pickupCountry,
      city: pickupCity,
      state: pickupState.trim() || undefined,
      zip: pickupZip.trim() || undefined,
      addressLine1: pickupAddressLine1.trim() || undefined,
      addressLine2: pickupAddressLine2.trim() || undefined,
    };

    addOffer({
      offerId: generateGuid(),
      productId: product.productId,
      ownerUserId: auth.user!.userId,
      title: title.trim(),
      description: description.trim(),
      hookedCount: 0,
      outgoingHookCount: 0,
      readyForCommit: false,
      pickupAddress,
      images,
      offerInfo: offerInfo.length > 0 ? offerInfo : undefined,
    });

setLoading(false);
  toast.success("Your offer has been added.");
  if (onOfferAdded) {
    onOfferAdded();
  } else if (onClose) {
    onClose();
  }
  }

  const handleClose = () => {
    if (onOfferAdded) {
      onOfferAdded();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Add offer
            </h3>
            <p className="text-xs text-muted-foreground">
              for {product.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Offer title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder={titlePlaceholder}
              className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Offer description <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description)
                  setErrors((p) => ({ ...p, description: "" }));
              }}
              placeholder={descPlaceholder}
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description}
              </p>
            )}
          </div>

{/* Images Section */}
          <div className="mb-4">
            <OfferImageSection
              images={images}
              onImagesChange={setImages}
            />
          </div>
          
          {/* Offer Info Section - only show if there are offer fields defined */}
          {offerFieldDefinitions.length > 0 && (
            <div className="mb-4">
              <OfferInfoSection
                subcategoryId={product.productId} // Used for debug logging
                fieldDefinitions={offerFieldDefinitions}
                values={offerInfo}
                onChange={setOfferInfo}
              />
            </div>
          )}
          
          {/* Pickup Address Section */}
          <div className="mb-5 rounded-lg border border-border bg-secondary/20 p-4">
            <h4 className="mb-3 text-sm font-medium text-foreground">
              Pickup Address
            </h4>
            <p className="mb-3 text-xs text-muted-foreground">
              This address will be visible to hooked users after pickup is confirmed.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Country - Mandatory */}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Country <span className="text-destructive">*</span>
                </label>
                <select
                  value={pickupCountry}
                  onChange={(e) => {
                    setPickupCountry(e.target.value);
                    setPickupCity(""); // Reset city when country changes
                    if (errors.pickupCountry) setErrors((p) => ({ ...p, pickupCountry: "" }));
                  }}
                  className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select country</option>
                  {countryNames.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.pickupCountry && <p className="mt-0.5 text-xs text-destructive">{errors.pickupCountry}</p>}
              </div>

              {/* City - Mandatory (disabled until country selected) */}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  City <span className="text-destructive">*</span>
                </label>
                <select
                  value={pickupCity}
                  onChange={(e) => {
                    setPickupCity(e.target.value);
                    if (errors.pickupCity) setErrors((p) => ({ ...p, pickupCity: "" }));
                  }}
                  disabled={!pickupCountry}
                  className={`h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    !pickupCountry ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">
                    {pickupCountry ? "Select city" : "Select country first"}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.pickupCity && <p className="mt-0.5 text-xs text-destructive">{errors.pickupCity}</p>}
              </div>

              {/* State - Optional */}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  State <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={pickupState}
                  onChange={(e) => setPickupState(e.target.value)}
                  placeholder="e.g. North Holland"
                  className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Zip - Optional */}
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Zip / Postal Code <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={pickupZip}
                  onChange={(e) => setPickupZip(e.target.value)}
                  placeholder="e.g. 1012 AB"
                  className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Address Line 1 - Optional */}
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Address Line 1 <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={pickupAddressLine1}
                  onChange={(e) => setPickupAddressLine1(e.target.value)}
                  placeholder="e.g. 123 Main Street"
                  className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Address Line 2 - Optional */}
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Address Line 2 <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={pickupAddressLine2}
                  onChange={(e) => setPickupAddressLine2(e.target.value)}
                  placeholder="e.g. Apartment 4B"
                  className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save offer"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
