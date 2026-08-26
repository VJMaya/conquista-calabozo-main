
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { GuestLoginSchema } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = GuestLoginSchema.parse(body);

    const user = await db.createUser({
      displayName: validated.displayName,
      avatarKey: validated.avatarKey,
      roleClass: validated.avatarKey,
      isConnected: true,
    });

    return NextResponse.json(
      {
        userId: user.id,
        displayName: user.displayName,
        avatarKey: user.avatarKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in guest login:', error);

    return NextResponse.json(
      {
        error: 'Error creating guest user',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}