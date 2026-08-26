// app/api/admin/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateSessionSchema } from '@/types/api';

export async function GET(req: NextRequest) {
  try {
    const sessions = await prisma.gameSession.findMany({
      include: {
        teams: true,
        stages: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Error fetching sessions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateSessionSchema.parse(body);

    const session = await prisma.gameSession.create({
      data: validated,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Error creating session' },
      { status: 400 }
    );
  }
}
