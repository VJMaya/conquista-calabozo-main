import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const body = await req.json();

    const question = await db.updateQuestion(
      params.questionId,
      body
    );

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

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
    await db.deleteQuestion(params.questionId);

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