# Purchase flow and judges' demo

1. Paste a supported product link. Extract the price and retailer-page offers.
2. Highlight the highest eligible estimated instant discount, accounting for minimum purchase and discount caps. Delayed cashback is excluded from instant-discount calculations. The best-pick estimate is before member commissions.
3. If the page has no offers, query active, unexpired general retailer benefits in the `cardbenefits` collection. The `CardBenefit` model requires the source URL, verification date and expiry date. These entries must be maintained from confirmed terms; the application does not scrape an issuer catalog automatically.
4. With an empty catalog, non-production environments use explicitly labeled illustrative demo benefits. Production never uses these demo benefits.
5. Match listed cards and reported spending capacity. Use available credit when supplied, otherwise the reported total limit. Members reconfirm available credit when accepting; these values are not verified bank balances.
6. Choose a cardholder, review their commission and ratings, and submit the delivery address. The request starts in `requested`, with no escrow funding.
7. The cardholder accepts or declines. For a local judges' demo, the buyer can click **Simulate reply: accept** or **Simulate reply: decline**. These explicit actions are disabled in production.
8. After acceptance, the buyer simulates escrow funding. A persisted system notification instructs the cardholder to order to the submitted address. Open rooms refresh every five seconds.
9. Simulate order placement, then order verification. The buyer confirms delivery to record the payout. Repeating delivery confirmation cannot release the payout twice.
10. The buyer can leave one rating and review after completion.

For product price X, instant discount Y, and the selected cardholder's rate C:

- Buyer funding: X − Y + (C / 100 × Y) + (10 / 100 × Y).
- Cardholder payout: X − Y + (C / 100 × Y).
- Platform share: 10 / 100 × Y.

Payment collection, order verification and payouts are simulated records. A live payment/escrow provider and independent retailer/delivery integrations remain necessary for real transactions.

Checks: `npm test -- tests/unit/offerRecommendation.test.js tests/integration/accountFeatures.test.js tests/integration/productAnalysis.test.js` in `backend`; `npm run build` in `frontend`.

## Showcase cardholder fallback

On each successful non-production analysis, the best pick is checked for an eligible discoverable cardholder other than the buyer. If none exists, the application reuses a labeled showcase profile and upserts its matching card with sufficient reported spending capacity. Repeated analyses do not create duplicate profiles or cards; higher prices raise the sample card’s capacity. When no scraped offer can support the demo, an explicitly illustrative offer is added while preserving the original offers. Showcase profiles are excluded from production discovery and deal creation. Reanalyze a product to apply this fallback to older results.
