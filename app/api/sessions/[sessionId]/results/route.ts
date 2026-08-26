// app/api/sessions/[sessionId]/results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compareLeaderboardEntries } from '@/lib/scoring';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const teams = await prisma.team.findMany({
      where: { gameSessionId: params.sessionId },
      include: {
        members: true,
        playerAnswers: true,
      },
    });

    // Calculate leaderboard
    const leaderboard = teams
      .map((team) => ({
        teamId: team.id,
        teamName: team.name,
        totalCorrect: team.totalCorrect,
        totalTimeSeconds: team.totalTimeSeconds,
        finalScore: team.finalScore,
        currentStage: team.currentStage,
        memberCount: team.members.length,
      }))
      .sort((a, b) =>
        compareLeaderboardEntries(
          { ...a, teamSize: a.memberCount },
          { ...b, teamSize: b.memberCount }
        )
      )
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({
      sessionId: params.sessionId,
      leaderboard,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Error fetching results' },
      { status: 500 }
    );
  }
}
