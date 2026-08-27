// app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { CreateQuestionSchema } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateQuestionSchema.parse(body);

    const question = await db.addQuestion(validated);

    return NextResponse.json(
      question,
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating question:', error);

    return NextResponse.json(
      { error: 'Error creating question' },
      { status: 400 }
    );
  }
}