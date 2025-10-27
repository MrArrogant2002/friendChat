import {
    HydratedDocument,
    InferSchemaType,
    Model,
    Schema,
    Types,
    model,
    models,
} from 'mongoose';

const attachmentSchema = new Schema(
  {
    kind: { type: String, enum: ['image', 'audio', 'file', 'link'], required: true },
    url: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    chatId: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

export type Attachment = InferSchemaType<typeof attachmentSchema>;
export type Message = InferSchemaType<typeof messageSchema> & {
  sender: Types.ObjectId;
};
export type MessageDocument = HydratedDocument<Message>;

const MessageModel: Model<Message> =
  (models.Message as Model<Message>) || model<Message>('Message', messageSchema);

export default MessageModel;
