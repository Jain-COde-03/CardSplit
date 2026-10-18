# CardBridge — Database Schema Specification

This document details the MongoDB collections, schemas, indexing strategies, relationships, and serialization rules for CardBridge.

---

## 1. Design Guidelines

1. **Explicit Mongoose Schemas**: Strict typing, default values, custom validators, and enum constraints.
2. **Indexing Strategy**:
   - Unique indexes on natural keys (e.g., `email`, `retailer` + `retailerProductId`).
   - Compound indexes on common filter/sort patterns (e.g., `{ userId: 1, createdAt: -1 }`).
   - Sparse or TTL indexes where appropriate (e.g., unverified sessions, password reset tokens).
3. **Projection Security**:
   - Sensitive fields (`passwordHash`, `verificationTokenHash`, `resetPasswordTokenHash`) are marked with `select: false` so they are never returned by default queries.
4. **Referential Integrity**:
   - Soft or hard cascade deletions where relevant, preventing dangling references.
5. **No Card Data Storage**:
   - **Strict prohibition**: Full card numbers (PAN), CVVs, PINs, OTPs, or online banking passwords must NEVER be accepted, stored, or processed.

---

## 2. Planned Collections by Domain

| Domain | Collection | Primary Responsibility |
|---|---|---|
| **Identity & Security** | `users` | User accounts, profiles, preferences, role-based access |
| | `sessions` | Active user sessions, refresh tokens, device info |
| | `auditLogs` | Immutable log of security and administrative operations |
| **Financial & Assets** | `userCards` | Credit card products listed by users (issuer, card name, variant) |
| | `offers` | Bank & credit card promotions, discount rules, caps, validity |
| **Commerce & Analysis** | `products` | Canonical product metadata, pricing, retailer identifiers |
| | `productAnalyses` | Audit trail and async processing jobs for URL analyses |
| | `savedDeals` | User bookmarks for calculated deals and cardholder matches |
| | `dealRequests` | Buyer/cardholder request, calculated fee split, simulated status history, delivery details, and rating |
| **Social Graph** | `connections` | Peer connections between CardBridge users |
| | `groups` | User community groups (public, private, hidden) |
| | `groupMembers` | Group memberships and role assignments (admin, moderator, member) |
| | `posts` | Community discussions and deal share posts |
| | `comments` | Post replies and discussions |
| | `postReactions` | Post reactions (likes, helpful, etc.) |
| **Real-time Comms** | `conversations` | 1-to-1 or group chat threads |
| | `messages` | Direct chat messages with delivery and read statuses |
| | `notifications` | In-app alerts for deals, connections, and group updates |
| **Trust & Safety** | `requests` | Coordination requests between users for cardholder assistance |
| | `transactions` | Legitimate non-custodial transaction tracking records |
| | `reviews` | Verified feedback on completed user interactions |
| | `reports` | Moderation queue for reported content, users, or spam |

---

## 3. Schema Definitions

### 1. `users`

```javascript
{
  _id: ObjectId,
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  emailVerified: { type: Boolean, default: false },
  roles: { type: [String], enum: ['user', 'moderator', 'admin'], default: ['user'] },
  profile: {
    avatarUrl: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    city: { type: String, trim: true },
    isAvailableForAssistance: { type: Boolean, default: true }
  },
  preferences: {
    visibility: { type: String, enum: ['public', 'connections_only', 'private'], default: 'public' },
    notifications: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    }
  },
  accountStatus: { type: String, enum: ['active', 'suspended', 'deactivated'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Indexes:
// - { email: 1 } (Unique)
// - { accountStatus: 1, 'preferences.visibility': 1 }
```

### 2. `userCards`

*Distinguishes between user claims, card verification, and offer eligibility.*

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'users', required: true, index: true },
  issuer: { type: String, required: true, trim: true }, // e.g. 'HDFC Bank', 'ICICI Bank', 'SBI Card', 'Axis Bank'
  cardProduct: { type: String, required: true, trim: true }, // e.g. 'Regalia Gold', 'Infinia', 'Amazon Pay ICICI'
  cardVariant: { type: String, trim: true }, // e.g. 'Visa Signature', 'Mastercard World', 'RuPay'
  creditLimit: { type: Number, min: 0, default: null }, // Member-reported total limit; not available credit
  milestone: { type: String, maxlength: 240, default: '' },
  benefit: { type: String, maxlength: 240, default: '' },
  displayLabel: { type: String, trim: true, maxlength: 50 }, // User custom label, e.g. "My Primary Shopping Card"
  ownershipVerificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  visibility: { type: String, enum: ['public', 'connections_only', 'hidden'], default: 'public' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Indexes:
// - { userId: 1, issuer: 1, cardProduct: 1 } (Compound)
// - { issuer: 1, cardProduct: 1, ownershipVerificationStatus: 1 }
```

Offer matching may use the member-reported total card limit as a screening signal, but this does not establish current available credit. The cardholder must explicitly confirm sufficient available credit before accepting a deal request. Deal estimates apply 10% of the eligible instant discount to the cardholder and 10% to the platform:

```text
buyer funding estimate = product price - discount + cardholder commission + platform fee
cardholder payout estimate = product price - discount + cardholder commission
```

Deal lifecycle actions are simulation-only; the application does not collect or hold funds, place retailer orders, or verify delivery.

### 3. `products`

```javascript
{
  _id: ObjectId,
  retailer: { type: String, enum: ['amazon_in', 'flipkart'], required: true, index: true },
  retailerProductId: { type: String, required: true, trim: true, index: true }, // ASIN or FSN
  canonicalUrl: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  currentPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  availabilityStatus: { type: String, enum: ['in_stock', 'out_of_stock', 'pre_order', 'unknown'], default: 'in_stock' },
  source: { type: String, required: true }, // e.g. 'official_api', 'affiliate_feed', 'partner_catalog'
  lastFetchedAt: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Indexes:
// - { retailer: 1, retailerProductId: 1 } (Unique)
// - { lastFetchedAt: 1 }
```

### 4. `offers`

```javascript
{
  _id: ObjectId,
  title: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true, index: true }, // e.g. 'HDFC Bank'
  eligibleCardProducts: [{ type: String, trim: true }], // Specific card products or ['ALL']
  merchant: { type: String, enum: ['amazon_in', 'flipkart', 'all'], required: true, index: true },
  discountType: { 
    type: String, 
    enum: ['instant_discount_percentage', 'instant_discount_flat', 'cashback_percentage', 'cashback_flat', 'emi_discount'], 
    required: true 
  },
  discountValue: { type: Number, required: true, min: 0 }, // Percentage rate (e.g. 10) or Flat amount (e.g. 1000)
  minimumPurchase: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, default: null }, // Cap on discount, null if uncapped
  eligibleCustomerTypes: [{ type: String, enum: ['all', 'prime_members', 'plus_members', 'new_cardholders'] }],
  exclusions: [{ type: String }],
  emiRequired: { type: Boolean, default: false },
  cashbackDelayDays: { type: Number, default: 0 }, // e.g. 90 days for statement credit
  validityStart: { type: Date, required: true },
  validityEnd: { type: Date, required: true, index: true },
  sourceUrl: { type: String, trim: true },
  verificationStatus: { type: String, enum: ['verified', 'unverified', 'community_submitted'], default: 'unverified' },
  lastCheckedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Indexes:
// - { merchant: 1, issuer: 1, validityEnd: 1 }
// - { validityStart: 1, validityEnd: 1 }
```

### 5. `productAnalyses`

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'users', default: null, index: true },
  submittedUrl: { type: String, required: true, trim: true },
  retailer: { type: String, enum: ['amazon_in', 'flipkart', 'unsupported'], required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'partial', 'failed'], 
    default: 'pending',
    index: true
  },
  productId: { type: ObjectId, ref: 'products', default: null },
  discoveredOfferIds: [{ type: ObjectId, ref: 'offers' }],
  errorCode: { type: String, default: null },
  errorMessage: { type: String, default: null },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}
// Indexes:
// - { startedAt: -1 }
// - { userId: 1, createdAt: -1 }
```

---

## 4. Phase-by-Phase Schema Implementation Plan

To keep the development lean, testable, and regression-free:

- **Phase 1**: Infrastructure & Health (no operational collections required; DB connectivity verified via Mongoose).
- **Phase 2**: `products`, `productAnalyses`.
- **Phase 3**: `offers`.
- **Phase 4**: `users`, `sessions`.
- **Phase 5**: `userCards`.
- **Phase 6**: `savedDeals`, `connections`.
- **Phase 7**: `groups`, `groupMembers`, `posts`, `comments`, `postReactions`.
- **Phase 8**: `conversations`, `messages`, `notifications`.
- **Phase 9**: `requests`, `transactions`, `reviews`.
- **Phase 10**: `reports`, `auditLogs`.
