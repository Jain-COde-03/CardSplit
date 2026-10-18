import { Router } from 'express';
import {
  createSavedDeal,
  deleteSavedDeal,
  listSavedDeals,
} from '../controllers/savedDeal.controller.js';
import { authenticate, requireCsrf } from '../middleware/authenticate.js';

const router = Router();

router.get('/saved-deals', authenticate, listSavedDeals);
router.post('/saved-deals', authenticate, requireCsrf, createSavedDeal);
router.delete('/saved-deals/:savedDealId', authenticate, requireCsrf, deleteSavedDeal);

export default router;
