import { Router } from 'express';
import {
  analyzeProduct,
  getAnalysisById,
  getProductById,
  getProductOffers,
  listMyAnalyses,
} from '../controllers/product.controller.js';
import { optionalAuthenticate } from '../middleware/authenticate.js';

const router = Router();

// Product analysis endpoints
router.post('/products/analyze', optionalAuthenticate, analyzeProduct);
router.get('/products/analyses', optionalAuthenticate, listMyAnalyses);
router.get('/products/analyses/:analysisId', optionalAuthenticate, getAnalysisById);

// Product lookup endpoints
router.get('/products/:productId', getProductById);
router.get('/products/:productId/offers', getProductOffers);

export default router;
