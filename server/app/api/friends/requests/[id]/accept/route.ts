import { NextRequest, NextResponse } from 'next/server';

import { acceptRequest } from '@controllers/friendRequestController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    const user = await authenticateUser(authHeader);

    const result = await acceptRequest(params.id, user.id);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
