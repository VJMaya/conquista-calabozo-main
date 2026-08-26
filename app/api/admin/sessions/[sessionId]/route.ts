// app/api/admin/sessions/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await req.json();

    const session = await prisma.gameSession.update({
      where: { id: params.sessionId },
      data: body,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Error updating session' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    await prisma.gameSession.delete({
      where: { id: params.sessionId },
    });

    return NextResponse.json(
      { message: 'Session deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Error deleting session' },
      { status: 400 }
    );
  }
}
