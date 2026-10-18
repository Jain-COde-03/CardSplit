import UserCard from '../models/UserCard.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import DealRequest from '../models/DealRequest.js';
import ProductAnalysis from '../models/ProductAnalysis.js';
import { matchListedCardProducts } from '../services/cardOfferMatcher.service.js';
import { createApiError, sendSuccess } from '../utils/apiResponse.js';
import { cardholderQuerySchema, connectionSchema, dealActionSchema, dealRatingSchema, dealRequestSchema } from '../validators/account.validator.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginationMeta(requestId, page, limit, totalItems) {
  return {
    requestId,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPrevPage: page > 1,
    },
  };
}

export async function findCardholders(req, res, next) {
  const parsed = cardholderQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_MEMBER_SEARCH', message: parsed.error.issues.map((issue) => issue.message).join(' ') },
      meta: { requestId: req.requestId },
    });
  }

  try {
    const { issuer, cardProduct, search, feeModel, minimumPurchase, analysisId, offerIndex, page, limit } = parsed.data;
    const cardQuery = { visibility: 'discoverable' };
    let eligibility = null;
    if (analysisId !== undefined) {
      const analysis = await ProductAnalysis.findOne({
        _id: analysisId,
        status: 'completed',
        $or: [{ userId: null }, { userId: req.user._id }],
      }).lean();
      if (!analysis) throw createApiError(404, 'ANALYSIS_NOT_AVAILABLE', 'This product analysis is not available to your account.');

      const offer = analysis.extractedData?.offers?.[offerIndex];
      if (!offer) throw createApiError(404, 'OFFER_NOT_FOUND', 'This offer is no longer available in the analysis.');

      const productPrice = Number(analysis.extractedData?.productSummary?.currentPrice);
      const rawMinimumPurchase = offer.minimumPurchase;
      const minimumPurchaseValue = Number(rawMinimumPurchase);
      const minimumPurchaseKnown = rawMinimumPurchase !== undefined
        && rawMinimumPurchase !== null
        && rawMinimumPurchase !== ''
        && Number.isFinite(minimumPurchaseValue)
        && minimumPurchaseValue >= 0;
      const knownIssuer = typeof offer.bank === 'string' && offer.bank.trim() !== '' && offer.bank !== 'Other Bank';
      eligibility = {
        productPrice: Number.isFinite(productPrice) && productPrice > 0 ? productPrice : null,
        minimumPurchase: minimumPurchaseKnown ? minimumPurchaseValue : null,
        issuer: knownIssuer ? offer.bank : null,
        cardProducts: [],
        requiredReportedCreditLimit: Number.isFinite(productPrice) && productPrice > 0 ? productPrice : null,
        availableCreditVerified: false,
        reason: null,
      };

      if (!knownIssuer) eligibility.reason = 'CARD_NOT_IDENTIFIED';
      else if (!Number.isFinite(productPrice) || productPrice <= 0) eligibility.reason = 'PRODUCT_PRICE_UNAVAILABLE';
      else if (!minimumPurchaseKnown) eligibility.reason = 'MINIMUM_PURCHASE_UNKNOWN';
      else if (productPrice < minimumPurchaseValue) eligibility.reason = 'MINIMUM_PURCHASE_NOT_MET';
      else {
        const issuerPattern = new RegExp(`^${escapeRegex(offer.bank.trim())}$`, 'i');
        const listedCardProducts = await UserCard.distinct('cardProduct', {
          visibility: 'discoverable',
          issuer: issuerPattern,
        });
        eligibility.cardProducts = matchListedCardProducts(offer, listedCardProducts);
        if (eligibility.cardProducts.length === 0) {
          eligibility.reason = 'CARD_NOT_IDENTIFIED';
        } else {
          cardQuery.issuer = issuerPattern;
          cardQuery.cardProduct = { $in: eligibility.cardProducts.map((name) => new RegExp(`^${escapeRegex(name)}$`, 'i')) };
          cardQuery.$expr = { $gte: [{ $ifNull: ['$availableCredit', '$creditLimit'] }, productPrice] };
          eligibility.reason = 'ELIGIBLE_CRITERIA';
        }
      }

      if (eligibility.reason !== 'ELIGIBLE_CRITERIA') {
        return sendSuccess(res, 200, { members: [], eligibility }, req.requestId);
      }
    }
    if (issuer && analysisId === undefined) cardQuery.issuer = new RegExp(`^${escapeRegex(issuer)}$`, 'i');
    if (cardProduct && analysisId === undefined) cardQuery.cardProduct = new RegExp(`^${escapeRegex(cardProduct)}$`, 'i');
    const memberMatch = {
      'member.accountStatus': 'active',
      'member.emailVerified': true,
      'member.profile.cardholderDiscovery': true,
      'member._id': { $ne: req.user._id },
    };
    if (process.env.NODE_ENV === 'production') memberMatch['member.isShowcase'] = { $ne: true };
    if (search) {
      const searchPattern = new RegExp(escapeRegex(search), 'i');
      memberMatch.$or = [
        { 'member.name': searchPattern },
        { 'member.profile.city': searchPattern },
        { 'member.profile.bio': searchPattern },
        { issuer: searchPattern },
        { cardProduct: searchPattern },
        { milestone: searchPattern },
        { benefit: searchPattern },
      ];
    }
    if (feeModel === 'no_fee') memberMatch['member.profile.dealFeePercent'] = 0;
    if (feeModel === 'fee_share') memberMatch['member.profile.dealFeePercent'] = { $gt: 0 };

    const cards = await UserCard.aggregate([
      { $match: cardQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      {
        $match: memberMatch,
      },
      {
        $project: {
          _id: 0,
          cardId: '$_id',
          memberId: '$member._id',
          name: '$member.name',
          isShowcase: '$member.isShowcase',
          city: '$member.profile.city',
          bio: '$member.profile.bio',
          avatarUrl: '$member.profile.avatarUrl',
          dealFeePercent: '$member.profile.dealFeePercent',
          responseMinutes: '$member.profile.responseMinutes',
          issuer: '$issuer',
          cardProduct: '$cardProduct',
          cardVariant: '$cardVariant',
          creditLimit: '$creditLimit',
          availableCredit: '$availableCredit',
          milestone: '$milestone',
          benefit: '$benefit',
          ownershipVerificationStatus: '$ownershipVerificationStatus',
        },
      },
      { $sort: { name: 1, cardProduct: 1 } },
      {
        $facet: {
          results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const result = cards[0] || { results: [], total: [] };
    const memberIds = result.results.map((member) => member.memberId);
    const existingConnections = memberIds.length
      ? await Connection.find({
        $or: [
          { requesterId: req.user._id, recipientId: { $in: memberIds } },
          { recipientId: req.user._id, requesterId: { $in: memberIds } },
        ],
      }).select('requesterId recipientId status').lean()
      : [];
    const connectionByMemberId = new Map(existingConnections.map((connection) => {
      const memberId = String(connection.requesterId) === String(req.user._id)
        ? String(connection.recipientId)
        : String(connection.requesterId);
      const status = connection.status === 'pending'
        && String(connection.recipientId) === String(req.user._id)
        ? 'incoming_pending'
        : connection.status;
      return [memberId, status];
    }));
    const ratingRows = memberIds.length ? await DealRequest.aggregate([
      { $match: { cardholderId: { $in: memberIds }, status: 'completed', 'rating.score': { $gte: 1 } } },
      { $sort: { 'rating.createdAt': -1 } },
      { $group: { _id: '$cardholderId', latestReview: { $first: '$rating.review' }, average: { $avg: '$rating.score' }, count: { $sum: 1 } } },
    ]) : [];
    const ratingsByMemberId = new Map(ratingRows.map((rating) => [String(rating._id), {
      ratingAverage: Math.round(rating.average * 10) / 10,
      ratingCount: rating.count,
      latestReview: rating.latestReview,
    }]));
    const members = result.results.map((member) => ({
      ...member,
      memberId: String(member.memberId),
      connectionStatus: connectionByMemberId.get(String(member.memberId)) || null,
      ...(ratingsByMemberId.get(String(member.memberId)) || { ratingAverage: null, ratingCount: 0 }),
      offerMinimumPurchase: eligibility?.minimumPurchase ?? minimumPurchase ?? null,
      matchType: eligibility ? 'offer_eligible_card' : cardProduct ? 'card_product' : 'issuer',
    }));
    const totalItems = result.total[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: { members, eligibility },
      meta: paginationMeta(req.requestId, page, limit, totalItems),
    });
  } catch (error) {
    next(error);
  }
}

export async function createConnection(req, res, next) {
  const parsed = connectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CONNECTION_REQUEST', message: parsed.error.issues.map((issue) => issue.message).join(' ') },
      meta: { requestId: req.requestId },
    });
  }

  try {
    if (String(req.user._id) === parsed.data.targetUserId) {
      throw createApiError(400, 'SELF_CONNECTION_NOT_ALLOWED', 'You cannot send a connection request to your own profile.');
    }
    const recipient = await User.findOne({
      _id: parsed.data.targetUserId,
      emailVerified: true,
      accountStatus: 'active',
      'profile.cardholderDiscovery': true,
    });
    if (!recipient) throw createApiError(404, 'MEMBER_NOT_FOUND', 'This member is no longer available.');
    const discoverableCard = await UserCard.exists({ userId: recipient._id, visibility: 'discoverable' });
    if (!discoverableCard) throw createApiError(404, 'MEMBER_NOT_FOUND', 'This member is no longer available.');

    const existing = await Connection.findOne({
      $or: [
        { requesterId: req.user._id, recipientId: recipient._id },
        { requesterId: recipient._id, recipientId: req.user._id },
      ],
    });
    if (existing) {
      throw createApiError(409, 'CONNECTION_ALREADY_EXISTS', 'A connection request or connection already exists.');
    }

    const connection = await Connection.create({
      requesterId: req.user._id,
      recipientId: recipient._id,
      message: parsed.data.message,
      status: 'pending',
    });
    return sendSuccess(res, 201, { connection }, req.requestId);
  } catch (error) {
    if (error.code === 11000) {
      next(createApiError(409, 'CONNECTION_ALREADY_EXISTS', 'A connection request or connection already exists.'));
      return;
    }
    next(error);
  }
}

export async function createDealRequest(req, res, next) {
  const parsed = dealRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_DEAL_REQUEST', message: parsed.error.issues.map((issue) => issue.message).join(' ') }, meta: { requestId: req.requestId } });
  }

  try {
    const input = parsed.data;
    if (String(req.user._id) === input.cardholderId) throw createApiError(400, 'SELF_DEAL_NOT_ALLOWED', 'You cannot request a deal from your own profile.');
    
    const analysis = await ProductAnalysis.findOne({
      _id: input.analysisId, status: 'completed',
      $or: [{ userId: null }, { userId: req.user._id }],
    }).lean();
    if (!analysis) throw createApiError(404, 'ANALYSIS_NOT_AVAILABLE', 'Analyze your product before requesting a card deal.');
    const cardholder = await User.findOne({ _id: input.cardholderId, emailVerified: true, accountStatus: 'active', 'profile.cardholderDiscovery': true }).select('_id name profile isShowcase');
    if (!cardholder || (process.env.NODE_ENV === 'production' && cardholder.isShowcase)) throw createApiError(404, 'CARDHOLDER_NOT_FOUND', 'This cardholder is no longer available.');
    const card = await UserCard.findOne({ _id: input.cardId, userId: cardholder._id, visibility: 'discoverable' }).lean();
    if (!card) throw createApiError(404, 'CARD_NOT_AVAILABLE', 'This card is no longer listed for discovery.');
    const offer = analysis.extractedData?.offers?.[input.offerIndex];
    if (!offer) throw createApiError(404, 'OFFER_NOT_FOUND', 'This offer is no longer available in the analysis.');
    if (!['instant_discount_flat', 'instant_discount_percentage'].includes(offer.discountType)
      || !Number.isFinite(Number(offer.discountValue))
      || Number(offer.discountValue) <= 0) {
      throw createApiError(409, 'INSTANT_DISCOUNT_REQUIRED', 'Card-deal estimates are available only for offers with a known instant discount. Cashback and unclear offers cannot be estimated.');
    }

    const productSummary = analysis.extractedData?.productSummary;
    const price = Number(productSummary?.currentPrice);
    if (!productSummary?.name || !Number.isFinite(price) || price <= 0) {
      throw createApiError(409, 'PRODUCT_PRICE_UNAVAILABLE', 'The analysis does not have a current product price for this estimate.');
    }
    const rawMinimumPurchase = offer.minimumPurchase;
    const minimumPurchase = Number(rawMinimumPurchase);
    if (rawMinimumPurchase === undefined || rawMinimumPurchase === null || rawMinimumPurchase === ''
      || !Number.isFinite(minimumPurchase) || minimumPurchase < 0) {
      throw createApiError(409, 'MINIMUM_PURCHASE_UNKNOWN', 'The offer minimum purchase is unknown, so this deal cannot be estimated safely.');
    }
    if (price < minimumPurchase) {
      throw createApiError(409, 'MINIMUM_PURCHASE_NOT_MET', 'This product price does not meet the offer minimum purchase.');
    }

    if (input.cardId && (!Number.isFinite(Number(card.availableCredit ?? card.creditLimit)) || Number(card.availableCredit ?? card.creditLimit) < price)) {
      throw createApiError(409, 'REPORTED_CREDIT_LIMIT_TOO_LOW', 'The member-reported spending capacity does not cover this product price.');
    }
    if (input.analysisId && (!offer.bank || offer.bank === 'Other Bank' || card.issuer.toLowerCase() !== offer.bank.toLowerCase()
      || matchListedCardProducts(offer, [card.cardProduct]).length === 0)) {
      throw createApiError(400, 'CARD_OFFER_MISMATCH', 'The selected card does not match the issuer or card product in this offer.');
    }

    let discount = 0;
    if (offer.discountType === 'instant_discount_flat') discount = offer.discountValue;
    if (offer.discountType === 'instant_discount_percentage') discount = price * offer.discountValue / 100;
    if (offer.maximumDiscount != null) discount = Math.min(discount, offer.maximumDiscount);
    discount = Math.min(Math.round(discount * 100) / 100, price);
    const commissionPercent = cardholder.profile?.dealFeePercent != null && Number.isFinite(Number(cardholder.profile.dealFeePercent))
      ? Number(cardholder.profile.dealFeePercent)
      : 10;
    const platformCommissionPercent = 10;
    const commissionAmount = Math.round(discount * commissionPercent) / 100;
    const platformCommissionAmount = Math.round(discount * platformCommissionPercent) / 100;
    const cardholderPayout = Math.round((price - discount + commissionAmount) * 100) / 100;
    const calculation = {
      listedPrice: price,
      eligibleDiscount: discount,
      commissionPercent,
      commissionAmount,
      platformCommissionPercent,
      platformCommissionAmount,
      cardholderPayout,
      netPayable: Math.round((cardholderPayout + platformCommissionAmount) * 100) / 100,
      estimatedSavings: Math.round((discount - commissionAmount - platformCommissionAmount) * 100) / 100,
    };
    const dealRequest = await DealRequest.create({
      buyerId: req.user._id,
      cardholderId: cardholder._id,
      cardId: card._id,
      analysisId: analysis._id,
      offerIndex: input.offerIndex,
      product: {
        name: productSummary.name,
        retailer: analysis.retailer,
        url: analysis.submittedUrl,
        price,
      },
      offer: { ...offer, cardName: card.cardProduct, bank: card.issuer },
      calculation,
      deliveryAddress: input.deliveryAddress,
      escrow: { mode: 'demo' },
      events: [{ type: 'requested', actorId: req.user._id, note: 'Request sent. Awaiting cardholder acceptance before escrow funding.' }],
      messages: [{ senderId: req.user._id, senderName: 'System', body: `Request sent for ${productSummary.name}. Waiting for the cardholder to confirm available credit. Escrow amount after acceptance: ₹${calculation.netPayable.toLocaleString('en-IN')}.`, createdAt: new Date() }],
    });
    return sendSuccess(res, 201, { dealRequest }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function listDealRequests(req, res, next) {
  try {
    const requests = await DealRequest.find({ $or: [{ buyerId: req.user._id }, { cardholderId: req.user._id }] })
      .sort({ createdAt: -1 }).limit(50)
      .populate('buyerId', 'name profile.avatarUrl').populate('cardholderId', 'name profile.avatarUrl').lean();
    return sendSuccess(res, 200, { dealRequests: requests }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function updateDealRequest(req, res, next) {
  const parsed = dealActionSchema.safeParse({
    action: req.params.action,
    confirmAvailableCredit: req.body?.confirmAvailableCredit,
    orderReference: req.body?.orderReference,
    trackingNumber: req.body?.trackingNumber,
    carrier: req.body?.carrier,
    estimatedDelivery: req.body?.estimatedDelivery,
  });
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_DEAL_ACTION', message: 'That deal action is not available.' }, meta: { requestId: req.requestId } });
  try {
    const deal = await DealRequest.findOne({ _id: req.params.dealRequestId, $or: [{ buyerId: req.user._id }, { cardholderId: req.user._id }] })
      .populate('buyerId', 'name').populate('cardholderId', 'name');
    if (!deal) throw createApiError(404, 'DEAL_REQUEST_NOT_FOUND', 'This deal room is not available to your account.');
    const isBuyer = String(deal.buyerId?._id || deal.buyerId) === String(req.user._id);
    const requestedAction = parsed.data.action;
    const simulatedReply = requestedAction === 'simulate-accept' || requestedAction === 'simulate-decline';
    if (simulatedReply && process.env.NODE_ENV === 'production') throw createApiError(403, 'SIMULATION_DISABLED', 'Reply simulation is available only in the local project demo.');
    const action = requestedAction === 'simulate-accept' ? 'agree' : requestedAction === 'simulate-decline' ? 'decline' : requestedAction;
    if (action === 'agree' && !simulatedReply && parsed.data.confirmAvailableCredit !== true) {
      throw createApiError(400, 'AVAILABLE_CREDIT_CONFIRMATION_REQUIRED', 'Confirm that you currently have enough available credit to place this order.');
    }
    const isDevOrTest = process.env.NODE_ENV !== 'production';
    const transitions = {
      agree: { allowed: (!isBuyer || simulatedReply) && deal.status === 'requested', status: 'agreed', note: simulatedReply ? 'Demo: simulated cardholder reply accepted the request.' : 'Cardholder confirmed sufficient available credit and agreed to the deal.' },
      decline: { allowed: (!isBuyer || simulatedReply) && deal.status === 'requested', status: 'declined', note: simulatedReply ? 'Demo: simulated cardholder reply declined the request.' : 'Cardholder declined the deal.' },
      'fund-escrow': { allowed: isBuyer && deal.status === 'agreed', status: 'escrow_funded', note: 'Simulation only: escrow step completed; no money was collected or held.' },
      'place-order': { allowed: (!isBuyer || isDevOrTest) && deal.status === 'escrow_funded', status: 'order_placed', note: 'Simulation only: cardholder order placement recorded; retailer checkout was not completed.' },
      'verify-order': { allowed: isDevOrTest && deal.status === 'order_placed' && !deal.order.verified, status: 'order_placed', note: 'Simulation: order verification passed.' },
      'confirm-delivery': { allowed: isBuyer && deal.status === 'order_placed' && deal.order.verified, status: 'completed', note: 'Simulation only: delivery confirmed and escrow release recorded; no funds were transferred.' },
    };
    const transition = transitions[action];
    if (!transition?.allowed) throw createApiError(409, 'DEAL_ACTION_NOT_AVAILABLE', 'This action is not available for your role or the current deal stage.');
    if (!isDevOrTest && ['fund-escrow', 'place-order', 'confirm-delivery'].includes(action)) {
      throw createApiError(409, 'SIMULATION_ONLY', 'Payment and retailer integrations are not connected. Use the local simulation to preview this step.');
    }
    deal.status = transition.status;
    if (action === 'decline' && deal.escrow.fundedAt) {
      deal.escrow.refundedAmount = deal.escrow.amount;
      deal.escrow.refundedAt = new Date();
    }
    if (action === 'verify-order') {
      deal.order.verified = true;
      deal.order.verifiedAt = new Date();
    }
    deal.messages = deal.messages || [];

    if (action === 'fund-escrow' && process.env.NODE_ENV !== 'production') {
      deal.escrow.amount = deal.calculation.netPayable;
      deal.escrow.fundedAt = new Date();
      deal.messages.push({
        senderId: req.user._id,
        senderName: 'System',
        body: `Simulation: escrow funding of ₹${deal.calculation.netPayable.toLocaleString('en-IN')} recorded. Cardholder: please order the product to the buyer’s delivery address. No money was collected.`,
        createdAt: new Date(),
      });
    }
    if (action === 'place-order') {
      const retailerPrefix = deal.product?.retailer === 'flipkart' ? 'FK' : deal.product?.retailer === 'meesho' ? 'MSH' : 'AMZ';
      const autoRef = `DEMO-${retailerPrefix}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000000 + Math.random() * 9000000)}`;
      if (process.env.NODE_ENV !== 'production') {
        deal.order.reference = parsed.data.orderReference || autoRef;
        deal.order.trackingNumber = parsed.data.trackingNumber || `TRK${Date.now().toString().slice(-8)}IN`;
        deal.order.carrier = parsed.data.carrier || 'Amazon Logistics Express';
        deal.order.estimatedDelivery = parsed.data.estimatedDelivery || 'In 2-4 business days';
        deal.order.placedAt = new Date();
        deal.order.verified = false;
        deal.messages.push({
          senderId: deal.cardholderId?._id || deal.cardholderId,
          senderName: 'System',
          body: `Simulated order placed; awaiting demo verification. Order ID: ${deal.order.reference}. Carrier: ${deal.order.carrier} (Tracking: ${deal.order.trackingNumber}). No retailer order was submitted.`,
          createdAt: new Date(),
        });
      }
    }
    if (action === 'confirm-delivery' && process.env.NODE_ENV !== 'production') {
      deal.escrow.releasedAmount = deal.calculation.cardholderPayout;
      deal.escrow.platformAmount = deal.calculation.platformCommissionAmount;
      deal.escrow.releasedAt = new Date();
      deal.messages.push({
        senderId: req.user._id,
        senderName: 'System',
        body: `Simulation: delivery confirmed. Escrow payout of ₹${deal.calculation.cardholderPayout.toLocaleString('en-IN')} recorded for cardholder; no money moved. Buyer savings ₹${deal.calculation.estimatedSavings.toLocaleString('en-IN')}!`,
        createdAt: new Date(),
      });
    }
    deal.events.push({ type: transition.status, actorId: req.user._id, note: transition.note });
    await deal.save();
    return sendSuccess(res, 200, { dealRequest: deal }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function addDealMessage(req, res, next) {
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!body) {
    return res.status(400).json({ success: false, error: { code: 'EMPTY_MESSAGE', message: 'Message body cannot be empty.' }, meta: { requestId: req.requestId } });
  }
  try {
    const deal = await DealRequest.findOne({
      _id: req.params.dealRequestId,
      $or: [{ buyerId: req.user._id }, { cardholderId: req.user._id }],
    }).populate('buyerId', 'name').populate('cardholderId', 'name');
    if (!deal) throw createApiError(404, 'DEAL_NOT_FOUND', 'Deal room not found.');

    const isBuyer = String(deal.buyerId?._id || deal.buyerId) === String(req.user._id);
    const senderName = req.user.name || (isBuyer ? 'Buyer' : 'Cardholder');

    deal.messages = deal.messages || [];
    deal.messages.push({
      senderId: req.user._id,
      senderName,
      body,
      createdAt: new Date(),
    });

    if (isBuyer && process.env.NODE_ENV !== 'production' && deal.status !== 'declined') {
      const cardholderName = deal.cardholderId?.name || 'Cardholder';
      let autoReply = '';
      if (body.toLowerCase().includes('order') || body.toLowerCase().includes('status') || body.toLowerCase().includes('tracking')) {
        autoReply = `Hi ${deal.deliveryAddress.recipientName}! I'm tracking this closely. Everything is on schedule for delivery to ${deal.deliveryAddress.city}.`;
      } else if (body.toLowerCase().includes('hello') || body.toLowerCase().includes('hi') || body.toLowerCase().includes('hey')) {
        autoReply = `Hello! Thanks for reaching out. I'm ready to help you save with my ${deal.offer.bank} card.`;
      } else {
        autoReply = `Got your message! I'm on it and will keep you posted right here in the deal room.`;
      }
      deal.messages.push({
        senderId: deal.cardholderId?._id || deal.cardholderId,
        senderName: cardholderName,
        body: autoReply,
        createdAt: new Date(Date.now() + 500),
      });
    }

    await deal.save();
    return sendSuccess(res, 200, { dealRequest: deal }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function rateDealRequest(req, res, next) {
  const parsed = dealRatingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_DEAL_RATING', message: 'Choose a rating from 1 to 5 and an optional review.' }, meta: { requestId: req.requestId } });
  try {
    const deal = await DealRequest.findOne({ _id: req.params.dealRequestId, buyerId: req.user._id });
    if (!deal) throw createApiError(404, 'DEAL_REQUEST_NOT_FOUND', 'This deal is not available to your account.');
    if (deal.status !== 'completed') throw createApiError(409, 'DEAL_NOT_COMPLETED', 'You can rate the cardholder after delivery is confirmed.');
    if (deal.rating?.score) throw createApiError(409, 'DEAL_ALREADY_RATED', 'You have already rated this deal.');
    deal.rating = { ...parsed.data, createdAt: new Date() };
    deal.events.push({ type: 'rated', actorId: req.user._id, note: `Buyer rated the cardholder ${parsed.data.score} out of 5.` });
    await deal.save();
    return sendSuccess(res, 200, { dealRequest: deal }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function listConnections(req, res, next) {
  try {
    const [sent, received] = await Promise.all([
      Connection.find({ requesterId: req.user._id })
        .populate('recipientId', 'name profile.avatarUrl profile.city')
        .sort({ createdAt: -1 })
        .lean(),
      Connection.find({ recipientId: req.user._id })
        .populate('requesterId', 'name profile.avatarUrl profile.city')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return sendSuccess(res, 200, { sent, received }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function respondToConnection(req, res, next) {
  const { action } = req.params;
  if (!['accept', 'decline'].includes(action)) {
    next(createApiError(400, 'INVALID_CONNECTION_ACTION', 'Choose accept or decline.'));
    return;
  }

  try {
    const connection = await Connection.findOneAndUpdate(
      { _id: req.params.connectionId, recipientId: req.user._id, status: 'pending' },
      { $set: { status: action === 'accept' ? 'accepted' : 'declined' } },
      { new: true, runValidators: true }
    );
    if (!connection) {
      throw createApiError(404, 'CONNECTION_REQUEST_NOT_FOUND', 'Pending connection request not found.');
    }
    return sendSuccess(res, 200, { connection }, req.requestId);
  } catch (error) {
    next(error);
  }
}
