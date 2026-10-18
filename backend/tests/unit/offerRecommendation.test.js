import { afterEach, describe, expect, it, vi } from 'vitest';
import CardBenefit from '../../src/models/CardBenefit.js';
import { estimateDiscount, recommendOffers } from '../../src/services/offerRecommendation.service.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('Best-pick recommendations', () => {
  it('applies minimum spend and caps, and does not count delayed cashback as instant savings', () => {
    expect(estimateDiscount({ discountType: 'instant_discount_percentage', discountValue: 10, minimumPurchase: 1000, maximumDiscount: 500 }, 10000)).toBe(500);
    expect(estimateDiscount({ discountType: 'instant_discount_flat', discountValue: 1000, minimumPurchase: 20000 }, 10000)).toBe(0);
    expect(estimateDiscount({ discountType: 'cashback_percentage', discountValue: 10, minimumPurchase: 0 }, 10000)).toBe(0);
  });
  it('selects exactly one highest eligible instant discount', async () => {
    const result = await recommendOffers([
      { discountType: 'instant_discount_percentage', discountValue: 10, maximumDiscount: 500, minimumPurchase: 0 },
      { discountType: 'instant_discount_flat', discountValue: 700, minimumPurchase: 0 },
      { discountType: 'instant_discount_flat', discountValue: 900, minimumPurchase: 20000 },
    ], 'amazon', 10000);
    expect(result.bestPickIndex).toBe(1);
    expect(result.offers.filter((offer) => offer.bestPick)).toHaveLength(1);
  });
  it('uses catalog benefits when a page has no offers', async () => {
    vi.spyOn(CardBenefit, 'find').mockReturnValue({ select: () => ({ lean: async () => [{ bank: 'Example', cardName: 'Example card', discountType: 'instant_discount_flat', discountValue: 100, minimumPurchase: 0 }] }) });
    const result = await recommendOffers([], 'amazon', 1000);
    expect(result.offerSource).toBe('card_benefit_catalog');
    expect(result.bestPickIndex).toBe(0);
    expect(CardBenefit.find).toHaveBeenCalledWith(expect.objectContaining({ retailer: 'amazon', active: true, expiresAt: expect.any(Object) }));
  });
  it('labels demo fallback and never supplies it in production', async () => {
    vi.spyOn(CardBenefit, 'find').mockReturnValue({ select: () => ({ lean: async () => [] }) });
    vi.stubEnv('NODE_ENV', 'test');
    const demo = await recommendOffers([], 'amazon', 10000);
    expect(demo.offerSource).toBe('demo_catalog');
    expect(demo.offers.every((offer) => offer.simulationOnly)).toBe(true);
    expect(demo.bestPickIndex).not.toBeNull();
    vi.stubEnv('NODE_ENV', 'production');
    const live = await recommendOffers([], 'amazon', 10000);
    expect(live.offers).toEqual([]);
    expect(live.bestPickIndex).toBeNull();
  });
});
