import { Router } from 'express';
import {
  createGroup,
  createMessage,
  createPost,
  deletePost,
  joinGroup,
  listConversations,
  listGroups,
  listMessages,
  listPosts,
  startConversation,
} from '../controllers/social.controller.js';
import { authenticate, requireCsrf } from '../middleware/authenticate.js';

const router = Router();

router.get('/posts', authenticate, listPosts);
router.post('/posts', authenticate, requireCsrf, createPost);
router.delete('/posts/:postId', authenticate, requireCsrf, deletePost);
router.get('/groups', authenticate, listGroups);
router.post('/groups', authenticate, requireCsrf, createGroup);
router.post('/groups/:groupId/join', authenticate, requireCsrf, joinGroup);
router.get('/conversations', authenticate, listConversations);
router.post('/conversations', authenticate, requireCsrf, startConversation);
router.get('/conversations/:conversationId/messages', authenticate, listMessages);
router.post('/conversations/:conversationId/messages', authenticate, requireCsrf, createMessage);

export default router;
