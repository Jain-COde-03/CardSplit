import mongoose from 'mongoose';
import { z } from 'zod';
import Connection from '../models/Connection.js';
import Conversation from '../models/Conversation.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import { createApiError, sendSuccess } from '../utils/apiResponse.js';

const postSchema = z.object({
  body: z.string().trim().min(1).max(3000),
  groupId: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
});
const groupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().default(''),
  visibility: z.enum(['public', 'private']).optional().default('public'),
});
const conversationSchema = z.object({
  recipientId: z.string().regex(/^[a-f\d]{24}$/i),
});
const messageSchema = z.object({
  body: z.string().trim().min(1).max(3000),
});

function invalidRequest(res, requestId, error) {
  return res.status(400).json({
    success: false,
    error: { code: 'INVALID_REQUEST', message: error.issues.map((issue) => issue.message).join(' ') },
    meta: { requestId },
  });
}

async function getConversationForMember(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw createApiError(400, 'INVALID_CONVERSATION_ID', 'Conversation ID is invalid.');
  }
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participantIds: userId,
  });
  if (!conversation) throw createApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  return conversation;
}

export async function listPosts(req, res, next) {
  try {
    const visibleGroups = await Group.find({
      $or: [{ visibility: 'public' }, { memberIds: req.user._id }],
    }).distinct('_id');
    const posts = await Post.find({
      status: 'published',
      $or: [{ groupId: null }, { groupId: { $in: visibleGroups } }],
    })
      .populate('authorId', 'name profile.avatarUrl profile.city')
      .populate('groupId', 'name visibility')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return sendSuccess(res, 200, { posts }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function createPost(req, res, next) {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return invalidRequest(res, req.requestId, parsed.error);

  try {
    if (parsed.data.groupId) {
      const group = await Group.findOne({ _id: parsed.data.groupId, memberIds: req.user._id });
      if (!group) throw createApiError(404, 'GROUP_NOT_FOUND', 'Join an available group before posting there.');
    }
    const post = await Post.create({
      authorId: req.user._id,
      groupId: parsed.data.groupId || null,
      body: parsed.data.body,
    });
    await post.populate('authorId', 'name profile.avatarUrl profile.city');
    return sendSuccess(res, 201, { post }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      throw createApiError(400, 'INVALID_POST_ID', 'Post ID is invalid.');
    }
    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, authorId: req.user._id, status: 'published' },
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!post) throw createApiError(404, 'POST_NOT_FOUND', 'Post not found.');
    return sendSuccess(res, 200, { removed: true }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function listGroups(req, res, next) {
  try {
    const groups = await Group.find({
      $or: [{ visibility: 'public' }, { memberIds: req.user._id }],
    })
      .populate('createdBy', 'name profile.avatarUrl')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return sendSuccess(res, 200, {
      groups: groups.map((group) => ({
        ...group,
        isMember: group.memberIds.some((memberId) => String(memberId) === String(req.user._id)),
        memberCount: group.memberIds.length,
      })),
    }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function createGroup(req, res, next) {
  const parsed = groupSchema.safeParse(req.body);
  if (!parsed.success) return invalidRequest(res, req.requestId, parsed.error);

  try {
    const group = await Group.create({
      ...parsed.data,
      createdBy: req.user._id,
      memberIds: [req.user._id],
    });
    return sendSuccess(res, 201, { group }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function joinGroup(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) {
      throw createApiError(400, 'INVALID_GROUP_ID', 'Group ID is invalid.');
    }
    const group = await Group.findOneAndUpdate(
      { _id: req.params.groupId, visibility: 'public' },
      { $addToSet: { memberIds: req.user._id } },
      { returnDocument: 'after' }
    );
    if (!group) throw createApiError(404, 'PUBLIC_GROUP_NOT_FOUND', 'Public group not found.');
    return sendSuccess(res, 200, { group }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function listConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ participantIds: req.user._id })
      .populate('participantIds', 'name profile.avatarUrl')
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean();
    const conversationIds = conversations.map((conversation) => conversation._id);
    const latestMessages = conversationIds.length
      ? await Message.aggregate([
        { $match: { conversationId: { $in: conversationIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$conversationId', message: { $first: '$$ROOT' } } },
      ])
      : [];
    const lastMessageByConversation = new Map(latestMessages.map(({ _id, message }) => [String(_id), message]));
    return sendSuccess(res, 200, {
      conversations: conversations.map((conversation) => ({
        ...conversation,
        lastMessage: lastMessageByConversation.get(String(conversation._id)) || null,
      })),
    }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function startConversation(req, res, next) {
  const parsed = conversationSchema.safeParse(req.body);
  if (!parsed.success) return invalidRequest(res, req.requestId, parsed.error);

  try {
    const { recipientId } = parsed.data;
    if (String(req.user._id) === recipientId) {
      throw createApiError(400, 'SELF_MESSAGE_NOT_ALLOWED', 'You cannot start a conversation with yourself.');
    }
    const connection = await Connection.findOne({
      status: 'accepted',
      $or: [
        { requesterId: req.user._id, recipientId },
        { requesterId: recipientId, recipientId: req.user._id },
      ],
    });
    if (!connection) {
      throw createApiError(403, 'CONNECTION_REQUIRED', 'You can message members after they accept your connection request.');
    }

    let conversation = await Conversation.findOne({
      participantIds: { $all: [req.user._id, recipientId], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({ participantIds: [req.user._id, recipientId] });
    }
    await conversation.populate('participantIds', 'name profile.avatarUrl');
    return sendSuccess(res, 200, { conversation }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function listMessages(req, res, next) {
  try {
    const conversation = await getConversationForMember(req.params.conversationId, req.user._id);
    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'name profile.avatarUrl')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return sendSuccess(res, 200, { messages: messages.reverse() }, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function createMessage(req, res, next) {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return invalidRequest(res, req.requestId, parsed.error);

  try {
    const conversation = await getConversationForMember(req.params.conversationId, req.user._id);
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      body: parsed.data.body,
    });
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    await message.populate('senderId', 'name profile.avatarUrl');
    return sendSuccess(res, 201, { message }, req.requestId);
  } catch (error) {
    next(error);
  }
}
