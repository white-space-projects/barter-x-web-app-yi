# Barter-X Developer Guide

## Overview

This document provides guidance for backend developers integrating this frontend with real APIs.
The app is designed to handle 100s of real-time users, 10000s of products, and 1000s of offers/hooks.

## Performance Optimizations Applied

1. **Memoization**: All derived data uses `useMemo()` to prevent recalculation on re-renders
2. **CSS Classes**: Inline styles replaced with CSS utility classes (e.g., `card-shadow-primary`)
3. **Single Store Access**: Components use single `useBarterStore()` call, destructuring all needed values
4. **Callback Memoization**: Store functions wrapped with `useCallback()` to maintain reference stability
5. **Lazy Loading**: Consider adding React.lazy() for heavy modals when deploying to production

## CSS Utility Classes (globals.css)

```css
/* Card shadows - use these instead of inline styles */
.card-shadow-primary  /* Yellow shadow for offer cards */
.card-shadow-blue     /* Blue shadow for product cards */
.card-shadow-none     /* Remove shadow */
```

## Regional Filtering

Users only see products/offers from their region:
1. **Same City**: First priority - offers from user's city
2. **Same Country**: Second priority - offers from other cities in the same country
3. **No Cross-Border**: Users cannot see offers from other countries

Location is auto-detected from IP address on login and stored with the user profile.

## Apple Sign-In

- Only visible on Apple devices (iOS, iPadOS, macOS)
- Detection uses `navigator.userAgent` and `navigator.platform`
- See `/lib/geolocation.ts` for implementation

## Architecture

```
/app
  /workspace/page.tsx    - Main authenticated workspace (tabs: Products, My Offers, Chat)
  /login/page.tsx        - Login page (with Apple Sign-In for Apple devices)
  /signup/page.tsx       - Signup page
  /admin/page.tsx        - Admin dashboard
  /globals.css           - Global styles + card shadow utilities

/components/app
  /products-tab.tsx      - Browse products grid (responsive: 1-4 columns)
  /my-offers-tab.tsx     - Manage user's offers (open/closed tabs)
  /chat-tab.tsx          - Notifications and conversations
  /view-offers-panel.tsx - View offers within a product (shows owner features for own offers)
  /offer-card.tsx        - REUSABLE: Offer card component (used everywhere)
  /offer-details-modal.tsx - Shows offer details + hooked products
  /hook-offer-modal.tsx  - Modal for hooking an offer
  /add-offer-modal.tsx   - Modal for adding new offer
  /edit-offer-modal.tsx  - Modal for editing offer
  /pickup-readiness-modal.tsx - Modal for confirming pickup + escrow
  /inline-add-offer.tsx  - Inline form for adding offer (used in navigate-to-product flow)

/lib
  /types.ts              - TypeScript interfaces (maps to DB schema) - FULLY DOCUMENTED
  /store.tsx             - React Context store (replace with API hooks) - FULLY DOCUMENTED
  /mock-data.ts          - Mock data for development
  /guid.ts               - UUID generator utility
  /offer-info-fields.ts  - Offer info field definitions by subcategory + product info
  /geolocation.ts        - IP-based location detection + Apple device detection

/components/app (continued)
  /offer-image-section.tsx   - Image section with QR handoff for desktop, native camera for mobile
  /offer-capture-qr-modal.tsx - QR code modal for desktop -> mobile handoff
  /offer-image-preview.tsx   - Full-screen image viewer with swipe, crop & delete
  /offer-info-section.tsx    - Collapsible offer info form (condition, warranty, etc.)

/app/capture
  /page.tsx                  - Mobile capture page (opened via QR scan from desktop)
```

## Image Capture Flow

### Desktop Flow
1. User clicks "Capture Image" button on Add/Edit Offer
2. QR modal opens with a unique session ID
3. User scans QR code with phone
4. QR opens `/capture?session_id=<uuid>` on mobile browser
5. Mobile captures images using native camera
6. Images sync via localStorage (polling on desktop)
7. Desktop thumbnails update in real-time

### Mobile Flow
1. User clicks "Capture Image" button
2. Native camera opens via `<input capture="environment">`
3. After capture, crop modal appears
4. User can crop or use original
5. Image added to thumbnail strip

### Image Cropping
- Available on both desktop and mobile
- Square crop with draggable area
- Grid overlay for composition
- "Use Original" option to skip cropping

### Cross-Device Image Sync API
The `/api/capture-session` route handles real-time image sync between mobile and desktop.

**Current implementation:** In-memory storage (for demo/development)

**MinIO Integration for Production:**
Replace the in-memory `sessions` Map in `/app/api/capture-session/route.ts` with:

```typescript
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

// Upload image
const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
await minioClient.putObject('capture-sessions', `${sessionId}/${imageId}.jpg`, buffer);

// Get image URL
const imageUrl = await minioClient.presignedGetObject('capture-sessions', `${sessionId}/${imageId}.jpg`);
```

Required env vars: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_USE_SSL`

## Key Data Models

### User
```typescript
{
  userId: string;              // UUID - primary key
  name?: string;
  email: string;
  isAdmin?: boolean;
  city?: string;               // User's city (auto-detected from IP, editable)
  country?: string;            // User's country (auto-detected from IP, editable)
  countryCode?: string;        // ISO 3166-1 alpha-2 country code
}
```

### Offer
```typescript
{
  offerId: string;           // UUID - primary key
  productId: string;         // FK to products table
  ownerUserId: string;       // FK to users table
  title: string;
  description: string;
  hookedCount: number;       // Computed: COUNT of hooks TO this offer
  outgoingHookCount: number; // Computed: COUNT of hooks FROM this offer (max 3)
  readyForCommit: boolean;   // Set true after escrow confirmed
  pickupAddress?: object;    // JSONB with country, city, state, zip, addressLine1/2
  pickupReadyDate?: string;  // Date string "DD/MM/YY"
  escrowAmount?: number;     // Amount blocked in escrow
  images?: OfferImage[];     // Up to 6 images per offer
  offerInfo?: OfferInfoFieldValue[]; // Dynamic fields based on subcategory
}
```

### OfferInfoFieldValue (User-editable offer details)
```typescript
{
  fieldId: string;           // e.g., "condition", "color", "warranty_status"
  fieldName: string;         // Display name
  fieldType: "text" | "date_select" | "single_select" | "multi_select" | "attachment";
  value: string | string[] | null;
  attachmentUrls?: string[]; // For document uploads
}
```

### ProductInfoField (Static product specifications)
```typescript
{
  fieldName: string;         // e.g., "Product Type", "Dimensions", "Weight"
  value: string;             // Display value
}
```

Common Offer Info Fields:
- Purchase Month & Year (date_select)
- Condition (single_select: New, Like New, Excellent, Good, Fair, Poor, Not Working)
- Color (text)
- Usage Level (single_select: Unused, Light Use, Regular Use, Heavy Use)
- Warranty Status (single_select: Valid, Expired, Not Applicable)
- Included Items (multi_select: Original Box, Charger, Manual, etc.)
- Functional Issues (multi_select: None, Not Working, Loose Parts, etc.)
- Visible Damages (multi_select: None, Scratches, Cracks, etc.)
- Documents (attachment: Invoice, Warranty Card, etc.)

Common Product Info Fields (Static, set per product):
- Product Type (Physical, Electronic, Wearable)
- Primary Material
- Dimensions
- Weight
- Power Source
- Connectivity
- Water Resistance
- Release Year

### Hook
```typescript
{
  hookId: string;            // UUID - primary key
  correlationId: string;     // Groups hooks in same user session
  fromOfferId: string;       // FK to offers - the offer making the hook
  toOfferId: string;         // FK to offers - the target offer
  status: HookStatus;        // ENUM: searching|cycle_found|reserved|processing|exchanged|expired
  reservedCycleId?: string;  // Set when part of a trade cycle
  targetUserDistance?: number; // km distance (set when reserved)
}
```

### Status Flow
```
searching -> cycle_found -> reserved -> processing -> exchanged
     |           |             |            |
     v           v             v            v
  expired     expired       expired      expired
```

## API Endpoints to Implement

### Authentication
- `POST /api/auth/login` - Returns { user, accessToken }
- `POST /api/auth/register` - Creates user account
- `POST /api/auth/logout` - Invalidates token

### Products
- `GET /api/products` - List products (query: category, subcategory, brand, hasOffers, page, limit)
- `GET /api/products/:id` - Get single product
- `GET /api/products/:id/offers` - Get offers for a product

### Offers
- `GET /api/offers/mine` - Get current user's offers
- `POST /api/offers` - Create new offer
- `PUT /api/offers/:id` - Update offer
- `DELETE /api/offers/:id` - Delete offer (fails if hooks are reserved+)
- `POST /api/offers/:id/confirm-pickup` - Confirm pickup readiness + create escrow

### Hooks
- `GET /api/hooks` - Get user's hooks (query: fromOfferId, toOfferId)
- `POST /api/hooks` - Create hook { fromOfferId, toOfferId }
- `DELETE /api/hooks/:id` - Remove hook (only if status is searching/cycle_found)

### Escrow
- `POST /api/escrow/block` - Block funds { offerId, amount }
- `POST /api/escrow/release` - Release funds after exchange

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Chat
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/messages` - Send message { conversationId, content }

### Direct Exchange
- `POST /api/direct-exchange-requests` - Request 1:1 exchange { myOfferId, targetOfferId }

## Replacing Mock Store with Real APIs

### Step 1: Create API Client
```typescript
// /lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchProducts(filters) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/products?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}
// ... more API functions
```

### Step 2: Create Custom Hooks
```typescript
// /hooks/use-products.ts
import useSWR from 'swr';

export function useProducts(filters) {
  const { data, error, mutate } = useSWR(
    ['/api/products', filters],
    () => fetchProducts(filters)
  );
  return { products: data, isLoading: !error && !data, mutate };
}
```

### Step 3: Replace Store Usage
```typescript
// Before (mock store)
const { products } = useBarterStore();

// After (real API)
const { products, isLoading } = useProducts(filters);
```

## Component Reusability

### OfferCard Component
The `OfferCard` component is designed to be reusable across:
- My Offers tab (owner view)
- View Offers panel (browsing view)
- Chat adaptive cards

Props:
- `offer` - The offer data object
- `isOwner` - Boolean to show owner-specific actions
- `isExpanded` - Boolean to show/hide hooks section
- `onEdit` - Callback for edit action
- `onConfirmPickup` - Callback for pickup confirmation
- `onHook` - Callback for hooking
- `onViewDetails` - Callback for viewing details

## Real-Time Updates

For real-time features (notifications, chat, hook status updates):

### Option 1: WebSocket
```typescript
// Connect on mount
useEffect(() => {
  const ws = new WebSocket('wss://api.barter-x.com/ws');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'notification') {
      addNotification(data.payload);
    }
  };
  return () => ws.close();
}, []);
```

### Option 2: Polling
```typescript
// Poll every 30 seconds
useSWR('/api/notifications', fetcher, { refreshInterval: 30000 });
```

## Security Considerations

1. **JWT Token Storage**: Store in httpOnly cookie, not localStorage
2. **Input Validation**: All inputs validated on backend
3. **Authorization**: Check offer ownership before allowing edits
4. **Escrow**: Use database transactions for fund blocking
5. **Rate Limiting**: Implement on hook creation to prevent spam

## Scalability for 10000+ Products

### Pagination
All list endpoints should support pagination:
```typescript
GET /api/products?page=1&limit=20&category=Electronics
```

### Caching
- Cache product listings (5 min TTL)
- Cache category/subcategory/brand lists (1 hour TTL)
- Invalidate offer counts on hook creation/deletion

### Database Indexes
```sql
-- Essential indexes for performance
CREATE INDEX idx_offers_product ON offers(product_id);
CREATE INDEX idx_offers_owner ON offers(owner_user_id);
CREATE INDEX idx_hooks_from ON hooks(from_offer_id);
CREATE INDEX idx_hooks_to ON hooks(to_offer_id);
CREATE INDEX idx_hooks_status ON hooks(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

### Frontend Virtualization
For large lists, consider using react-window:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} itemCount={products.length} itemSize={120}>
  {({ index, style }) => (
    <div style={style}>
      <ProductCard product={products[index]} />
    </div>
  )}
</FixedSizeList>
```

## Key User Flows

### 1. Hook an Offer
```
User clicks "Hook this offer" -> HookOfferModal opens
User selects which of their offers to hook from
Frontend: POST /api/hooks { fromOfferId, toOfferId }
Backend: Creates hook with status "searching"
Trade Engine: Runs cycle detection algorithm
If cycle found: Updates hooks to "cycle_found" -> "reserved"
```

### 2. Confirm Pickup Readiness
```
User clicks "Confirm Pickup Readiness" on reserved offer
PickupReadinessModal opens
User enters address + escrow amount
Frontend: POST /api/offers/:id/confirm-pickup { address, escrowAmount }
Backend: 
  1. Block escrow funds
  2. Set offer.readyForCommit = true
  3. If all parties ready, update hooks to "processing"
  4. Create notifications for all parties
```

### 3. Direct Exchange Request
```
User sees "Request Direct Exchange" button (when their offer matches hooked products)
Frontend: POST /api/direct-exchange-requests { myOfferId, targetOfferId }
Backend:
  1. Create notification for target offer owner
  2. If accepted, create hook pair with status "reserved"
```

### 4. View Offer Details
```
User clicks eye icon on any offer card
OfferDetailsModal shows:
  - Offer title, description
  - "Looking for these products" (products this offer is hooked TO)
  - If user has matching offer: "Request Direct Exchange" button
```

## Notification Types

| Type | Trigger | Action |
|------|---------|--------|
| `hook_reserved` | Hook status changed to reserved | view_chat |
| `pickup_confirm` | Other party confirmed pickup | confirm_pickup |
| `chat_message` | New message received | view_chat |
| `trade_committed` | All parties confirmed, trade locked | view_status |
| `delivery_requested` | Delivery support requested | view_chat |
| `direct_exchange_req` | Direct exchange requested | view_offer |
| `status_update` | General status change | view_status |

## View Offers Panel - Owner Features

When a user views their own offer inside a product's offer list:
- Shows edit button (pencil icon)
- Shows "Confirm Pickup Readiness" button (if hook is reserved)
- Shows pickup date (if already confirmed)
- Shows hook status badge (Reserved, Committed)
- Same functionality as My Offers tab

This ensures users can manage their offers from anywhere they see them.

## Responsive Grid System

Product and offer cards use responsive grids:
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (1024px - 1280px): 3 columns
- Large monitors (> 1280px): 4 columns

Cards use `w-full` within grid cells (no max-width constraints).
