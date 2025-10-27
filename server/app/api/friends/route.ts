import { NextRequest, NextResponse } from 'next/server';

import { listFriends } from '@controllers/friendController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    const user = await authenticateUser(authHeader);

    const friends = await listFriends(user.id);

    return NextResponse.json({ friends }, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
