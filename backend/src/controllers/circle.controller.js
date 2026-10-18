import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import Circle from '../models/Circle.js';
import CircleLedger from '../models/CircleLedger.js';
import CircleRequest from '../models/CircleRequest.js';
import User from '../models/User.js';
import UserCard from '../models/UserCard.js';
import { createApiError, sendSuccess } from '../utils/apiResponse.js';

const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(['Family', 'Hostel Gang', 'Office', 'Flatmates', 'Club', 'General']).default('General'),
  description: z.string().trim().max(500).optional().default(''),
});

const createRequestSchema = z.object({
  productTitle: z.string().trim().min(2).max(200),
  merchant: z.string().trim().min(2).max(80).default('Amazon.in'),
  requiredBank: z.string().trim().min(2).max(80),
  orderAmount: z.number().min(100),
  instantDiscount: z.number().min(0),
  trustTier: z.enum(['friend', 'friend_of_friend', 'stranger']).optional().default('friend'),
});

const vouchSchema = z.object({
  targetUserId: z.string().regex(/^[a-f\d]{24}$/i),
  comment: z.string().trim().max(200).optional().default(''),
});

function generateInviteCode(circleType) {
  const prefix = circleType ? circleType.slice(0, 3).toUpperCase() : 'CRC';
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

// 1. List user's circles + public discoverable circles
export async function listCircles(req, res, next) {
  try {
    const circles = await Circle.find({
      $or: [{ memberIds: req.user._id }, { visibility: 'public' }],
    })
      .populate('createdBy', 'name profile.avatarUrl')
      .populate('memberIds', 'name profile.avatarUrl profile.city')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = circles.map((circle) => {
      const isMember = circle.memberIds.some((m) => String(m._id || m) === String(req.user._id));
      return {
        ...circle,
        isMember,
        memberCount: circle.memberIds.length,
        vouchCount: circle.vouches ? circle.vouches.length : 0,
      };
    });

    return sendSuccess(res, 200, { circles: formatted }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 2. Create a new private circle
export async function createCircle(req, res, next) {
  const parsed = createCircleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: parsed.error.issues.map((i) => i.message).join(' ') },
      meta: { requestId: req.requestId },
    });
  }

  try {
    const inviteCode = generateInviteCode(parsed.data.type);
    const circle = await Circle.create({
      ...parsed.data,
      inviteCode,
      visibility: 'private',
      createdBy: req.user._id,
      memberIds: [req.user._id],
      totalSaved: 0,
      vouches: [],
    });

    await circle.populate('createdBy', 'name profile.avatarUrl');
    return sendSuccess(res, 201, { circle }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 3. Join a circle via invite code or QR code
export async function joinCircleByCode(req, res, next) {
  const { inviteCode } = req.params;
  if (!inviteCode) {
    return next(createApiError(400, 'MISSING_INVITE_CODE', 'Invite code is required.'));
  }

  try {
    const circle = await Circle.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!circle) {
      throw createApiError(404, 'CIRCLE_NOT_FOUND', 'Invalid or expired circle invite code.');
    }

    if (!circle.memberIds.some((id) => String(id) === String(req.user._id))) {
      circle.memberIds.push(req.user._id);
      await circle.save();
    }

    await circle.populate('memberIds', 'name profile.avatarUrl profile.city');
    return sendSuccess(res, 200, { circle, joined: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 4. List Request Board for a circle
export async function listCircleRequests(req, res, next) {
  const { circleId } = req.params;
  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) {
      throw createApiError(403, 'CIRCLE_ACCESS_DENIED', 'You must be a member of this circle to view requests.');
    }

    const requests = await CircleRequest.find({ circleId })
      .populate('shopperId', 'name profile.avatarUrl')
      .populate('acceptedByUserId', 'name profile.avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return sendSuccess(res, 200, { requests }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 5. Post a new request to the Request Board
export async function createCircleRequest(req, res, next) {
  const { circleId } = req.params;
  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: parsed.error.issues.map((i) => i.message).join(' ') },
      meta: { requestId: req.requestId },
    });
  }

  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) {
      throw createApiError(403, 'CIRCLE_ACCESS_DENIED', 'You must be a member to post a request.');
    }

    const netPayable = parsed.data.orderAmount - parsed.data.instantDiscount;

    const request = await CircleRequest.create({
      circleId,
      shopperId: req.user._id,
      shopperName: req.user.name,
      shopperAvatar: req.user.profile?.avatarUrl || '',
      productTitle: parsed.data.productTitle,
      merchant: parsed.data.merchant,
      requiredBank: parsed.data.requiredBank,
      orderAmount: parsed.data.orderAmount,
      instantDiscount: parsed.data.instantDiscount,
      netPayable,
      status: 'open',
      trustTier: parsed.data.trustTier || 'friend',
    });

    return sendSuccess(res, 201, { request }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 6. Accept a request: "I can do this"
export async function acceptCircleRequest(req, res, next) {
  const { circleId, requestId } = req.params;
  const { cardId } = req.body;

  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) throw createApiError(403, 'ACCESS_DENIED', 'Circle access denied.');

    const request = await CircleRequest.findOne({ _id: requestId, circleId, status: 'open' });
    if (!request) throw createApiError(404, 'REQUEST_NOT_FOUND', 'Request is no longer open.');

    if (String(request.shopperId) === String(req.user._id)) {
      throw createApiError(400, 'SELF_ACCEPT_NOT_ALLOWED', 'You cannot accept your own purchase request.');
    }

    let cardName = 'Eligible Card';
    if (cardId && mongoose.isValidObjectId(cardId)) {
      const userCard = await UserCard.findOne({ _id: cardId, userId: req.user._id });
      if (userCard) cardName = `${userCard.issuer} ${userCard.cardProduct}`;
    }

    request.status = 'accepted';
    request.acceptedByUserId = req.user._id;
    request.acceptedByName = req.user.name;
    request.acceptedByCard = cardName;
    await request.save();

    // Automatically create a ledger pending record for Splitwise tracking
    await CircleLedger.create({
      circleId,
      fromUserId: request.shopperId,
      fromUserName: request.shopperName,
      toUserId: req.user._id,
      toUserName: req.user.name,
      amount: request.netPayable,
      discountSaved: request.instantDiscount,
      description: `${request.productTitle} (${cardName})`,
      status: 'pending',
    });

    // Update circle total saved
    circle.totalSaved = (circle.totalSaved || 0) + request.instantDiscount;
    await circle.save();

    return sendSuccess(res, 200, { request, message: 'Deal accepted successfully!' }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 7. Get Shared Ledger for a circle (Splitwise-style)
export async function listCircleLedger(req, res, next) {
  const { circleId } = req.params;
  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) throw createApiError(403, 'ACCESS_DENIED', 'Circle access denied.');

    const entries = await CircleLedger.find({ circleId })
      .populate('fromUserId', 'name profile.avatarUrl')
      .populate('toUserId', 'name profile.avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate balances
    let totalOwedToUser = 0;
    let totalUserOwes = 0;
    let totalDiscountShared = 0;

    entries.forEach((e) => {
      totalDiscountShared += e.discountSaved || 0;
      if (e.status === 'pending') {
        if (String(e.toUserId?._id || e.toUserId) === String(req.user._id)) {
          totalOwedToUser += e.amount;
        } else if (String(e.fromUserId?._id || e.fromUserId) === String(req.user._id)) {
          totalUserOwes += e.amount;
        }
      }
    });

    return sendSuccess(
      res,
      200,
      {
        entries,
        summary: {
          totalOwedToUser,
          totalUserOwes,
          netBalance: totalOwedToUser - totalUserOwes,
          totalDiscountShared,
        },
      },
      req.requestId
    );
  } catch (error) {
    next(error);
  }
}

// 8. One-tap Settle Ledger Entry
export async function settleLedgerEntry(req, res, next) {
  const { circleId, entryId } = req.params;
  const { upiRef } = req.body;

  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) throw createApiError(403, 'ACCESS_DENIED', 'Circle access denied.');

    const entry = await CircleLedger.findOne({ _id: entryId, circleId });
    if (!entry) throw createApiError(404, 'ENTRY_NOT_FOUND', 'Ledger entry not found.');

    entry.status = 'settled';
    entry.settledAt = new Date();
    entry.upiRef = upiRef || `UPI-${Date.now().toString().slice(-6)}`;
    await entry.save();

    return sendSuccess(res, 200, { entry, settled: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 9. Vouch for a member in a circle
export async function vouchMember(req, res, next) {
  const { circleId } = req.params;
  const parsed = vouchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: parsed.error.issues.map((i) => i.message).join(' ') },
      meta: { requestId: req.requestId },
    });
  }

  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) throw createApiError(403, 'ACCESS_DENIED', 'Circle access denied.');

    if (String(req.user._id) === parsed.data.targetUserId) {
      throw createApiError(400, 'SELF_VOUCH_NOT_ALLOWED', 'You cannot vouch for yourself.');
    }

    const alreadyVouched = circle.vouches.some(
      (v) => String(v.vouchedByUserId) === String(req.user._id) && String(v.vouchedUserId) === parsed.data.targetUserId
    );

    if (alreadyVouched) {
      throw createApiError(400, 'ALREADY_VOUCHED', 'You have already vouched for this member.');
    }

    circle.vouches.push({
      vouchedUserId: parsed.data.targetUserId,
      vouchedByUserId: req.user._id,
      comment: parsed.data.comment,
      createdAt: new Date(),
    });

    await circle.save();
    return sendSuccess(res, 200, { success: true, message: 'Member vouched successfully.' }, req.requestId);
  } catch (error) {
    next(error);
  }
}

// 10. List circle cardholders (only inside joined circles)
export async function getCircleCards(req, res, next) {
  const { circleId } = req.params;
  try {
    const circle = await Circle.findOne({ _id: circleId, memberIds: req.user._id });
    if (!circle) throw createApiError(403, 'ACCESS_DENIED', 'Circle access denied.');

    // Find cards of members in this circle
    const cards = await UserCard.find({
      userId: { $in: circle.memberIds },
      $or: [
        { visibility: 'discoverable' },
        { visibility: 'circles_only', allowedCircleIds: circleId },
      ],
    })
      .populate('userId', 'name profile.avatarUrl profile.city')
      .lean();

    return sendSuccess(res, 200, { cards }, req.requestId);
  } catch (error) {
    next(error);
  }
}

