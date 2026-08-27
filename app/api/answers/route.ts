// app/api/answers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { SubmitAnswerSchema } from '@/types/api';
import { isAnswerCorrect, calculateIndividualPoints } from '@/lib/scoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = SubmitAnswerSchema.parse(body);

    const existingAnswer = await db.findPlayerAnswer(
      validated.teamId,
      validated.userId,
      validated.questionId
    );

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'You have already answered this question' },
        { status: 400 }
      );
    }

    const question = await db.findQuestionById(validated.questionId);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = isAnswerCorrect(
      validated.answer,
      question.correctAnswer,
      question.questionType as
        | 'multiple_choice'
        | 'short_text'
        | 'true_false'
    );

    const pointsAwarded = calculateIndividualPoints(
      isCorrect,
      question.pointsBase,
      question.timeLimitSeconds || 60,
      validated.timeUsedSeconds
    );

    const playerAnswer = await db.createPlayerAnswer({
      gameSessionId: validated.gameSessionId,
      teamId: validated.teamId,
      userId: validated.userId,
      stageId: validated.stageId,
      questionId: validated.questionId,
      submittedAnswer: validated.answer,
      isCorrect,
      responseTimeSeconds: validated.timeUsedSeconds,
      pointsAwarded,
      submittedAt: new Date(),
    });

    if (isCorrect) {
      const team = await db.findTeamById(validated.teamId);

      if (team) {
        await db.updateTeam(team.id, {
          totalCorrect: team.totalCorrect + 1,
          finalScore: team.finalScore + pointsAwarded,
          totalTimeSeconds:
            team.totalTimeSeconds + validated.timeUsedSeconds,
        });
      }
    }

    return NextResponse.json(
      {
        answerId: playerAnswer.id,
        isCorrect,
        pointsAwarded,
        responseTimeSeconds: validated.timeUsedSeconds,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting answer:', error);

    return NextResponse.json(
      {
        error: 'Error submitting answer',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
