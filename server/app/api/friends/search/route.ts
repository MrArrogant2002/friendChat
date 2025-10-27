import { NextRequest, NextResponse } from 'next/server';

import { searchFriends } from '@controllers/friendController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    const user = await authenticateUser(authHeader);
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') ?? '';

    const results = await searchFriends(user.id, query);

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
