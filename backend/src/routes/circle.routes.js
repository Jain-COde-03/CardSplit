import { Router } from 'express';
import {
  acceptCircleRequest,
  createCircle,
  createCircleRequest,
  getCircleCards,
  joinCircleByCode,
  listCircleLedger,
  listCircleRequests,
  listCircles,
  settleLedgerEntry,
  vouchMember,
} from '../controllers/circle.controller.js';
import { authenticate, requireCsrf } from '../middleware/authenticate.js';

const router = Router();

// Circles management
router.get('/', authenticate, listCircles);
router.post('/', authenticate, requireCsrf, createCircle);
router.post('/join/:inviteCode', authenticate, requireCsrf, joinCircleByCode);

// Circle Request Board
router.get('/:circleId/requests', authenticate, listCircleRequests);
router.post('/:circleId/requests', authenticate, requireCsrf, createCircleRequest);
router.post('/:circleId/requests/:requestId/accept', authenticate, requireCsrf, acceptCircleRequest);

// Circle Shared Ledger
router.get('/:circleId/ledger', authenticate, listCircleLedger);
router.post('/:circleId/ledger/:entryId/settle', authenticate, requireCsrf, settleLedgerEntry);

// Trust & Vouching
router.post('/:circleId/vouch', authenticate, requireCsrf, vouchMember);

// Circle Cardholders
router.get('/:circleId/cards', authenticate, getCircleCards);

export default router;

