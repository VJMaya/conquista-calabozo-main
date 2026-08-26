// app/api/sessions/[sessionId]/lobby/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: params.sessionId },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get all players in the session
    const allPlayers = session.teams.flatMap(team =>
      team.members.map(member => ({
        id: member.user.id,
        displayName: member.user.displayName,
        avatarKey: member.user.avatarKey,
      }))
    );

    return NextResponse.json({
      sessionId: session.id,
      sessionName: session.name,
      status: session.status,
      connectedPlayers: allPlayers.length,
      maxPlayers: session.maxPlayers,
      minPlayers: session.minPlayers,
      players: allPlayers,
      teams: session.teams.length,
    });
  } catch (error) {
    console.error('Error fetching lobby:', error);
    return NextResponse.json(
      { error: 'Error fetching lobby' },
      { status: 500 }
    );
  }
}
