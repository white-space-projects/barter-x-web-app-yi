/**
 * ============================================================================
 * BARTER-X TYPE DEFINITIONS
 * ============================================================================
 */

// Product Types - determines which offers can hook with each other
// Offers can ONLY hook within the same product type
export type ProductType = "cross-product" | "automobile" | "home-spaces";

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
};

export type PickupAddress = OfferPickupAddress;

export type HookStatus = "searching" | "cycle_found" | "reserved" | "processing" | "exchanged" | "expired";

export type Hook = {
  hookId: string;
  correlationId: string;
  fromOfferId: string;
  toOfferId: string;
  status: HookStatus;
  reservedCycleId?: string;
  targetUserDistance?: number;
  exchangedDate?: string;
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

export type ProductFilters = {
  searchQuery: string;
  onlyWithOffers: boolean;
  category: string;
  subcategory: string;
  brand: string;
  directExchangeOpportunities: boolean;
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
};

export type NotificationType = 
  | "hook_reserved"
  | "pickup_confirm"
  | "chat_message"
  | "trade_committed"
  | "delivery_requested"
  | "direct_exchange_req"
  | "status_update";

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
