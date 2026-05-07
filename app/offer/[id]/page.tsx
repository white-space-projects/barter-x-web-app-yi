"use client";

/**
 * Public Offer Details Page
 * Accessible without login - uses mock data for design preview
 * Follows the same design as the app's offer-details-modal.tsx
 */

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  X, Package, ArrowRightLeft, ChevronRight, Info, Shield, Wrench, FileText,
  ChevronLeft, MapPin, User, Calendar, Clock
} from "lucide-react";

// Mock data for design preview
const MOCK_OFFERS = [
  {
    offerId: "offer-1",
    title: "iPhone 14 Pro Max - Mint Condition",
    description: "Barely used iPhone 14 Pro Max 256GB in Deep Purple. Comes with original box, charger, and unused earbuds. Battery health at 98%. No scratches or dents.",
    productId: "prod-1",
    ownerUserId: "user-1",
    lockLevel: "available" as const,
    hookedCount: 12,
    images: [
      { imageId: "img-1", url: "/placeholder.svg?height=400&width=300", order: 0 },
      { imageId: "img-2", url: "/placeholder.svg?height=400&width=300", order: 1 },
      { imageId: "img-3", url: "/placeholder.svg?height=400&width=300", order: 2 },
    ],
    offerInfo: [
      { fieldId: "condition", fieldName: "Condition", fieldType: "select", value: "Like New" },
      { fieldId: "color", fieldName: "Color", fieldType: "select", value: "Deep Purple" },
      { fieldId: "purchase_date", fieldName: "Purchase Date", fieldType: "date", value: "2023-06" },
      { fieldId: "usage_level", fieldName: "Usage", fieldType: "select", value: "Light Use" },
      { fieldId: "warranty_status", fieldName: "Warranty", fieldType: "select", value: "Active until Dec 2024" },
      { fieldId: "invoice_available", fieldName: "Invoice", fieldType: "boolean", value: "Yes" },
      { fieldId: "functional_issues", fieldName: "Functional Issues", fieldType: "boolean", value: "None" },
      { fieldId: "visible_damages", fieldName: "Visible Damages", fieldType: "boolean", value: "None" },
      { fieldId: "included_items", fieldName: "Included Items", fieldType: "multi_select", value: ["Original Box", "Charger", "EarPods", "Documentation"] },
      { fieldId: "additional_notes", fieldName: "Notes", fieldType: "text", value: "Screen protector applied since day one. Always used with a case." },
    ],
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    offerId: "offer-2",
    title: "MacBook Pro 16\" M2 - Like New",
    description: "MacBook Pro 16\" with M2 Pro chip, 32GB RAM, 1TB SSD. Space Gray. AppleCare+ until 2025. Pristine condition, used only for light work.",
    productId: "prod-2",
    ownerUserId: "user-2",
    lockLevel: "available" as const,
    hookedCount: 8,
    images: [
      { imageId: "img-4", url: "/placeholder.svg?height=400&width=300", order: 0 },
    ],
    offerInfo: [
      { fieldId: "condition", fieldName: "Condition", fieldType: "select", value: "Excellent" },
      { fieldId: "color", fieldName: "Color", fieldType: "select", value: "Space Gray" },
      { fieldId: "warranty_status", fieldName: "Warranty", fieldType: "select", value: "AppleCare+ until 2025" },
    ],
    createdAt: "2024-02-20T14:00:00Z",
  },
];

const MOCK_PRODUCTS = [
  {
    productId: "prod-1",
    title: "iPhone 14 Pro Max",
    brand: "Apple",
    subcategory: "Phones",
    category: "Electronics",
    imageUrl: "/placeholder.svg?height=64&width=64",
    productInfo: [
      { fieldName: "Storage", value: "256GB" },
      { fieldName: "Display", value: "6.7\" Super Retina XDR" },
      { fieldName: "Chip", value: "A16 Bionic" },
      { fieldName: "Camera", value: "48MP Main + 12MP Ultra Wide + 12MP Telephoto" },
    ],
  },
  {
    productId: "prod-2",
    title: "MacBook Pro 16\"",
    brand: "Apple",
    subcategory: "Laptops",
    category: "Electronics",
    imageUrl: "/placeholder.svg?height=64&width=64",
    productInfo: [
      { fieldName: "Chip", value: "M2 Pro" },
      { fieldName: "RAM", value: "32GB" },
      { fieldName: "Storage", value: "1TB SSD" },
      { fieldName: "Display", value: "16.2\" Liquid Retina XDR" },
    ],
  },
  {
    productId: "prod-3",
    title: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    subcategory: "Phones",
    category: "Electronics",
    imageUrl: "/placeholder.svg?height=64&width=64",
    productInfo: [],
  },
  {
    productId: "prod-4",
    title: "Sony WH-1000XM5",
    brand: "Sony",
    subcategory: "Headphones",
    category: "Electronics",
    imageUrl: "/placeholder.svg?height=64&width=64",
    productInfo: [],
  },
];

const MOCK_OWNER = {
  userId: "user-1",
  name: "Alex Johnson",
  location: "Budapest, Hungary",
  memberSince: "January 2023",
  completedExchanges: 15,
};

// Lock level styling
const LOCK_LEVEL_LABELS: Record<string, string> = {
  available: "Available",
  soft_lock: "Soft Lock",
  hard_lock: "Hard Lock",
  exchanged: "Exchanged",
};

const LOCK_LEVEL_COLORS: Record<string, string> = {
  available: "text-green-500",
  soft_lock: "text-yellow-500",
  hard_lock: "text-orange-500",
  exchanged: "text-muted-foreground",
};

const LOCK_LEVEL_BG_COLORS: Record<string, string> = {
  available: "bg-green-500/10",
  soft_lock: "bg-yellow-500/10",
  hard_lock: "bg-orange-500/10",
  exchanged: "bg-muted/50",
};

export default function PublicOfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;

  // Find mock offer (fallback to first offer for demo)
  const offer = MOCK_OFFERS.find(o => o.offerId === offerId) || MOCK_OFFERS[0];
  const product = MOCK_PRODUCTS.find(p => p.productId === offer.productId);
  const owner = MOCK_OWNER;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<"offer" | "product" | null>(null);

  // Mock hooked products (what they're looking for)
  const hookedProducts = MOCK_PRODUCTS.filter(p => p.productId !== offer.productId).slice(0, 2);

  // Group offer info fields by category
  const offerInfoGroups = useMemo(() => {
    if (!offer.offerInfo || offer.offerInfo.length === 0) return null;
    
    const groups: { title: string; icon: React.ReactNode; fields: typeof offer.offerInfo }[] = [];
    
    // Basic info
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

  // Helper to render field value
  function renderFieldValue(field: { value: string | string[] }) {
    if (!field.value) return <span className="text-muted-foreground/60">Not specified</span>;
    if (Array.isArray(field.value)) {
      if (field.value.length === 0) return <span className="text-muted-foreground/60">None</span>;
      return field.value.join(", ");
    }
    return field.value;
  }

  const images = offer.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <Link href="/" className="text-xl font-bold text-primary">
              BARTER-X
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Chat
            </Link>
            <Link href="/workspace" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Open App
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{product?.category}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{product?.subcategory}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{offer.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main Image */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary/30 border border-border">
                {hasImages ? (
                  <img
                    src={images[activeImageIndex].url}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {hasImages && images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
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
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Offer Details Card */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>{product?.brand}</span>
                      <span>/</span>
                      <span>{product?.subcategory}</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground text-balance">
                      {offer.title}
                    </h1>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]}`}>
                    {LOCK_LEVEL_LABELS[offer.lockLevel]}
                  </span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {offer.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {offer.hookedCount} interested
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Listed {new Date(offer.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Product Info Section */}
                {product?.productInfo && product.productInfo.length > 0 && (
                  <div>
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
                        {product.productInfo.map((info, idx) => (
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
                  <div>
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

                {/* Looking to exchange for */}
                {hookedProducts.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      Looking to exchange for
                    </h4>
                    <div className="flex flex-col gap-2">
                      {hookedProducts.map((prod) => (
                        <div
                          key={prod.productId}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30"
                        >
                          <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            <img src={prod.imageUrl} alt={prod.title} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{prod.title}</p>
                            <p className="text-xs text-muted-foreground">{prod.brand}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Owner Info & Actions */}
            <div className="space-y-4">
              {/* Owner Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Listed by</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{owner.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {owner.location}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-foreground">{owner.memberSince}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed exchanges</span>
                    <span className="text-foreground">{owner.completedExchanges}</span>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Interested in this offer?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to hook your offer and start the exchange process.
                </p>
                <Link
                  href="/workspace"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Open App to Hook
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Help Card */}
              <div className="bg-secondary/30 rounded-2xl border border-border p-6">
                <h3 className="text-sm font-medium text-foreground mb-2">How Barter-X works</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary font-medium">1.</span>
                    Create your offer with what you have
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-medium">2.</span>
                    Hook offers you want to exchange with
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-medium">3.</span>
                    When a match is found, complete the exchange
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Barter-X. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
