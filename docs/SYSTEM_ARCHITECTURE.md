# CardBridge — System Architecture & Technical Design

This document describes the high-level architecture, module boundaries, security model, and data flow for the **CardBridge** backend.

---

## 1. System Overview & Philosophy

CardBridge is an intelligent credit-card offer comparison, product-price analysis, and cardholder-discovery platform. It empowers online shoppers to find the maximum legitimate discount on e-commerce products (e.g. Amazon India, Flipkart) through bank credit-card promotions.

### Guiding Architectural Principles

1. **Core Feature First**: Product URL analysis, offer discovery, and mathematical discount calculation are the core value proposition. Community, discovery, and messaging exist strictly to support the primary journey.
2. **Modular Monolith**: We avoid premature distributed microservices. A modular monolith using Node.js, Express, and MongoDB keeps development, security auditing, and transaction boundaries simple and verifiable.
3. **Defense in Depth**: Every external input (especially URLs from users) is treated as untrusted. SSRF protections, strict domain allowlists, schema validations, rate limiting, and defensive headers are mandatory.
4. **Honest and Verifiable Claims**:
   - A user listing a card product is NOT proof of ownership.
   - Card ownership is NOT proof of offer eligibility.
   - Delayed cashback is NOT an immediate discount.
   - Missing or unverified data is explicitly surfaced as `unknown` or `unverified`.

---

## 2. Layered Architecture Diagram

```
                 +-----------------------------------------+
                 |       Frontend (React / Vite)           |
                 +--------------------+--------------------+
                                      | HTTP REST / WebSocket
                                      v
+-------------------------------------------------------------------------+
|                        CardBridge Express Backend                       |
|                                                                         |
|  [Security & Pipeline Middleware]                                       |
|  - Helmet (CSP, HSTS, Secure Headers)                                   |
|  - CORS (Strict allowlist: CLIENT_ORIGIN)                               |
|  - Express Rate Limiter (IP-based, Route-specific)                      |
|  - Request ID Tracking (crypto.randomUUID -> x-request-id)               |
|  - Body Parsers (express.json limit 1MB)                                |
|  - Swagger UI (/api-docs)                                               |
|                                                                         |
|  [API Routing Layer (/api/v1)]                                          |
|  - Health Routes (/health, /health/ready)                               |
|  - Auth Routes (/auth/*)                                                |
|  - Product & URL Analysis Routes (/products/*)                          |
|  - Offer Engine Routes (/offers/*)                                      |
|  - Card Management & Matching Routes (/cards/*, /matches/*)             |
|  - Connections & Groups Routes (/connections/*, /groups/*)              |
|  - Real-time Sockets (Socket.IO namespace & rooms)                      |
|                                                                         |
|  [Validation Layer]                                                     |
|  - Zod Request Body, Query, and Parameter Schemas                       |
|                                                                         |
|  [Controllers & Service Layer]                                          |
|  - ProductAnalysisService & Retailer Provider Adapters                  |
|  - OfferCalculationEngine                                               |
|  - CardMatchingService                                                  |
|  - AuthService & SessionManager                                         |
|                                                                         |
|  [Data Access Layer (Mongoose ODM)]                                     |
|  - Strict Schemas, Compound Indexes, Lean Queries, Safe Serialization   |
|                                                                         |
|  [Centralized Error Handling]                                           |
|  - Custom AppError with status codes and error codes                    |
|  - Request ID injection, production stack trace stripping               |
+------------------------------------+------------------------------------+
                                     |
                                     v
                 +-----------------------------------------+
                 |       MongoDB (Local / Atlas)           |
                 +-----------------------------------------+
```

---

## 3. Key Subsystems & Design

### A. URL Analysis & SSRF Prevention Pipeline

When a user submits a product URL:

1. **Protocol Check**: Only `https://` is accepted.
2. **Domain Allowlist**: Hostnames are validated against supported retailers (e.g. `amazon.in`, `flipkart.com`). IP addresses, `localhost`, internal subnets (e.g., `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16`), and embedded credentials (`user:pass@host`) are strictly rejected.
3. **Provider Abstraction**: Retailer data fetching sits behind a unified provider interface:
   ```javascript
   interface RetailerProvider {
     canHandle(url: string): boolean;
     extractProductId(url: string): string;
     fetchProductDetails(productId: string): Promise<ProductDetails>;
     fetchOffers(productId: string): Promise<Offer[]>;
   }
   ```
4. **Asynchronous Polling**: Heavy or rate-limited provider calls return `202 Accepted` with an `analysisId` so the frontend can poll `GET /api/v1/products/analyses/:analysisId` without request timeouts.

### B. Offer Calculation Engine

The calculation engine is isolated from Express HTTP controllers in `services/offerCalculator.js`:

- **Input**: Product price, available card offers, user card inventory.
- **Rules Evaluated**:
  1. Minimum transaction value requirements.
  2. Discount structure (percentage vs. flat amount).
  3. Maximum discount caps (e.g., "10% off up to ₹1,500").
  4. Instant discount vs. delayed cashback (separated into `payableNow` and `delayedCashback`).
  5. Offer stacking rules (stacking is rejected unless explicitly verified).
  6. Expiration timestamps and validity windows.
- **Output**: Explicit breakdown of `listedPrice`, `instantDiscount`, `payableNow`, `delayedCashback`, `estimatedNetCost`, `assumptions`, and `verificationStatus`.

### C. Security Architecture

1. **Authentication & Session Management**:
   - Passwords hashed with Argon2id or bcrypt (cost factor >= 12).
   - Short-lived JWT or cryptographically secure session IDs in HTTP-only, `SameSite=Strict` cookies.
   - CSRF protection for state-modifying requests using Double Submit Cookie or custom header verification.
2. **Access Control & Authorization**:
   - Backend enforces role and ownership checks on every request. Client-supplied roles are never trusted.
   - Private groups and resources require explicit membership lookup.
3. **Error Handling & Information Disclosure**:
   - Uniform response envelopes for success and failure.
   - Production mode strips stack traces and internal database errors.
   - Unique `requestId` generated per HTTP request and attached to response headers (`x-request-id`) and error payloads for debugging.

---

## 4. Real-time Architecture (Socket.IO)

- Real-time features (messages, notifications, connection updates) use Socket.IO.
- Handshakes are authenticated via session tokens/cookies.
- Sockets join dedicated user rooms: `user:<userId>` and conversation rooms: `conversation:<conversationId>`.
- Authorization is verified before joining any room.
- Client cannot spoof sender identity; sender identity is extracted strictly from the authenticated socket session.

---

## 5. Deployment & Operational Readiness

- **Graceful Shutdown**: Listens for `SIGINT` and `SIGTERM`, closes the HTTP server, finishes in-flight requests, and gracefully disconnects MongoDB via `mongoose.disconnect()`.
- **Health Checks**:
  - `GET /api/v1/health` (Liveness): Returns `200 OK` if the process is alive.
  - `GET /api/v1/health/ready` (Readiness): Verifies MongoDB connection state (`readyState === 1`). Returns `503 Service Unavailable` if MongoDB is down or reconnecting.
- **Interactive Documentation**: Swagger UI served at `/api-docs` during development with a documented OpenAPI 3.0 specification.

