import jwt, { type JwtPayload } from 'jsonwebtoken';

import { env } from '@lib/env';

import { HttpError } from '../lib/httpError';
import UserModel, { type UserDocument } from '../models/User';

interface TokenPayload extends JwtPayload {
  id: string;
}

export function extractTokenFromHeader(authorizationHeader?: string): string {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Unauthorized');
  }

  return authorizationHeader.split(' ')[1] as string;
}

export function decodeToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new HttpError(401, 'Invalid token');
  }
}

export async function resolveUserFromToken(token: string): Promise<UserDocument> {
  const decoded = decodeToken(token);

  if (!decoded?.id) {
    throw new HttpError(401, 'Invalid token');
  }

  const user = await UserModel.findById(decoded.id).select('-password');

  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  return user;
}

export async function authenticateUser(authorizationHeader?: string): Promise<UserDocument> {
  const token = extractTokenFromHeader(authorizationHeader);
  return resolveUserFromToken(token);
}
