import { apiRequest } from './client';
import type { ApiListResponse, ChatSummary, Message, SendMessagePayload } from './types';

type MessagesResponse = ApiListResponse<Message, 'messages'>;

type SendMessageResponse = {
  message: Message;
};

type ChatRoomsResponse = ApiListResponse<ChatSummary, 'rooms'>;

export async function fetchChatRooms(): Promise<ChatSummary[]> {
  const response = await apiRequest<ChatRoomsResponse>({
    url: '/chat/rooms',
    method: 'GET',
  });

  return response.rooms;
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const response = await apiRequest<MessagesResponse>({
    url: `/chat/messages/${chatId}`,
    method: 'GET',
  });

  return response.messages;
}

export async function postMessage(payload: SendMessagePayload): Promise<Message> {
  const response = await apiRequest<SendMessageResponse>({
    url: '/chat/send',
    method: 'POST',
    data: payload,
  });

  return response.message;
}
