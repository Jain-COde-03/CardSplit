import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import UserCard from '../models/UserCard.js';
import { estimateDiscount } from './offerRecommendation.service.js';

export async function ensureShowcaseCardholder(recommendation, price, viewerId) {
  if (process.env.NODE_ENV === 'production' || !Number.isFinite(price) || price <= 0) return;
  let offer = recommendation.offers[recommendation.bestPickIndex];
  if (!offer?.bank || offer.bank === 'Other Bank' || !offer.cardName || offer.cardName === 'Card eligibility unknown'
    || offer.bank.length > 80 || offer.cardName.length > 120 || estimateDiscount(offer, price) <= 0) {
    // Preserve scraped offers and add a visibly fictional option for the demonstration.
    recommendation.offers.forEach((item) => { item.bestPick = false; });
    offer = {
      bank: 'HDFC Bank', cardName: 'Millennia Credit Card',
      title: 'Showcase offer: 5% instant discount with Millennia Credit Card',
      discountType: 'instant_discount_percentage', discountValue: 5,
      maximumDiscount: 1500, minimumPurchase: 0, simulationOnly: true,
      source: 'demo_catalog', bestPick: true,
    };
    offer.estimatedDiscount = estimateDiscount(offer, price);
    recommendation.bestPickIndex = recommendation.offers.length;
    recommendation.offers.push(offer);
    recommendation.offerSource = 'showcase_fallback';
  }

  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matching = await UserCard.aggregate([
    { $match: { visibility: 'discoverable', issuer: new RegExp(`^${escape(offer.bank)}$`, 'i'), cardProduct: new RegExp(`^${escape(offer.cardName)}$`, 'i'), $expr: { $gte: [{ $ifNull: ['$availableCredit', '$creditLimit'] }, price] } } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'member' } },
    { $unwind: '$member' },
    { $match: { 'member.accountStatus': 'active', 'member.emailVerified': true, 'member.profile.cardholderDiscovery': true, ...(viewerId ? { 'member._id': { $ne: viewerId } } : {}) } },
    { $limit: 1 },
  ]);
  if (matching.length) return;

  const identity = { email: 'cardholder@cardsplit-showcase.invalid', isShowcase: true };
  let member = await User.findOne(identity);
  if (!member) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    try {
      member = await User.findOneAndUpdate(identity, { $setOnInsert: {
        ...identity, name: 'Aarav · Showcase Cardholder', passwordHash,
        emailVerified: true, accountStatus: 'active',
        profile: { cardholderDiscovery: true, dealFeePercent: 20, city: 'Showcase demo', bio: 'Sample cardholder for the project presentation. Use Simulate reply in the deal room.', responseMinutes: 1 },
      } }, { upsert: true, new: true, runValidators: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      member = await User.findOne(identity);
      if (!member) throw error;
    }
  }
  const cardIdentity = { userId: member._id, issuer: offer.bank, cardProduct: offer.cardName };
  const update = { $set: { visibility: 'discoverable' }, $max: { creditLimit: price, availableCredit: price } };
  try {
    await UserCard.findOneAndUpdate(cardIdentity, update, { upsert: true, new: true, setDefaultsOnInsert: false });
  } catch (error) {
    if (error.code !== 11000) throw error;
    await UserCard.updateOne(cardIdentity, update);
  }
}
