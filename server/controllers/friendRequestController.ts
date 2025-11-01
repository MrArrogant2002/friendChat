import { Types } from 'mongoose';

import { HttpError } from '../lib/httpError';
import { sendPushNotification } from '../lib/pushNotifications';
import ChatRoomModel from '../models/ChatRoom';
import FriendRequestModel from '../models/FriendRequest';
import FriendshipModel from '../models/Friendship';
import UserModel from '../models/User';

function normalizeObjectId(id: string, field: string): Types.ObjectId {
  try {
    return new Types.ObjectId(id);
  } catch {
    throw new HttpError(400, `${field} is invalid`);
  }
}

export async function sendFriendRequest(currentUserId: string, friendId: string) {
  if (!friendId?.trim()) {
    throw new HttpError(400, 'friendId is required');
  }
  if (friendId === currentUserId) {
    throw new HttpError(400, 'Cannot send request to yourself');
  }

  const fromId = normalizeObjectId(currentUserId, 'userId');
  const toId = normalizeObjectId(friendId, 'friendId');

  const userExists = await UserModel.exists({ _id: toId });
  if (!userExists) {
    throw new HttpError(404, 'User not found');
  }

  // Upsert a pending request (unique by from/to)
  const request = await FriendRequestModel.findOneAndUpdate(
    { from: fromId, to: toId },
    { $setOnInsert: { from: fromId, to: toId, status: 'pending' } },
    { upsert: true, new: true }
  ).lean();

  // Send push notification to the recipient
  const sender = await UserModel.findById(fromId).select('name').lean();
  if (sender) {
    void sendPushNotification(friendId, {
      title: 'New Friend Request',
      body: `${sender.name} sent you a friend request`,
      data: { type: 'friend_request', requestId: request._id.toString() },
    });
  }

  return request;
}

export async function listPendingRequests(currentUserId: string) {
  const toId = normalizeObjectId(currentUserId, 'userId');

  const requests = await FriendRequestModel.find({ to: toId, status: 'pending' })
    .populate({ path: 'from', select: 'name email avatarUrl' })
    .sort({ createdAt: -1 })
    .lean();

  return requests.map((r) => ({
    id: r._id.toString(),
    from: r.from ? { id: (r.from as any)._id.toString(), name: (r.from as any).name || '', email: (r.from as any).email || '', avatarUrl: (r.from as any).avatarUrl || '' } : null,
    createdAt: r.createdAt,
  }));
}

export async function acceptRequest(requestId: string, currentUserId: string) {
  const reqObjId = normalizeObjectId(requestId, 'requestId');

  const request = await FriendRequestModel.findById(reqObjId).lean();
  if (!request) {
    throw new HttpError(404, 'Request not found');
  }

  if (request.to.toString() !== currentUserId) {
    throw new HttpError(403, 'Not authorized to accept this request');
  }

  if (request.status !== 'pending') {
    throw new HttpError(400, 'Request is not pending');
  }

  // Mark accepted
  await FriendRequestModel.updateOne({ _id: reqObjId }, { $set: { status: 'accepted' } });

  // Ensure friendship records exist in both directions
  const fromId = request.from as Types.ObjectId;
  const toId = request.to as Types.ObjectId;

  await FriendshipModel.updateOne(
    { user: fromId, friend: toId },
    { $setOnInsert: { user: fromId, friend: toId } },
    { upsert: true }
  );

  await FriendshipModel.updateOne(
    { user: toId, friend: fromId },
    { $setOnInsert: { user: toId, friend: fromId } },
    { upsert: true }
  );

  // return a simple payload
  const friend = await UserModel.findById(fromId).select('name email avatarUrl').lean();

  // Compute deterministic chatId for the two users and create/ensure ChatRoom record exists
  const fromIdStr = fromId.toString();
  const toIdStr = toId.toString();
  const chatId = [fromIdStr, toIdStr].sort().join('-');

  // Create or update the ChatRoom record
  await ChatRoomModel.updateOne(
    { chatId },
    {
      $setOnInsert: {
        chatId,
        participants: [fromId, toId],
        title: friend?.name || 'Chat',
      },
    },
    { upsert: true }
  );

  // Send push notification to the requester (they were accepted!)
  const acceptor = await UserModel.findById(toId).select('name').lean();
  if (acceptor) {
    void sendPushNotification(fromIdStr, {
      title: 'Friend Request Accepted',
      body: `${acceptor.name} accepted your friend request`,
      data: { type: 'friend_accepted', chatId, title: friend?.name || 'Chat' },
    });
  }

  return {
    requestId: reqObjId.toString(),
    friend: friend
      ? { id: friend._id.toString(), name: friend.name, email: friend.email, avatarUrl: friend.avatarUrl ?? '' }
      : null,
    chatId,
  };
}

export async function rejectRequest(requestId: string, currentUserId: string) {
  const reqObjId = normalizeObjectId(requestId, 'requestId');

  const request = await FriendRequestModel.findById(reqObjId).lean();
  if (!request) {
    throw new HttpError(404, 'Request not found');
  }

  if (request.to.toString() !== currentUserId) {
    throw new HttpError(403, 'Not authorized to reject this request');
  }

  if (request.status !== 'pending') {
    throw new HttpError(400, 'Request is not pending');
  }

  await FriendRequestModel.updateOne({ _id: reqObjId }, { $set: { status: 'rejected' } });

  return { requestId: reqObjId.toString(), status: 'rejected' };
}
