import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(12).max(128),
});

export const cardSchema = z.object({
  issuer: z.string().trim().min(1).max(80),
  cardProduct: z.string().trim().min(1).max(120),
  cardVariant: z.string().trim().max(80).optional().default(''),
  availableCredit: z.preprocess((value) => value === '' ? null : value, z.coerce.number().min(0).max(100000000).nullable()).optional(),
  creditLimit: z.preprocess((value) => value === '' ? null : value, z.coerce.number().min(0).max(100000000).nullable()).optional(),
  milestone: z.string().trim().max(240).optional().default(''),
  benefit: z.string().trim().max(240).optional().default(''),
  visibility: z.enum(['hidden', 'discoverable']).optional().default('hidden'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  dealFeePercent: z.preprocess((value) => value === '' ? null : value, z.coerce.number().min(0).max(100).nullable()).optional(),
  responseMinutes: z.preprocess((value) => value === '' ? null : value, z.coerce.number().int().min(0).max(10080).nullable()).optional(),
  cardholderDiscovery: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field to update.');

export const cardholderQuerySchema = z.object({
  issuer: z.string().trim().max(80).optional(),
  cardProduct: z.string().trim().max(120).optional(),
  search: z.string().trim().max(100).optional(),
  feeModel: z.enum(['no_fee', 'fee_share']).optional(),
  minimumPurchase: z.coerce.number().min(0).max(100000000).optional(),
  analysisId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid product analysis.').optional(),
  offerIndex: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).refine((value) => (value.analysisId === undefined) === (value.offerIndex === undefined), {
  message: 'Provide both the product analysis and offer index to match an offer.',
  path: ['offerIndex'],
});

export const connectionSchema = z.object({
  targetUserId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid member.'),
  message: z.string().trim().max(500).optional().default(''),
});

export const dealRequestSchema = z.object({
  analysisId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid product analysis.'),
  offerIndex: z.coerce.number().int().min(0).max(100),
  cardholderId: z.string().regex(/^[a-f\d]{24}$/i),
  cardId: z.string().regex(/^[a-f\d]{24}$/i),
  deliveryAddress: z.object({ recipientName: z.string().trim().min(1).max(100), phone: z.string().trim().min(7).max(20), addressLine: z.string().trim().min(3).max(240), pincode: z.string().trim().min(4).max(10), city: z.string().trim().min(1).max(100), state: z.string().trim().min(1).max(100) }),
});

export const dealActionSchema = z.object({
  action: z.enum(['agree', 'decline', 'simulate-accept', 'simulate-decline', 'fund-escrow', 'place-order', 'verify-order', 'confirm-delivery']),
  confirmAvailableCredit: z.boolean().optional(),
  orderReference: z.string().trim().max(100).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  carrier: z.string().trim().max(100).optional(),
  estimatedDelivery: z.string().trim().max(100).optional(),
});

export const dealRatingSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().max(500).optional().default(''),
});
