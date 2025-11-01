import { HydratedDocument, InferSchemaType, Model, Schema, model, models } from 'mongoose';

const friendRequestSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

export type FriendRequest = InferSchemaType<typeof friendRequestSchema>;
export type FriendRequestDocument = HydratedDocument<FriendRequest>;

const FriendRequestModel: Model<FriendRequest> =
  (models.FriendRequest as Model<FriendRequest>) || model<FriendRequest>('FriendRequest', friendRequestSchema);

export default FriendRequestModel;
