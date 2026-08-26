// app/api/admin/stages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateStageSchema } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateStageSchema.parse(body);

    const stage = await prisma.stage.create({
      data: validated,
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: 'Error creating stage' },
      { status: 400 }
    );
  }
}
