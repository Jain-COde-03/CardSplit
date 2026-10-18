# CardBridge — Frontend Integration & API Contracts

This document is the **single source of truth** for API interactions between the CardBridge backend and frontend clients (React/Vite).

---

## 1. Global Specifications

- **Base URL (Local Development)**: `http://localhost:5001/api/v1`
- **Frontend Environment Variable**:
  ```env
  VITE_API_BASE_URL=http://localhost:5001/api/v1
  ```
- **Interactive Documentation**: `http://localhost:5001/api-docs`

---

## 2. Standard Response Envelopes

Every JSON response returned by the CardBridge backend strictly follows one of the two standard structures.

### Success Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "4d16d7a4-37f2-491a-a1b4-7ff534571932",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 85,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

*Note: The `meta.pagination` block is present only on paginated listing endpoints.*

### Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRODUCT_URL",
    "message": "Please enter a valid product URL from a supported retailer (Amazon India or Flipkart).",
    "details": []
  },
  "meta": {
    "requestId": "4d16d7a4-37f2-491a-a1b4-7ff534571932"
  }
}
```

---

## 3. Standard HTTP Status Codes

| Code | Meaning | When Used |
|---|---|---|
| **200 OK** | Request succeeded | Standard response for successful GET, PUT, PATCH requests |
| **201 Created** | Resource created | Successful POST creating a new resource (e.g. user, card, post) |
| **202 Accepted** | Processing accepted | Asynchronous long-running jobs (e.g. product URL scraping/analysis) |
| **204 No Content** | Action completed | Successful DELETE requests with no body returned |
| **400 Bad Request** | Malformed input | Syntactically invalid payloads or URL query parameters |
| **401 Unauthorized** | Unauthenticated | Missing, expired, or invalid session or authentication tokens |
| **403 Forbidden** | Access denied | User authenticated, but lacks permissions (e.g. private group access, admin routes) |
| **404 Not Found** | Missing resource | Resource or endpoint path does not exist |
| **409 Conflict** | Conflict | Duplicate resource conflict (e.g. email already registered, duplicate connection request) |
| **422 Unprocessable** | Validation error | Valid JSON syntax, but fails schema validation (e.g. invalid URL, weak password) |
| **429 Too Many Req** | Rate limited | IP or user exceeded rate limits |
| **500 Server Error** | Internal failure | Unexpected backend exception (sanitized in production) |
| **503 Unavailable** | Readiness check | Service or database is still starting or unreachable |

---

## 4. Endpoints Catalog by Phase

### Phase 1 — Infrastructure & Health (Implemented)

#### `GET /health`
- **Auth**: None
- **Description**: Verifies HTTP server liveness.
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "uptimeSeconds": 142.5
    },
    "meta": { "requestId": "uuid" }
  }
  ```

#### `GET /health/ready`
- **Auth**: None
- **Description**: Verifies MongoDB database connectivity.
- **Response `200` (Ready)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ready",
      "database": { "status": "connected" }
    },
    "meta": { "requestId": "uuid" }
  }
  ```
- **Response `503` (Not Ready)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "The application is still starting or MongoDB is not ready yet."
    },
    "meta": { "requestId": "uuid" }
  }
  ```

---

### Phase 2 — Product URL Analysis (Planned)

#### `POST /products/analyze`
- **Auth**: Optional (tracks `userId` if logged in)
- **Request Body**:
  ```json
  {
    "url": "https://www.amazon.in/dp/B0BDK62PDX"
  }
  ```
- **Response `202 Accepted`** (Async processing initiated):
  ```json
  {
    "success": true,
    "data": {
      "analysisId": "651f8a84c259bb0012345678",
      "status": "processing",
      "retailer": "amazon_in",
      "submittedUrl": "https://www.amazon.in/dp/B0BDK62PDX"
    },
    "meta": { "requestId": "uuid" }
  }
  ```

#### `GET /products/analyses/:analysisId`
- **Auth**: Optional
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "analysisId": "651f8a84c259bb0012345678",
      "status": "completed",
      "retailer": "amazon_in",
      "product": {
        "id": "651f8a84c259bb0012345679",
        "title": "Apple iPhone 14 (128 GB) - Blue",
        "currentPrice": 58999,
        "currency": "INR",
        "imageUrl": "https://m.media-amazon.com/images/I/..."
      },
      "availableOffersCount": 4
    },
    "meta": { "requestId": "uuid" }
  }
  ```

#### `GET /products/:productId`
- **Auth**: Optional
- **Response `200 OK`**: Returns canonical product record.

#### `GET /products/:productId/offers`
- **Auth**: Optional
- **Response `200 OK`**: Returns list of active, verified offers matched to this product.

---

### Phase 3 — Offer Calculation Engine (Planned)

#### `POST /offers/calculate`
- **Auth**: Optional
- **Request Body**:
  ```json
  {
    "productId": "651f8a84c259bb0012345679",
    "userCardIds": ["651f8a84c259bb0012345680"]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "listedPrice": 58999,
      "currency": "INR",
      "rankedCalculations": [
        {
          "offerId": "651f8a84c259bb0012345681",
          "offerTitle": "10% Instant Discount on HDFC Bank Credit Cards",
          "issuer": "HDFC Bank",
          "discountType": "instant_discount_percentage",
          "instantDiscount": 5000,
          "payableNow": 53999,
          "delayedCashback": 0,
          "estimatedNetCost": 53999,
          "eligibilityStatus": "eligible",
          "verificationStatus": "verified",
          "assumptions": [
            "Requires payment with eligible HDFC Bank Credit Card at checkout",
            "Maximum discount capped at ₹5,000 per card"
          ]
        }
      ]
    },
    "meta": { "requestId": "uuid" }
  }
  ```

---

### Phase 4 — Authentication & User Profiles (Planned)

- `POST /auth/register` — Email, password, name registration.
- `POST /auth/login` — Issues HTTP-only session cookie.
- `POST /auth/logout` — Destroys session, clears cookie.
- `GET /auth/me` — Returns current logged-in user profile.
- `POST /auth/verify-email` — Confirms email verification token.
- `POST /auth/forgot-password` — Generates reset token (generic response, no account leaking).
- `POST /auth/reset-password` — Resets password with token.

---

### Phase 5 — Card Registration & Matching (Planned)

- `POST /cards` — User registers a credit card product (issuer, card product, variant).
- `GET /cards` — List current user's registered cards.
- `PATCH /cards/:cardId` — Update card visibility or label.
- `DELETE /cards/:cardId` — Remove card from profile.
- `POST /matches/search` — Search for CardBridge members with eligible cards for a product.

The implemented offer-specific search is `GET /members/cardholders?analysisId=<id>&offerIndex=<index>` (authenticated). The server uses the stored analysis, not client-supplied price or offer values. It returns only members who opted into discovery and have a discoverable card explicitly named by the offer (structured card name or exact card name in offer text), whose member-reported total credit limit is at least the full listed product price, and whose product price meets the offer minimum. The limit is not a live available-credit check; the cardholder must explicitly confirm they currently have sufficient available credit when accepting a request. Unknown card identity, missing price/minimum, and a missed minimum return no matches with an eligibility reason; another user's private analysis returns `404`.

`POST /deal-requests` creates a request from an analysis, offer index, cardholder, card listing, and delivery address. Server-calculated instant-discount estimates give 10% of the discount to the cardholder and 10% to the platform; the buyer estimate is `product price - discount + both commissions`, and the cardholder payout estimate is `product price - discount + cardholder commission`. `PATCH /deal-requests/:dealRequestId/agree` requires `{ "confirmAvailableCredit": true }`; the cardholder may instead use `/decline`. The `fund-escrow`, `place-order`, and `confirm-delivery` actions change demo status only: they do not collect, hold, or release money, create a retailer order, or verify delivery. Estimated amounts and deal activity are marked as simulation-only.

---

### Phase 6 — Saved Deals & Connections (Planned)

- `POST /deals/save` — Bookmark a product & offer calculation.
- `GET /deals/saved` — List saved deals.
- `DELETE /deals/saved/:dealId` — Remove a saved deal.
- `GET /connections` — List confirmed user connections.
- `POST /connections/requests` — Send a connection request.
- `PATCH /connections/requests/:requestId` — Accept or decline request.
- `DELETE /connections/:connectionId` — Disconnect or remove connection.

The implemented `POST /connections` endpoint accepts `{ "targetUserId": "<memberId>", "message": "<optional introduction>" }`. The optional introduction is limited to 500 characters and is shown with the request in the Connections workspace.

---

### Phase 7 — Groups & Community Discussions (Planned)

- `POST /groups` — Create community group.
- `GET /groups/:groupId` — View group details.
- `POST /groups/:groupId/join` — Join public group.
- `POST /posts` — Create community post or deal sharing.
- `GET /posts` — Paginated community feed.
- `POST /posts/:postId/comments` — Add comment to post.
- `POST /posts/:postId/reactions` — Add reaction.

---

### Phase 8 — Real-time Messaging (Socket.IO Events)

- Client connects with authenticated session cookie to `/socket.io`.
- `join_conversation` (`{ conversationId }`) -> Joins authorized room.
- `send_message` (`{ conversationId, content }`) -> Validated server-side; broadcasts `new_message`.
- `message_read` (`{ conversationId, messageId }`) -> Broadcasts read receipt.
