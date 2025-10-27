import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '@lib/env';

import { HttpError } from '../lib/httpError';
import UserModel, { type UserDocument } from '../models/User';

const TOKEN_EXPIRY = '7d';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
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

function mapUser(user: UserDocument): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function validateRegisterPayload(payload: RegisterPayload): void {
  const errors: string[] = [];

  if (!payload.name?.trim()) {
    errors.push('Name is required');
  }

  if (!payload.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('Valid email is required');
  }

  if (!payload.password || payload.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length) {
    throw new HttpError(400, 'Validation failed', errors);
  }
}

function validateLoginPayload(payload: LoginPayload): void {
  const errors: string[] = [];

  if (!payload.email?.trim()) {
    errors.push('Email is required');
  }

  if (!payload.password) {
    errors.push('Password is required');
  }

  if (errors.length) {
    throw new HttpError(400, 'Validation failed', errors);
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  validateRegisterPayload(payload);

  const { name, email, password, avatarUrl = '' } = payload;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    avatarUrl,
  });

  const token = generateToken(user.id);

  return {
    token,
    user: mapUser(user),
  };
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  validateLoginPayload(payload);

  const { email, password } = payload;
  const user = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const token = generateToken(user.id);

  return {
    token,
    user: mapUser(user),
  };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId).select('-password');

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return mapUser(user);
}
