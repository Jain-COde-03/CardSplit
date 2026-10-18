import { Router } from 'express';
import multer from 'multer';
import {
  createUserCard,
  deleteUserCard,
  getProfile,
  listUserCards,
  updateProfile,
  updateUserCard,
  uploadAvatar,
} from '../controllers/account.controller.js';
import {
  currentUser,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { authenticate, requireCsrf } from '../middleware/authenticate.js';
import {
  loginFirewall,
  passwordResetFirewall,
  passwordResetRequestFirewall,
  registrationFirewall,
  verificationFirewall,
} from '../middleware/authFirewall.js';
import { createApiError } from '../utils/apiResponse.js';

const router = Router();
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(createApiError(400, 'INVALID_AVATAR_TYPE', 'Choose a JPG, PNG, or WebP image.'));
      return;
    }
    callback(null, true);
  },
});

router.post('/auth/register', registrationFirewall, register);
router.post('/auth/verify-email', verificationFirewall, verifyEmail);
router.post('/auth/login', loginFirewall, login);
router.post('/auth/password-reset/request', passwordResetRequestFirewall, requestPasswordReset);
router.post('/auth/password-reset', passwordResetFirewall, resetPassword);
router.get('/auth/me', authenticate, currentUser);
router.post('/auth/logout', authenticate, requireCsrf, logout);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, requireCsrf, updateProfile);
router.post('/profile/avatar', authenticate, requireCsrf, avatarUpload.single('avatar'), uploadAvatar);

router.get('/users/me/cards', authenticate, listUserCards);
router.post('/users/me/cards', authenticate, requireCsrf, createUserCard);
router.patch('/users/me/cards/:cardId', authenticate, requireCsrf, updateUserCard);
router.delete('/users/me/cards/:cardId', authenticate, requireCsrf, deleteUserCard);

export default router;
