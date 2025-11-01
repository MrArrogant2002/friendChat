import { NextRequest, NextResponse } from 'next/server';

import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';
import { authenticateUser } from '@middleware/authMiddleware';
import UserModel from '@models/User';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const authHeader = request.headers.get('authorization') ?? undefined;
    const user = await authenticateUser(authHeader);
    
    const body = await request.json();
    const { pushToken } = body;

    if (!pushToken || typeof pushToken !== 'string') {
      return NextResponse.json({ message: 'pushToken is required' }, { status: 400 });
    }

    // Add push token to user's pushTokens array if not already present
    await UserModel.updateOne(
      { _id: user.id },
      { $addToSet: { pushTokens: pushToken } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
