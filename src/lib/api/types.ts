export type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AttachmentKind = 'image' | 'audio' | 'file' | 'link';

export type MessageAttachment = {
  kind: AttachmentKind;
  url: string;
  metadata?: Record<string, unknown> | null;
};

export type MessageSender = ApiUser | string;

export type Message = {
  id: string;
  chatId: string;
  sender: MessageSender;
  content: string;
  attachments: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type SendMessagePayload = {
  chatId: string;
  content?: string;
  attachments?: MessageAttachment[];
};

export type ChatParticipant = {
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

export type ChatSummary = {
  id: string;
  title: string;
  messageCount: number;
  unreadCount: number;
  participants: ChatParticipant[];
  lastMessage: ChatMessageSummary | null;
};

export type FriendProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  // Optional online presence flag (server may provide this)
  isOnline?: boolean;
};

export type ApiListResponse<TItem, TKey extends string> = {
  [K in TKey]: TItem[];
} & {
  message?: string;
};
