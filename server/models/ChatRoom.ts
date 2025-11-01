import { HydratedDocument, InferSchemaType, Model, Schema, model, models } from 'mongoose';

const chatRoomSchema = new Schema(
  {
    chatId: { type: String, required: true, unique: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    title: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ chatId: 1 }, { unique: true });

export type ChatRoom = InferSchemaType<typeof chatRoomSchema>;
export type ChatRoomDocument = HydratedDocument<ChatRoom>;

const ChatRoomModel: Model<ChatRoom> =
  (models.ChatRoom as Model<ChatRoom>) || model<ChatRoom>('ChatRoom', chatRoomSchema);

export default ChatRoomModel;
