import mongoose from 'mongoose';
import ProductAnalysis from '../models/ProductAnalysis.js';
import SavedDeal from '../models/SavedDeal.js';
import { createApiError, sendSuccess } from '../utils/apiResponse.js';

export async function listSavedDeals(req, res, next) {
  try {
    const savedDeals = await SavedDeal.find({ userId: req.user._id })
      .populate('productId', 'name retailer currentPrice currency imageUrl')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return sendSuccess(res, 200, { savedDeals }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function createSavedDeal(req, res, next) {
  try {
    const { analysisId, offerIndex } = req.body || {};
    if (!mongoose.isValidObjectId(analysisId) || !Number.isInteger(offerIndex) || offerIndex < 0) {
      throw createApiError(400, 'INVALID_SAVED_DEAL', 'Choose a valid offer from a completed analysis.');
    }

    const analysis = await ProductAnalysis.findOne({
      _id: analysisId,
      userId: req.user._id,
      status: 'completed',
    });
    if (!analysis) {
      throw createApiError(404, 'ANALYSIS_NOT_FOUND', 'This product analysis is not available in your account.');
    }

    const offerSnapshot = analysis.extractedData?.offers?.[offerIndex];
    if (!offerSnapshot) {
      throw createApiError(404, 'OFFER_NOT_FOUND', 'This offer was not found in the analysis.');
    }

    const savedDeal = await SavedDeal.create({
      userId: req.user._id,
      productId: analysis.productId,
      analysisId: analysis._id,
      offerSnapshot,
    });
    return sendSuccess(res, 201, { savedDeal }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function deleteSavedDeal(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.savedDealId)) {
      throw createApiError(400, 'INVALID_SAVED_DEAL_ID', 'Saved deal ID is invalid.');
    }

    const result = await SavedDeal.deleteOne({ _id: req.params.savedDealId, userId: req.user._id });
    if (result.deletedCount === 0) {
      throw createApiError(404, 'SAVED_DEAL_NOT_FOUND', 'Saved deal not found.');
    }
    return sendSuccess(res, 200, { deleted: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}
