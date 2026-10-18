import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import UserCard from '../models/UserCard.js';
import { createApiError, sendSuccess } from '../utils/apiResponse.js';
import { cardSchema, profileSchema } from '../validators/account.validator.js';

function validationError(res, requestId, error) {
  return res.status(400).json({
    success: false,
    error: { code: 'INVALID_REQUEST', message: error.issues.map((issue) => issue.message).join(' ') },
    meta: { requestId },
  });
}

export async function getProfile(req, res) {
  return sendSuccess(res, 200, {
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      profile: req.user.profile,
    },
  }, req.requestId);
}

export async function updateProfile(req, res, next) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, req.requestId, parsed.error);

  try {
    const { name, city, bio, dealFeePercent, responseMinutes, cardholderDiscovery } = parsed.data;
    if (name !== undefined) req.user.name = name;
    if (city !== undefined) req.user.profile.city = city;
    if (bio !== undefined) req.user.profile.bio = bio;
    if (dealFeePercent !== undefined) req.user.profile.dealFeePercent = dealFeePercent;
    if (responseMinutes !== undefined) req.user.profile.responseMinutes = responseMinutes;
    if (cardholderDiscovery !== undefined) req.user.profile.cardholderDiscovery = cardholderDiscovery;
    await req.user.save();

    return sendSuccess(res, 200, {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        profile: req.user.profile,
      },
    }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function listUserCards(req, res, next) {
  try {
    const cards = await UserCard.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, { cards }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function createUserCard(req, res, next) {
  const parsed = cardSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, req.requestId, parsed.error);

  try {
    const card = await UserCard.create({
      ...parsed.data,
      userId: req.user._id,
    });
    return sendSuccess(res, 201, { card }, req.requestId);
  } catch (error) {
    if (error.code === 11000) {
      next(createApiError(409, 'CARD_ALREADY_LISTED', 'This card product is already listed on your profile.'));
      return;
    }
    next(error);
  }
}

export async function updateUserCard(req, res, next) {
  if (Object.hasOwn(req.body, 'ownershipVerificationStatus')) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Card ownership verification status is assigned by CardBridge, not user-editable.' },
      meta: { requestId: req.requestId },
    });
  }
  const parsed = cardSchema.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
    return validationError(res, req.requestId, parsed.success ? { issues: [{ message: 'Provide card fields to update.' }] } : parsed.error);
  }
  try {
    const card = await UserCard.findOneAndUpdate(
      { _id: req.params.cardId, userId: req.user._id },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );
    if (!card) throw createApiError(404, 'CARD_NOT_FOUND', 'Card product not found.');
    return sendSuccess(res, 200, { card }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function deleteUserCard(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.cardId)) {
      throw createApiError(400, 'INVALID_CARD_ID', 'Card product ID is invalid.');
    }
    const result = await UserCard.deleteOne({ _id: req.params.cardId, userId: req.user._id });
    if (result.deletedCount === 0) throw createApiError(404, 'CARD_NOT_FOUND', 'Card product not found.');
    return sendSuccess(res, 200, { deleted: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

function uploadToCloudinary(file, userId) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'CardSplit',
        public_id: userId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 512, height: 512, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary did not return an uploaded image URL.'));
          return;
        }
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(upload);
  });
}

export async function uploadAvatar(req, res, next) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    next(createApiError(503, 'AVATAR_STORAGE_NOT_CONFIGURED', 'Profile photo uploads are not configured yet.'));
    return;
  }
  if (!req.file) {
    next(createApiError(400, 'AVATAR_REQUIRED', 'Choose a JPG, PNG, or WebP image up to 4 MB.'));
    return;
  }

  try {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const previousPublicId = req.user.profile.avatarPublicId;
    const result = await uploadToCloudinary(req.file, req.user.id);
    req.user.profile.avatarUrl = result.secure_url;
    req.user.profile.avatarPublicId = result.public_id;
    await req.user.save();

    if (previousPublicId && previousPublicId !== result.public_id) {
      await cloudinary.uploader.destroy(previousPublicId, { resource_type: 'image' });
    }

    return sendSuccess(res, 200, { avatarUrl: result.secure_url }, req.requestId);
  } catch (error) {
    next(error);
  }
}
