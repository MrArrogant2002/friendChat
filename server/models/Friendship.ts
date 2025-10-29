import { HydratedDocument, InferSchemaType, Model, Schema, model, models } from 'mongoose';

const friendshipSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    friend: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

friendshipSchema.index({ user: 1, friend: 1 }, { unique: true });

export type Friendship = InferSchemaType<typeof friendshipSchema>;
export type FriendshipDocument = HydratedDocument<Friendship>;

const FriendshipModel: Model<Friendship> =
  (models.Friendship as Model<Friendship>) || model<Friendship>('Friendship', friendshipSchema);

export default FriendshipModel;
