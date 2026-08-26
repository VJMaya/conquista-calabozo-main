// app/api/sessions/[sessionId]/current-stage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string; teamId?: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const stage = await prisma.stage.findUnique({
      where: {
        gameSessionId_stageNumber: {
          gameSessionId: params.sessionId,
          stageNumber: team.currentStage,
        },
      },
      include: {
        questions: {
          where: { isActive: true },
          select: {
            id: true,
            stageId: true,
            questionType: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            pointsBase: true,
            difficulty: true,
            imageUrl: true,
            // Do NOT return correctAnswer
          },
        },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    const question = stage.questions[0]; // Get first active question

    return NextResponse.json({
      stage: {
        id: stage.id,
        stageNumber: stage.stageNumber,
        title: stage.title,
        description: stage.description,
        visualTheme: stage.visualTheme,
        timeLimitSeconds: stage.timeLimitSeconds,
      },
      question: question || null,
    });
  } catch (error) {
    console.error('Error fetching current stage:', error);
    return NextResponse.json(
      { error: 'Error fetching stage' },
      { status: 500 }
    );
  }
}
