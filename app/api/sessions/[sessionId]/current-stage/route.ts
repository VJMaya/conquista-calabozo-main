// app/api/sessions/[sessionId]/current-stage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const team = await db.findTeamById(teamId);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.gameSessionId !== params.sessionId) {
      return NextResponse.json(
        { error: 'Team does not belong to this session' },
        { status: 400 }
      );
    }

    const stageId = String(team.currentStage);
    const questions = await db.getQuestionsByStage(stageId);
    const selectedQuestion = questions.find(
      question => question.isActive !== false
    );

    const publicQuestion = selectedQuestion
      ? {
          id: selectedQuestion.id,
          stageId: selectedQuestion.stageId,
          questionType: selectedQuestion.questionType,
          questionText: selectedQuestion.questionText,
          optionA: selectedQuestion.optionA,
          optionB: selectedQuestion.optionB,
          optionC: selectedQuestion.optionC,
          optionD: selectedQuestion.optionD,
          pointsBase: selectedQuestion.pointsBase,
          difficulty: selectedQuestion.difficulty,
          imageUrl: selectedQuestion.imageUrl,
        }
      : null;

    return NextResponse.json({
      stage: {
        id: stageId,
        stageNumber: team.currentStage,
        title: `Etapa ${team.currentStage}`,
        description: 'Etapa actual del calabozo',
        visualTheme: 'medieval',
        timeLimitSeconds: selectedQuestion?.timeLimitSeconds || 60,
      },
      question: publicQuestion,
    });
  } catch (error) {
    console.error('Error fetching current stage:', error);

    return NextResponse.json(
      {
        error: 'Error fetching stage',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
