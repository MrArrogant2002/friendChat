import { NextRequest, NextResponse } from 'next/server';

import { getMessages } from '@controllers/chatController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';

export async function GET(
  request: NextRequest,
  context: { params: { chatId: string } }
): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    await authenticateUser(authHeader);
    const { chatId } = context.params;
    const messages = await getMessages(chatId);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
