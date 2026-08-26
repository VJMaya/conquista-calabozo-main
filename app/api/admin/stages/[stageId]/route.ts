// app/api/admin/stages/[stageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { stageId: string } }
) {
  try {
    const body = await req.json();

    const stage = await prisma.stage.update({
      where: { id: params.stageId },
      data: body,
    });

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json(
      { error: 'Error updating stage' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { stageId: string } }
) {
  try {
    await prisma.stage.delete({
      where: { id: params.stageId },
    });

    return NextResponse.json(
      { message: 'Stage deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: 'Error deleting stage' },
      { status: 400 }
    );
  }
}
