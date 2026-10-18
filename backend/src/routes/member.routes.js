import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createConnection,
  createDealRequest,
  findCardholders,
  listDealRequests,
  updateDealRequest,
  rateDealRequest,
  addDealMessage,
  listConnections,
  respondToConnection,
} from '../controllers/member.controller.js';
import { authenticate, requireCsrf } from '../middleware/authenticate.js';

const router = Router();
const memberSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/members/cardholders', authenticate, memberSearchLimiter, findCardholders);
router.get('/connections', authenticate, listConnections);
router.get('/deal-requests', authenticate, listDealRequests);
router.post('/deal-requests', authenticate, requireCsrf, createDealRequest);
router.patch('/deal-requests/:dealRequestId/:action', authenticate, requireCsrf, updateDealRequest);
router.post('/deal-requests/:dealRequestId/messages', authenticate, requireCsrf, addDealMessage);
router.post('/deal-requests/:dealRequestId/rating', authenticate, requireCsrf, rateDealRequest);
router.post('/connections', authenticate, requireCsrf, createConnection);
router.patch('/connections/:connectionId/:action', authenticate, requireCsrf, respondToConnection);

export default router;
