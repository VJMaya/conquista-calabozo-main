// app/api/sessions/[sessionId]/lobby/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await db.getOrCreateGameSession(params.sessionId);
    const teams = await db.getTeamsBySession(params.sessionId);

    const playerGroups = await Promise.all(
      teams.map(team => db.getTeamMembers(team.id))
    );

    const allPlayers = playerGroups.flat().map(user => ({
      id: user.id,
      displayName: user.displayName,
      avatarKey: user.avatarKey,
    }));

    return NextResponse.json({
      sessionId: session.id,
      sessionName: session.name,
      status: session.status,
      connectedPlayers: allPlayers.length,
      maxPlayers: session.maxPlayers,
      minPlayers: session.minPlayers,
      players: allPlayers,
      teams: teams.length,
    });
  } catch (error) {
    console.error('Error fetching lobby:', error);

    return NextResponse.json(
      {
        error: 'Error fetching lobby',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
