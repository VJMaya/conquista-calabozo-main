// types/socket.ts
export interface ServerToClientEvents {
  'lobby:update': (data: {
    connectedPlayers: number;
    maxPlayers: number;
    minPlayers: number;
    players: Array<{ id: string; displayName: string; avatarKey: string }>;
  }) => void;
  'team:assigned': (data: {
    teamId: string;
    teamName: string;
    members: Array<{ id: string; displayName: string; avatarKey: string }>;
  }) => void;
  'game:started': (data: { gameSessionId: string; startsAt: Date }) => void;
  'game:paused': (data: { pausedAt: Date }) => void;
  'game:resumed': (data: { resumedAt: Date }) => void;
  'stage:started': (data: {
    stageNumber: number;
    title: string;
    visualTheme: string;
    timeLimitSeconds: number;
    question: any;
  }) => void;
  'stage:timer_update': (data: { timeRemainingSeconds: number }) => void;
  'answer:received': (data: { messageId: string }) => void;
  'answer:result': (data: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    timeUsed: number;
    pointsAwarded: number;
    correctAnswer: string;
  }) => void;
  'team:answer_status': (data: {
    teamId: string;
    responses: Map<string, boolean>; // userId -> hasResponded
    completedAt?: Date;
  }) => void;
  'stage:completed': (data: {
    stageNumber: number;
    results: Array<{
      userId: string;
      displayName: string;
      answer: string;
      isCorrect: boolean;
      timeUsed: number;
      pointsAwarded: number;
    }>;
    teamScore: number;
    teamCorrect: number;
  }) => void;
  'leaderboard:update': (data: {
    entries: Array<{
      rank: number;
      teamName: string;
      correctAnswers: number;
      totalTime: number;
      score: number;
      currentStage: number;
    }>;
  }) => void;
  'game:ended': (data: {
    winnerTeamId: string;
    winnerTeamName: string;
    finalLeaderboard: any[];
  }) => void;
  'chat:message': (data: { userId: string; displayName: string; message: string; timestamp: Date }) => void;
  'admin:live_update': (data: any) => void;
  'player:disconnected': (data: { userId: string; displayName: string }) => void;
  'player:reconnected': (data: { userId: string; displayName: string }) => void;
}

export interface ClientToServerEvents {
  'player:join_lobby': (data: { displayName: string; avatarKey: string }) => void;
  'player:ready': (data: { userId: string }) => void;
  'player:leave': (data: { userId: string }) => void;
  'player:submit_answer': (data: {
    gameSessionId: string;
    teamId: string;
    userId: string;
    stageId: string;
    questionId: string;
    answer: string;
    timeUsedSeconds: number;
  }) => void;
  'player:send_chat': (data: { message: string }) => void;
  'team:request_status': () => void;
  'admin:start_game': (data: { gameSessionId: string }) => void;
  'admin:pause_game': (data: { gameSessionId: string }) => void;
  'admin:resume_game': (data: { gameSessionId: string }) => void;
  'admin:end_game': (data: { gameSessionId: string }) => void;
  'admin:force_next_stage': (data: { gameSessionId: string }) => void;
}
