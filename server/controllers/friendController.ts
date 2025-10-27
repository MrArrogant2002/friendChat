import { Types } from 'mongoose';

import { HttpError } from '../lib/httpError';
import FriendshipModel from '../models/Friendship';
import UserModel from '../models/User';

export type FriendProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

function normalizeObjectId(id: string, field: string): Types.ObjectId {
  try {
    return new Types.ObjectId(id);
  } catch {
    throw new HttpError(400, `${field} is invalid`);
  }
}

export async function searchFriends(currentUserId: string, query: string): Promise<FriendProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await UserModel.find({
    _id: { $ne: currentUserId },
    $or: [{ name: regex }, { email: regex }],
  })
    .limit(20)
    .select('name email avatarUrl')
    .lean();

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? '',
  }));
}

export async function addFriend(currentUserId: string, friendId: string): Promise<FriendProfile> {
  if (!friendId?.trim()) {
    throw new HttpError(400, 'friendId is required');
  }

  if (friendId === currentUserId) {
    throw new HttpError(400, 'You cannot add yourself as a friend');
  }

  const [userObjectId, friendObjectId] = [
    normalizeObjectId(currentUserId, 'userId'),
    normalizeObjectId(friendId, 'friendId'),
  ];

  const friend = await UserModel.findById(friendObjectId).select('name email avatarUrl').lean();
  if (!friend) {
    throw new HttpError(404, 'User not found');
  }

  await FriendshipModel.updateOne(
    { user: userObjectId, friend: friendObjectId },
    { $setOnInsert: { user: userObjectId, friend: friendObjectId } },
    { upsert: true }
  );

  await FriendshipModel.updateOne(
    { user: friendObjectId, friend: userObjectId },
    { $setOnInsert: { user: friendObjectId, friend: userObjectId } },
    { upsert: true }
  );

  return {
    id: friend._id.toString(),
    name: friend.name,
    email: friend.email,
    avatarUrl: friend.avatarUrl ?? '',
  } satisfies FriendProfile;
}

export async function listFriends(currentUserId: string): Promise<FriendProfile[]> {
  const userObjectId = normalizeObjectId(currentUserId, 'userId');

  const friendships = await FriendshipModel.find({ user: userObjectId })
    .populate({ path: 'friend', select: 'name email avatarUrl' })
    .sort({ createdAt: -1 })
    .lean();

  type PopulatedFriend = {
    _id: Types.ObjectId;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };

  return friendships
    .map((friendship) => {
      const friend = friendship.friend as PopulatedFriend | Types.ObjectId | null | undefined;

      if (!friend || typeof friend !== 'object' || !('_id' in friend) || friend instanceof Types.ObjectId) {
        return null;
      }

      const populatedFriend = friend as PopulatedFriend;
      const email = typeof populatedFriend.email === 'string' ? populatedFriend.email : null;
      if (!email) {
        return null;
      }

      return {
        id: populatedFriend._id.toString(),
        name: typeof populatedFriend.name === 'string' ? populatedFriend.name : '',
        email,
        avatarUrl: typeof populatedFriend.avatarUrl === 'string' ? populatedFriend.avatarUrl : '',
      } satisfies FriendProfile;
    })
    .filter((profile): profile is FriendProfile => profile !== null);
}
