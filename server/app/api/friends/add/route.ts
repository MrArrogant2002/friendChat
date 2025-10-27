import { NextRequest, NextResponse } from 'next/server';

import { addFriend } from '@controllers/friendController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    const user = await authenticateUser(authHeader);
    const payload = await request.json();
    const friendId = typeof payload?.friendId === 'string' ? payload.friendId : '';

    const friend = await addFriend(user.id, friendId);

    return NextResponse.json({ friend }, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
