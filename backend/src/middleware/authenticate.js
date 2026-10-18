import crypto from 'node:crypto';
import AuthSession from '../models/AuthSession.js';
import User from '../models/User.js';
import { createApiError } from '../utils/apiResponse.js';

const SESSION_COOKIE = 'cardbridge_session';

export function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) {
      throw createApiError(401, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.');
    }

    const session = await AuthSession.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    }).select('+tokenHash +csrfToken');

    if (!session) {
      throw createApiError(401, 'INVALID_SESSION', 'Your session has expired. Please log in again.');
    }

    const user = await User.findOne({ _id: session.userId, accountStatus: 'active' });
    if (!user || !user.emailVerified) {
      throw createApiError(401, 'INVALID_SESSION', 'Your account is not available for this session.');
    }

    req.user = user;
    req.authSession = session;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) {
      next();
      return;
    }

    const session = await AuthSession.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (session) {
      const user = await User.findOne({
        _id: session.userId,
        accountStatus: 'active',
        emailVerified: true,
      });
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireCsrf(req, _res, next) {
  const supplied = req.get('x-csrf-token');
  const expected = req.authSession?.csrfToken;

  const suppliedBuffer = Buffer.from(supplied || '');
  const expectedBuffer = Buffer.from(expected || '');
  if (
    suppliedBuffer.length !== expectedBuffer.length
    || suppliedBuffer.length === 0
    || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    next(createApiError(403, 'CSRF_TOKEN_INVALID', 'Refresh the page and try that action again.'));
    return;
  }

  next();
}

export { SESSION_COOKIE };
