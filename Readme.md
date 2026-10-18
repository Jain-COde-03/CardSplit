# CardBridge

CardBridge connects shoppers who find an eligible credit-card offer with opted-in members who have the matching card. A shopper pastes a supported product link, reviews matching cardholders and the estimated deal split, then sends a purchase request with delivery details. Either member may also list cards and act as a buyer. The cardholder must confirm available credit when accepting; listed total limits are member-reported and do not verify a current balance.

For an eligible instant discount of `y` on a product priced at `x`, the cardholder commission and platform fee are each 10% of `y`. The buyer’s estimated funding amount is `x - y + 0.1y + 0.1y`; the cardholder payout after delivery is `x - y + 0.1y`. Deal acceptance, escrow, checkout, order, and delivery actions are status-only simulations in this version: no payment is collected, no funds are held or released, and no retailer order or delivery is verified.

---

## Repository Structure

```
CardBridge/
├── backend/          # Node.js / Express / MongoDB backend service
│   ├── src/          # Source code (config, routes, middleware, services, etc.)
│   ├── tests/        # Automated test suites (unit and integration)
│   ├── .env.example  # Environment variables template
│   ├── package.json  # Backend dependencies and scripts
│   └── README.md     # Detailed backend setup guide
├── frontend/         # React / Vite frontend client
│   ├── src/          # React components and styling
│   └── package.json  # Frontend dependencies and scripts
├── docs/             # Technical specifications and API documentation
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_CONTRACTS.md
│   └── DEVELOPMENT_ROADMAP.md
├── .gitignore        # Root gitignore
└── README.md         # Top-level workspace overview
```

---

## Quickstart

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MongoDB**: Local MongoDB instance (running at `mongodb://127.0.0.1:27017`) or a free MongoDB Atlas connection string.

---

### 2. Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if you need to customize PORT, MONGODB_URI, or CLIENT_ORIGIN

# 3. Start development server
npm run dev

# 4. Run tests
npm test

# 5. Run linter
npm run lint
```

When running, the backend is available at:
- **Base URL**: `http://localhost:5001/api/v1`
- **Health Check**: `http://localhost:5001/api/v1/health`
- **Readiness Check**: `http://localhost:5001/api/v1/health/ready`
- **Swagger Documentation**: `http://localhost:5001/api-docs`

---

### 3. Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

The frontend will run by default at `http://localhost:5173`.

---

## Technical Documentation

Refer to the [`docs/`](./docs) folder for detailed engineering specifications:
- [`SYSTEM_ARCHITECTURE.md`](./docs/SYSTEM_ARCHITECTURE.md) — System layers, SSRF protection pipeline, offer calculation flow.
- [`DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — MongoDB collections, field types, and indexing strategy.
- [`API_CONTRACTS.md`](./docs/API_CONTRACTS.md) — Detailed request and response contracts for all endpoints.
- [`DEVELOPMENT_ROADMAP.md`](./docs/DEVELOPMENT_ROADMAP.md) — Phased milestone tracker and implementation plan.
