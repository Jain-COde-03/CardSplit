import rateLimit from 'express-rate-limit';

function createAuthLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RATE_LIMITED',
          message,
        },
        meta: { requestId: req.requestId },
      });
    },
  });
}

export const loginFirewall = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many sign-in attempts from this network. Wait 15 minutes and try again.',
});

export const registrationFirewall = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many account registration requests from this network. Wait an hour and try again.',
});

export const verificationFirewall = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many email verification attempts from this network. Wait 15 minutes and try again.',
});

export const passwordResetRequestFirewall = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: 'Too many password reset requests from this network. Wait an hour and try again.',
});

export const passwordResetFirewall = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many password reset attempts from this network. Wait 15 minutes and try again.',
});
