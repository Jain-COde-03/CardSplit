# CardBridge frontend

## Run locally

1. Configure and start the API from `backend` (see the backend README). The default API port is `5001`.
2. In `frontend`, run `npm install` once, then `npm run dev`.
3. Open the Vite URL printed in the terminal.

The frontend uses `http://localhost:5001/api/v1` by default. Set `VITE_API_BASE_URL` in a local frontend `.env` file to use another API. Never put backend secrets in Vite variables.

## Routes

- `/` and `/analyze` — product URL analysis
- `/compare/:productId` — current analysis results
- `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` — real account access and recovery
- `/dashboard`, `/cards`, `/saved-deals`, `/history`, `/community`, `/connections`, `/groups`, `/messages`, `/profile` — signed-in workspace

The workspace uses persistent API data for accounts, card products, saved offers, analysis history, opt-in member discovery, connection requests, public groups, community posts, and private messages. Email verification and password recovery require SMTP settings in the backend. Profile photos require Cloudinary credentials.

Cardholder discovery requires sign-in and both profile-level discovery consent and a card listing explicitly marked discoverable. Listed cards are not ownership verification; issuer/product matches do not establish offer eligibility. An offer minimum spend is a transaction condition, not an estimate of a member's spending capacity.

The normal app has no fictional data. For a hackathon presentation, the backend has an opt-in seed command that creates 25 fictional member accounts, illustrative product offers, discoverable card listings, and community activity. From `backend`, run `npm run seed:demo`. For an isolated local development database, `npm run seed:demo:reset` removes only old `@cardbridge.test` accounts and linked sample records before reseeding. At `/login`, select any named sample account to fill its email and the shared password `BridgeDemo2026!`, then use the regular **Log in** button. These offer values and member profiles are fictional and unverified; do not present them as live retailer data.

The seed command refuses to run when `NODE_ENV=production` unless `ALLOW_DEMO_DATA=true` is explicitly set. Only enable it against an isolated presentation database. For a deployed frontend, set `VITE_ENABLE_DEMO_LOGIN=true` at build time to show the sample account selector. Product analyses still remain in session storage for result navigation, while signed-in analyses are also persisted to account history.

## Commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
