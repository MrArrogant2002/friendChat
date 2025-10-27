import { NextRequest, NextResponse } from 'next/server';

import { loginUser } from '@controllers/authController';
import { normalizeError } from '@lib/httpError';
import { connectToDatabase } from '@lib/mongoose';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const result = await loginUser(payload);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { status, message, details } = normalizeError(error);
    return NextResponse.json({ message, details }, { status });
  }
}
