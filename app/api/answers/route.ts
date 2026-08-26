// app/api/answers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubmitAnswerSchema } from '@/types/api';
import { isAnswerCorrect, calculateIndividualPoints } from '@/lib/scoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = SubmitAnswerSchema.parse(body);

    // Verify player hasn't answered this question yet
    const existingAnswer = await prisma.playerAnswer.findUnique({
      where: {
        teamId_userId_questionId: {
          teamId: validated.teamId,
          userId: validated.userId,
          questionId: validated.questionId,
        },
      },
    });

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'You have already answered this question' },
        { status: 400 }
      );
    }

    // Get question details
    const question = await prisma.question.findUnique({
      where: { id: validated.questionId },
      include: {
        stage: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check answer
    const isCorrect = isAnswerCorrect(
      validated.answer,
      question.correctAnswer,
      question.questionType as 'multiple_choice' | 'short_text' | 'true_false'
    );

    // Calculate points
    const pointsAwarded = calculateIndividualPoints(
      isCorrect,
      question.pointsBase,
      question.stage.timeLimitSeconds,
      validated.timeUsedSeconds
    );

    // Save answer
    const playerAnswer = await prisma.playerAnswer.create({
      data: {
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
      },
    });

    // Update team stats
    if (isCorrect) {
      await prisma.team.update({
        where: { id: validated.teamId },
        data: {
          totalCorrect: {
            increment: 1,
          },
        },
      });
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
      { error: 'Error submitting answer' },
      { status: 400 }
    );
  }
}
