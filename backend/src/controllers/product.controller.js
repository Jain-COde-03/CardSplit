import Product from '../models/Product.js';
import ProductAnalysis from '../models/ProductAnalysis.js';
import { validateProductUrl } from '../validators/productUrl.validator.js';
import { detectRetailer } from '../services/retailerDetector.service.js';
import productScraperService from '../services/productScraper.service.js';
import offerScraperService from '../services/offerScraper.service.js';
import logger from '../utils/logger.js';
import { ensureShowcaseCardholder } from '../services/showcaseCardholder.service.js';
import { recommendOffers } from '../services/offerRecommendation.service.js';

export async function analyzeProduct(req, res, _next) {
  const { url, htmlFixture } = req.body;
  const requestId = req.requestId;

  let validated;
  try {
    validated = validateProductUrl(url);
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_URL',
        message: err.message,
      },
      meta: { requestId },
    });
  }

  const retailer = detectRetailer(validated.hostname);

  // 1. Initialize analysis audit record
  const analysis = await ProductAnalysis.create({
    userId: req.user?.id || null,
    submittedUrl: validated.rawUrl,
    retailer,
    status: 'processing',
    startedAt: new Date(),
  });

  try {
    // 2. Perform scraping (supports optional htmlFixture for automated testing/offline)
    const scraped = await productScraperService.scrapeProduct(
      validated.normalizedUrl,
      process.env.NODE_ENV === 'test' ? htmlFixture || null : null
    );

    // 3. Upsert product into MongoDB
    const product = await Product.findOneAndUpdate(
      {
        retailer: scraped.retailer,
        canonicalProductUrl: scraped.canonicalProductUrl,
      },
      {
        name: scraped.name,
        description: scraped.description,
        brand: scraped.brand,
        category: scraped.category,
        imageUrl: scraped.imageUrl,
        retailer: scraped.retailer,
        canonicalProductUrl: scraped.canonicalProductUrl,
        currentPrice: scraped.price,
        currency: scraped.currency,
        availability: scraped.availability,
        productIdentifiers: scraped.productIdentifiers,
        lastPriceCheckedAt: new Date(),
        priceStatus: 'current',
        sourceMetadata: {
          retrievedAt: scraped.retrievedAt,
          sourceUrl: scraped.sourceUrl,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // 4. Normalize discovered offers
    const discovered = offerScraperService.normalizeOffers(scraped.rawOffers || []);
    const recommendation = await recommendOffers(discovered, retailer, Number(product.currentPrice));
    await ensureShowcaseCardholder(recommendation, Number(product.currentPrice), req.user?._id);
    const normalizedOffers = recommendation.offers;

    // 5. Complete analysis record
    analysis.status = 'completed';
    analysis.productId = product._id;
    analysis.completedAt = new Date();
    analysis.extractedData = {
      productSummary: {
        id: product.id,
        name: product.name,
        currentPrice: product.currentPrice,
        availability: product.availability,
      },
      offersFoundCount: discovered.length,
      bestPickIndex: recommendation.bestPickIndex,
      offerSource: recommendation.offerSource,
      offers: normalizedOffers,
    };
    await analysis.save();

    logger.info(
      { analysisId: analysis.id, productId: product.id, retailer },
      'Product analysis completed successfully'
    );

    return res.status(200).json({
      success: true,
      data: {
        analysisId: analysis.id,
        status: 'completed',
        retailer,
        product,
        discoveredOffers: normalizedOffers,
        bestPickIndex: recommendation.bestPickIndex,
        offerSource: recommendation.offerSource,
        scrapedOfferCount: discovered.length,
      },
      message: 'Product analysis completed successfully',
      meta: { requestId },
    });
  } catch (error) {
    analysis.status = 'failed';
    analysis.errorCode = error.code || 'ANALYSIS_ERROR';
    analysis.errorMessage = error.message || 'Product analysis failed.';
    analysis.completedAt = new Date();
    await analysis.save();

    logger.error(
      { analysisId: analysis.id, err: error.message },
      'Product analysis job failed'
    );

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'ANALYSIS_FAILED',
        message: error.message || 'Failed to extract product information.',
      },
      meta: { requestId },
    });
  }
}

export async function getAnalysisById(req, res, next) {
  try {
    const { analysisId } = req.params;
    const analysis = await ProductAnalysis.findById(analysisId).populate('productId');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ANALYSIS_NOT_FOUND',
          message: 'Product analysis not found.',
        },
        meta: { requestId: req.requestId },
      });
    }

    if (analysis.userId && String(analysis.userId) !== String(req.user?._id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ANALYSIS_NOT_FOUND',
          message: 'Product analysis not found.',
        },
        meta: { requestId: req.requestId },
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
      message: 'Product analysis retrieved successfully',
      meta: { requestId: req.requestId },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyAnalyses(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Log in to view your product history.' },
      meta: { requestId: req.requestId },
    });
  }

  try {
    const analyses = await ProductAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('submittedUrl retailer status productId startedAt completedAt extractedData.productSummary');
    return res.status(200).json({
      success: true,
      data: { analyses },
      meta: { requestId: req.requestId },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
        },
        meta: { requestId: req.requestId },
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Product retrieved successfully',
      meta: { requestId: req.requestId },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductOffers(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
        },
        meta: { requestId: req.requestId },
      });
    }

    // Retrieve latest analysis for this product to fetch extracted offers
    const latestAnalysis = await ProductAnalysis.findOne({
      productId: product._id,
      status: 'completed',
    }).sort({ completedAt: -1 });

    const offers = latestAnalysis?.extractedData?.offers || [];

    return res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          currentPrice: product.currentPrice,
          currency: product.currency,
          retailer: product.retailer,
        },
        offers,
      },
      message: 'Product offers retrieved successfully',
      meta: { requestId: req.requestId },
    });
  } catch (error) {
    next(error);
  }
}
