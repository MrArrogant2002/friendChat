import { Types } from 'mongoose';
import type { Server as SocketIOServer } from 'socket.io';

import { HttpError } from '../lib/httpError';
import MessageModel, { type MessageDocument } from '../models/Message';
import UserModel from '../models/User';

export type SendMessagePayload = {
  chatId: string;
  content?: string;
  attachments?: unknown[];
};

function validateSendMessagePayload(payload: SendMessagePayload): void {
  if (!payload.chatId?.trim()) {
    throw new HttpError(400, 'chatId is required');
  }
}

export async function sendMessage(
  senderId: string,
  payload: SendMessagePayload,
  io?: SocketIOServer
): Promise<MessageDocument> {
  validateSendMessagePayload(payload);

  const message = await MessageModel.create({
    chatId: payload.chatId,
    sender: senderId,
    content: payload.content ?? '',
    attachments: payload.attachments ?? [],
  });

  if (io) {
    io.to(payload.chatId).emit('chatMessage', {
      id: message.id,
      chatId: message.chatId,
      sender: senderId,
      content: message.content,
      attachments: message.attachments,
      createdAt: message.createdAt,
    });
  }

  return message;
}

export async function getMessages(chatId: string): Promise<MessageDocument[]> {
  if (!chatId?.trim()) {
    throw new HttpError(400, 'chatId is required');
  }

  return MessageModel.find({ chatId }).populate('sender', 'name email avatarUrl').sort({ createdAt: 1 });
}

export type ChatParticipantSummary = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type ChatMessageSummary = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string | null;
};

export type ChatRoomSummary = {
  id: string;
  title: string;
  messageCount: number;
  participants: ChatParticipantSummary[];
  lastMessage: ChatMessageSummary | null;
  unreadCount: number;
};

function computeRoomTitle(
  participants: ChatParticipantSummary[],
  currentUserId: string,
  chatId: string
): string {
  const otherParticipants = participants.filter((participant) => participant.id !== currentUserId);
  if (otherParticipants.length) {
    return otherParticipants
      .map((participant) => participant.name)
      .filter(Boolean)
      .join(', ');
  }
  return chatId;
}

async function getParticipantSummaries(chatId: string): Promise<ChatParticipantSummary[]> {
  const participantIds = await MessageModel.distinct('sender', { chatId });

  if (!participantIds.length) {
    return [];
  }

  const participants = await UserModel.find({ _id: { $in: participantIds } })
    .select('name avatarUrl')
    .lean();

  return participants.map((participant) => ({
    id: participant._id.toString(),
    name: participant.name,
    avatarUrl: participant.avatarUrl ?? '',
  }));
}

export async function getChatRoomsForUser(userId: string): Promise<ChatRoomSummary[]> {
  if (!userId?.trim()) {
    throw new HttpError(401, 'Unauthorized');
  }

  let userObjectId: Types.ObjectId;
  try {
    userObjectId = new Types.ObjectId(userId);
  } catch {
    throw new HttpError(400, 'Invalid user identifier');
  }
  const chatIds = await MessageModel.distinct('chatId', { sender: userObjectId }) as string[];

  if (!chatIds.length) {
    return [];
  }

  const rooms = await Promise.all(
    chatIds.map(async (chatId: string) => {
      const [lastMessageDoc, messageCount, participants] = await Promise.all([
        MessageModel.findOne({ chatId })
          .sort({ createdAt: -1 })
          .populate('sender', 'name')
          .lean(),
        MessageModel.countDocuments({ chatId }),
        getParticipantSummaries(chatId),
      ]);

      const title = computeRoomTitle(participants, userId, chatId);

      const lastMessage: ChatMessageSummary | null = lastMessageDoc
        ? {
            id: lastMessageDoc._id.toString(),
            content: lastMessageDoc.content,
            createdAt: lastMessageDoc.createdAt.toISOString(),
            senderId:
              typeof lastMessageDoc.sender === 'object' && lastMessageDoc.sender
                ? (lastMessageDoc.sender as { _id: Types.ObjectId })._id.toString()
                : String(lastMessageDoc.sender),
            senderName:
              typeof lastMessageDoc.sender === 'object' && lastMessageDoc.sender
                ? (lastMessageDoc.sender as { name?: string }).name ?? null
                : null,
          }
        : null;

      return {
        id: chatId,
        title,
        messageCount,
        participants,
        lastMessage,
        unreadCount: 0,
      } satisfies ChatRoomSummary;
    })
  );

  return rooms.sort((a, b) => {
    const aTime = a.lastMessage ? Date.parse(a.lastMessage.createdAt) : 0;
    const bTime = b.lastMessage ? Date.parse(b.lastMessage.createdAt) : 0;
    return bTime - aTime;
  });
}
