/**
 * ============================================================================
 * BARTER-X TYPE DEFINITIONS
 * ============================================================================
 */

// Barter Types - determines which offers can hook with each other
// Offers can ONLY hook within the same barter type
// Active: "goods"
// Coming Soon: "rentals", "mini-jobs", "ownership"
// Deactivated: "automobile", "home-spaces"
export type ProductType = "goods" | "automobile" | "home-spaces" | "rentals" | "mini-jobs" | "ownership";

export type User = {
  userId: string;
  name?: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
  // Location (auto-detected from IP, user can modify)
  city?: string;
  country?: string;
  countryCode?: string; // ISO 3166-1 alpha-2
  // Profile address (mandatory for full profile)
  profileAddress?: ProfileAddress;
  // Profile completion flag
  isProfileComplete?: boolean;
  // Notification preferences
  notificationPrefs?: NotificationPreferences;
};

export type ProfileAddress = {
  country: string;
  city: string;
  state?: string;
  zip?: string;
  addressLine1?: string;
  addressLine2?: string;
};

export type NotificationPreferences = {
  push: boolean;
  email: boolean;
  sms: boolean;
};

// Shipping address per offer (extends OfferPickupAddress)
export type OfferShippingAddress = {
  offerId: string;
  sameAsProfile: boolean;
  address?: ProfileAddress;
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
};

export type Product = {
  productId: string;
  productType: ProductType; // Required - determines hook compatibility
  title: string;
  category: string;
  subcategory?: string; // Optional for some types like home-spaces
  brand?: string; // Optional - not used for home-spaces
  model?: string;
  imageUrl?: string;
  offerCount: number;
  // Product info fields (static, varies by subcategory)
  productInfo?: ProductInfoField[];
};

export type OfferPickupAddress = {
  country: string;
  city: string;
  state?: string;
  zip?: string;
  postalCode?: string;  // DB uses postalCode, UI uses zip - support both
  addressLine1?: string;
  addressLine2?: string;
  phone?: string; // Required when confirming pickup - verified via OTP
  phoneVerified?: boolean;
};

// Offer image - up to 6 per offer
export type OfferImage = {
  imageId: string;
  url: string;
  order: number; // 0-5
  uploadedAt: Date;
};

export type Offer = {
  offerId: string;
  productId: string;
  tempProductId?: string;        // For custom products pending review
  isPendingReview?: boolean;     // True if linked to a temp product awaiting approval
  ownerUserId: string;
  title: string;
  description: string;
  hookedCount: number;
  outgoingHookCount: number;
  readyForCommit: boolean;
  pickupAddress?: OfferPickupAddress;
  pickupDateTime?: string;
  pickupReadyDate?: string;
  escrowAmount?: number;
  // Images - up to 6 per offer
  images?: OfferImage[];
  // Offer info fields (user-provided, varies by subcategory)
  offerInfo?: OfferInfoFieldValue[];
  // Product info from products.product_info JSONB (read-only, fetched from DB)
  productInfo?: Record<string, unknown>;
  
  // === WORKFLOW FIELDS ===
  // Readiness confirmation
  readyState: boolean;           // User confirmed pickup readiness
  readyUpdatedAt?: string;       // ISO timestamp
  escrowPaid?: boolean;          // Escrow has been paid (prevents re-triggering on edits)
  escrowPaidAt?: string;         // ISO timestamp when escrow was paid
  
  // Lock level for workflow control
  lockLevel: LockLevel;          // 0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED
  lockUpdatedAt?: string;        // ISO timestamp
  
  // Notification progression state
  notificationState: NotificationState;  // 0=none, 1=first, 2=reserved, 3=final
  notificationUpdatedAt?: string;        // ISO timestamp
  
  // Active/inactive (soft delete)
  isActive: boolean;             // Offer visible in marketplace
  isActiveUpdatedAt?: string;    // ISO timestamp
};

export type PickupAddress = OfferPickupAddress;

export type HookStatus = "searching" | "cycle_found" | "reserved" | "processing" | "exchanged" | "expired";

// Lock Level for workflow control
// 0 = AVAILABLE, 1 = RESERVED, 2 = PROCESSING, 3 = EXCHANGED/DONE
export type LockLevel = 0 | 1 | 2 | 3;

// Notification State for tracking notification progression
// 0 = none, 1 = first notification, 2 = reserved notification, 3 = final notification
export type NotificationState = 0 | 1 | 2 | 3;

// Lock level display labels
export const LOCK_LEVEL_LABELS: Record<LockLevel, string> = {
  0: "Available",
  1: "Reserved",
  2: "Processing",
  3: "Exchanged",
};

// Lock level colors for UI badges
export const LOCK_LEVEL_COLORS: Record<LockLevel, string> = {
  0: "text-green-500",
  1: "text-yellow-500",
  2: "text-blue-500",
  3: "text-muted-foreground",
};

// Lock level background colors for badges
export const LOCK_LEVEL_BG_COLORS: Record<LockLevel, string> = {
  0: "bg-green-500/10",
  1: "bg-yellow-500/10",
  2: "bg-blue-500/10",
  3: "bg-muted/50",
};

// Lock level helper text shown on badge tap
export const LOCK_LEVEL_HELPER_TEXT: Record<LockLevel, string> = {
  0: "This offer is active. You can hook, unhook, or delete it anytime.",
  1: "This offer is temporarily reserved in a potential trade. Deleting or unhooking is disabled until it's released.",
  2: "This offer is being finalized for a trade. Changes are paused while we complete the process.",
  3: "This offer has been completed in a trade and is now closed.",
};

export type Hook = {
  hookId: string;
  correlationId: string;
  fromOfferId: string;
  toOfferId: string;
  status: HookStatus;
  reservedCycleId?: string;
  targetUserDistance?: number;
  exchangedDate?: string;
  
  // === WORKFLOW FIELDS ===
  // Lock level for workflow control
  lockLevel: LockLevel;          // 0=normal, 1=RESERVED, 2=PROCESSING, 3=DONE
  lockUpdatedAt?: string;        // ISO timestamp
  
  // Active/inactive (soft delete)
  isActive: boolean;             // Hook is active
  isActiveUpdatedAt?: string;    // ISO timestamp
};

export type DashboardStats = {
  totalUsers: number;
  activeOffers: number;
  activeHooks: number;
  reservedCycles: number;
  committedOffers: number;
  totalProducts: number;
};

export type FeedbackPayload = {
  email: string;
  phone?: string;
  message: string;
};

// Filters specific to each exchange type (stored per type)
export type ExchangeTypeFilters = {
  categories: string[]; // Multi-select categories
  subcategories: string[]; // Multi-select subcategories
  brand: string;
};

// Global filters shared across all exchange types
export type GlobalFilters = {
  searchQuery: string;
  onlyWithOffers: boolean;
  directExchangeOpportunities: boolean;
  onlyMyLocation: boolean; // Filter products with offers from user's country (from profile)
  selectedCities: string[]; // Multi-select cities when country filter is active
};

// Combined filters for products-tab
export type ProductFilters = GlobalFilters & ExchangeTypeFilters;

// Filters stored per barter type
export type AllExchangeTypeFilters = {
  "goods": ExchangeTypeFilters;
  "automobile": ExchangeTypeFilters;
  "home-spaces": ExchangeTypeFilters;
  "rentals": ExchangeTypeFilters;
  "mini-jobs": ExchangeTypeFilters;
  "ownership": ExchangeTypeFilters;
};

export type CountryData = {
  code: string;
  name: string;
  cities: string[];
};

export type ChatMessage = {
  messageId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isSystemMessage?: boolean;
};

// Type of conversation based on offer relationship
export type ConversationType = "outgoing" | "incoming";
// - "outgoing": I hooked their offer (Chat 1 - destination offer chat)
// - "incoming": They hooked my offer (Chat 2 - source offer inbound chat)

export type Conversation = {
  conversationId: string;
  hookId?: string;
  myOfferId: string;
  targetOfferId: string;
  otherUserId: string;
  otherUserName: string;
  messages: ChatMessage[];
  unreadCount: number;
  deliverySupportRequested: boolean;
  conversationType?: ConversationType;
};

export type NotificationType = 
  | "hook_reserved"
  | "pickup_confirm"
  | "chat_message"
  | "trade_committed"
  | "delivery_requested"
  | "direct_exchange_req"
  | "status_update"
  | "cycle_found";

export type Notification = {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  offerId?: string;
  hookId?: string;
  conversationId?: string;
  actionType?: "confirm_pickup" | "view_chat" | "view_status";
  actionLabel?: string;
};

// Image capture session for QR handoff between desktop and mobile
export type ImageCaptureSession = {
  sessionId: string;
  offerId?: string; // If editing existing offer
  draftId?: string; // If new draft
  images: OfferImage[];
  createdAt: Date;
  expiresAt: Date;
};

// ============================================================================
// OFFER INFO & PRODUCT INFO TYPES
// ============================================================================

// Field types for offer info fields
export type OfferInfoFieldType = 
  | "text"
  | "number"           // Numeric input
  | "date_select"      // MM/YYYY picker
  | "single_select"    // Dropdown with one selection
  | "multi_select"     // Dropdown with multiple selections
  | "attachment";      // File upload

// Single offer info field definition
export type OfferInfoFieldDefinition = {
  fieldId: string;
  fieldName: string;
  fieldType: OfferInfoFieldType;
  options?: string[];  // For single_select and multi_select
  required?: boolean;
};

// Offer info field value (user-provided)
export type OfferInfoFieldValue = {
  fieldId: string;
  fieldName: string;
  fieldType: OfferInfoFieldType;
  value: string | string[] | null;  // string for text/single_select/date, string[] for multi_select
  attachmentUrls?: string[];        // For attachment type
};

// Product info field (static, set at product level)
export type ProductInfoField = {
  fieldName: string;
  value: string;
};

// Subcategory-specific offer info field definitions
export type SubcategoryOfferInfoFields = {
  [subcategory: string]: OfferInfoFieldDefinition[];
};
