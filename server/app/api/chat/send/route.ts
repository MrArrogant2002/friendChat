import { NextRequest, NextResponse } from 'next/server';

import { sendMessage } from '@controllers/chatController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    const user = await authenticateUser(authHeader);
    const payload = await request.json();
    const message = await sendMessage(user.id, payload);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
