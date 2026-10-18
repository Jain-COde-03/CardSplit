# CardBridge Backend

This is the production-minded backend foundation for **CardBridge**, built with Node.js (ES Modules), Express.js, and MongoDB (via Mongoose).

It provides:
- Environment variable validation using **Zod**
- Centralized error handling and structured request tracking (`x-request-id`)
- Security hardening via **Helmet** and strict **CORS** allowlisting
- Rate limiting to protect against abuse
- MongoDB database connection management with graceful shutdown
- Comprehensive health check endpoints (`/api/v1/health` and `/api/v1/health/ready`)
- Interactive API documentation powered by **Swagger UI** (`/api-docs`)
- Comprehensive automated test coverage with **Vitest** and **Supertest**

---

## 1. Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MongoDB**: Either a local MongoDB instance or a free MongoDB Atlas cluster.

---

## 2. Initial Setup

### Step 1: Open the backend directory
```bash
cd backend
```

### Step 2: Configure Environment Variables
Copy the example `.env.example` file to create your `.env` file:
```bash
cp .env.example .env
```

Your `.env` file will look like:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cardbridge
CLIENT_ORIGIN=http://localhost:5173
```

> **Note**: Never commit your `.env` file to version control. It is already added to `.gitignore`.

---

## 3. MongoDB Configuration Options

### Option A: Local MongoDB (Recommended for offline development)
1. Ensure MongoDB Community Server is installed and started on your machine:
   - On macOS with Homebrew:
     ```bash
     brew services start mongodb-community
     ```
   - On Linux (systemd):
     ```bash
     sudo systemctl start mongod
     ```
2. Use the local URI in `.env`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/cardbridge
   ```

### Option B: MongoDB Atlas (Cloud Hosted)
If you do not have MongoDB installed locally:
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free M0 cluster.
3. Under **Database Access**, create a database user with username and password.
4. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development).
5. Copy your connection string into `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cardbridge?retryWrites=true&w=majority
   ```

---

## 4. Install Dependencies

```bash
npm install
```

---

## 5. Running the Backend

### Development Mode (with hot-reloading via nodemon):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

When started, you should see console output:
```text
MongoDB connected successfully.
CardBridge backend running on http://localhost:5001
```

---

## 6. How to Verify Phase 1

### A. Check Interactive API Documentation (Swagger UI)
Open your browser and navigate to:
```
http://localhost:5001/api-docs
```
You can inspect and execute test requests directly through the UI.

### B. Verify Liveness Health Endpoint (curl or browser)
```bash
curl -i http://localhost:5001/api/v1/health
```
**Expected Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 14.2
  },
  "meta": {
    "requestId": "4d16d7a4-37f2-491a-a1b4-7ff534571932"
  }
}
```

### C. Verify Readiness Health Endpoint
```bash
curl -i http://localhost:5001/api/v1/health/ready
```
**When MongoDB is connected (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "database": {
      "status": "connected"
    }
  },
  "meta": {
    "requestId": "4d16d7a4-37f2-491a-a1b4-7ff534571932"
  }
}
```

**When MongoDB is disconnected (HTTP 503)**:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "The application is still starting or MongoDB is not ready yet."
  },
  "meta": {
    "requestId": "4d16d7a4-37f2-491a-a1b4-7ff534571932"
  }
}
```

### D. Verify 404 and Request ID Tracing
```bash
curl -i http://localhost:5001/api/v1/non-existent-route
```
**Expected Response (HTTP 404)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested route was not found."
  },
  "meta": {
    "requestId": "4d16d7a4-37f2-491a-a1b4-7ff534571932"
  }
}
```

---

## 7. Automated Testing & Code Quality

Run all unit and integration test suites:
```bash
npm test
```

Run ESLint static code analysis:
```bash
npm run lint
```

## 8. Account and Community Services

The API includes verified email/password accounts, HTTP-only cookie sessions, CSRF-protected mutations, user profiles, private card-product listings, saved deals, product history, opt-in member discovery, connection requests, community posts, public groups, and direct messages between accepted connections.

Authentication endpoints have separate IP-based request limits to slow credential guessing and verification/reset abuse: login and token submission allow 10 attempts per 15 minutes, registration allows 5 requests per hour, and password-reset requests allow 3 per hour. Rate-limit responses use HTTP 429 and return `AUTH_RATE_LIMITED`. This application-level control is not a network firewall or managed WAF. The default limiter store is in-process memory, so a multi-instance deployment should configure a shared store (for example Redis) and ensure the reverse proxy is trusted/configured correctly before relying on client IP rate limits.

Set `CLIENT_ORIGIN` to the exact frontend origin. For local development the defaults are `http://localhost:5173` for the client and port `5001` for the API. The frontend sends credentialed requests and keeps the synchronizer CSRF token in session storage; do not disable credentials or CSRF checks in a deployment.

Configure SMTP (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, and `EMAIL_FROM`) to enable registration verification and password resets. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for profile-photo uploads. Keep these credentials only in backend environment variables. Without SMTP configuration, new account registration cannot complete; without Cloudinary configuration, avatar uploads return an explicit service error.

Cardholder discovery is restricted to signed-in members. A person appears only when they enable profile discovery and mark the specific card product discoverable. User-entered card listings are not verified ownership records. Offer matching and offer conditions are informational and do not verify issuer eligibility.

Community posts and groups are account-backed. Group posts are visible to members of private groups; direct messaging is allowed only between accepted connections. The application does not seed fictional accounts automatically.

### Optional sample accounts

For an isolated presentation database, run `npm run seed:demo` from `backend`. It idempotently seeds 25 fictional member accounts, all usable through the normal login form with the shared password `BridgeDemo2026!`. In development, choose any named account from the login page selector to fill its email and password, then press **Log in**. The seed also creates sample cards, an illustrative product analysis, a saved deal, a group, posts, a connection, and messages. Sample offers are labeled demo and unverified.

To start from a clean demo dataset, run `npm run seed:demo:reset`. This removes only accounts whose email ends in `@cardbridge.test` and the sample records linked to them, then recreates and validates the 25 fictional accounts. Reset is restricted to `NODE_ENV=development` and a local MongoDB host; it refuses remote databases unless `ALLOW_REMOTE_DEMO_RESET=true` is explicitly set. Do not use either seed command on a database containing real users or cards. If `NODE_ENV=production`, the regular seed command refuses unless `ALLOW_DEMO_DATA=true` is explicitly set.

Offer-specific cardholder discovery requires a completed analysis and offer index. It returns only opted-in members with an explicitly identified listed card, a reported total limit at least the full listed product price, and a product price that meets the offer minimum. The limit is member-reported and does not reveal current available credit; unverified card ownership and offer terms remain unverified.

Before a public deployment, configure production SMTP, Cloudinary, MongoDB, HTTPS, domain-specific CORS, retention/privacy policies, abuse reporting/moderation, and operational monitoring. The available product scraping and offer data still depends on what the retailer page exposes and must not be presented as guaranteed eligibility.
