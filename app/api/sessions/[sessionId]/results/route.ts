// app/api/sessions/[sessionId]/results/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { compareLeaderboardEntries } from '@/lib/scoring';

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const teams = await db.getTeamsBySession(params.sessionId);

    const leaderboardData = await Promise.all(
      teams.map(async team => {
        const members = await db.getTeamMembers(team.id);

        return {
          teamId: team.id,
          teamName: team.name,
          totalCorrect: team.totalCorrect,
          totalTimeSeconds: team.totalTimeSeconds,
          finalScore: team.finalScore,
          currentStage: team.currentStage,
          memberCount: members.length,
        };
      })
    );

    const leaderboard = leaderboardData
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
      {
        error: 'Error fetching results',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
