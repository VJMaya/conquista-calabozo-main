// app/api/admin/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const body = await req.json();

    const question = await prisma.question.update({
      where: { id: params.questionId },
      data: body,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Error updating question' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    await prisma.question.delete({
      where: { id: params.questionId },
    });

    return NextResponse.json(
      { message: 'Question deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Error deleting question' },
      { status: 400 }
    );
  }
}
