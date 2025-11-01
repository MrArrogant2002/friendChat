import { HydratedDocument, InferSchemaType, Model, Schema, model, models } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
    pushTokens: [{ type: String }], // Array of Expo push tokens for this user
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

const UserModel: Model<User> = (models.User as Model<User>) || model<User>('User', userSchema);

export default UserModel;
