import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import AuthSession from '../models/AuthSession.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { sendAccountEmail } from '../services/email.service.js';
import { hashToken, SESSION_COOKIE } from '../middleware/authenticate.js';
import { createApiError, sendSuccess } from '../utils/apiResponse.js';
import { loginSchema, registerSchema } from '../validators/account.validator.js';
import { passwordResetRequestSchema, passwordResetSchema } from '../validators/account.validator.js';

function createToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    profile: user.profile,
    createdAt: user.createdAt,
  };
}

async function createSession(user, res) {
  const sessionToken = createToken();
  const csrfToken = createToken();
  const expiresAt = new Date(Date.now() + env.AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);

  await AuthSession.create({
    userId: user._id,
    tokenHash: hashToken(sessionToken),
    csrfToken,
    expiresAt,
  });

  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return csrfToken;
}

function sendValidationError(res, requestId, error) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_REQUEST',
      message: error.issues.map((issue) => issue.message).join(' '),
    },
    meta: { requestId },
  });
}

export async function register(req, res, next) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, req.requestId, parsed.error);

  try {
    const email = parsed.data.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.');
    }

    const verificationToken = createToken();
    const user = await User.create({
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      emailVerificationTokenHash: hashToken(verificationToken),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try {
      const verificationUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${encodeURIComponent(verificationToken)}`;
      await sendAccountEmail({
        to: user.email,
        subject: 'Verify your CardBridge email',
        text: `Verify your CardBridge account within 24 hours: ${verificationUrl}`,
        html: `<p>Verify your CardBridge account within 24 hours.</p><p><a href="${verificationUrl}">Verify email address</a></p>`,
      });
    } catch (emailError) {
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
      await user.save();
      await User.deleteOne({ _id: user._id });
      throw emailError;
    }

    return sendSuccess(res, 202, { email: user.email, verificationEmailSent: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = String(req.body?.token || '');
    if (!token || token.length > 256) {
      throw createApiError(400, 'INVALID_VERIFICATION_TOKEN', 'This verification link is invalid or expired.');
    }

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: { $gt: new Date() },
    }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

    if (!user) {
      throw createApiError(400, 'INVALID_VERIFICATION_TOKEN', 'This verification link is invalid or expired.');
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    return sendSuccess(res, 200, { emailVerified: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, req.requestId, parsed.error);

  try {
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), accountStatus: 'active' })
      .select('+passwordHash');

    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      throw createApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
    }
    if (!user.emailVerified) {
      throw createApiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email address before logging in.');
    }

    const csrfToken = await createSession(user, res);
    return sendSuccess(res, 200, { user: publicUser(user), csrfToken }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function currentUser(req, res) {
  return sendSuccess(res, 200, {
    user: publicUser(req.user),
    csrfToken: req.authSession.csrfToken,
  }, req.requestId);
}

export async function logout(req, res, next) {
  try {
    await AuthSession.deleteOne({ _id: req.authSession._id });
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return sendSuccess(res, 200, { loggedOut: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(req, res, next) {
  const parsed = passwordResetRequestSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, req.requestId, parsed.error);

  try {
    const user = await User.findOne({
      email: parsed.data.email.toLowerCase(),
      accountStatus: 'active',
      emailVerified: true,
    }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');

    if (user) {
      const token = createToken();
      user.resetPasswordTokenHash = hashToken(token);
      user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendAccountEmail({
          to: user.email,
          subject: 'Reset your CardBridge password',
          text: `Reset your CardBridge password within one hour: ${resetUrl}`,
          html: `<p>Reset your CardBridge password within one hour.</p><p><a href="${resetUrl}">Reset password</a></p>`,
        });
      } catch (emailError) {
        user.resetPasswordTokenHash = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();
        throw emailError;
      }
    }

    return sendSuccess(res, 202, { message: 'If the account exists, a password reset email has been sent.' }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  const parsed = passwordResetSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, req.requestId, parsed.error);

  try {
    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(parsed.data.token),
      resetPasswordExpiresAt: { $gt: new Date() },
      accountStatus: 'active',
    }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');
    if (!user) {
      throw createApiError(400, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or expired.');
    }

    user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    await AuthSession.deleteMany({ userId: user._id });

    return sendSuccess(res, 200, { passwordReset: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}
