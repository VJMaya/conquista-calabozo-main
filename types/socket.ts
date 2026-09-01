export interface ServerToClientEvents {
  'lobby:update': (data: {
    connectedPlayers: number;
    maxPlayers: number;
    minPlayers: number;
    players: Array<{ id: string; displayName: string; avatarKey: string; isConnected?: boolean; isReady?: boolean }>;
    status?: string;
  }) => void;
  'player:profile': (data: { userId: string }) => void;
  'team:assigned': (data: {
    teamId?: string;
    id?: string;
    teamName?: string;
    name?: string;
    members: Array<{
      id: string;
      displayName: string;
      avatarKey: string;
      isConnected?: boolean;
      answeredCount?: number;
      correctCount?: number;
    }>;
    totalCorrect?: number;
    completed?: boolean;
  }) => void;
  'game:started': (data: {
    gameSessionId?: string;
    teams?: Array<{ id: string; name: string; memberCount?: number }>;
    currentStage: number;
    totalStages?: number;
    totalQuestions?: number;
    startsAt: Date;
  }) => void;
  'question:show': (data: Record<string, unknown>) => void;
  'question:completed': (data: {
    questionId: string;
    timedOut: boolean;
    teamCorrect: boolean;
    correctAnswer: string;
    totalCorrect: number;
  }) => void;
  'team:finished': (data: {
    teamId: string;
    teamName: string;
    totalCorrect: number;
    totalTimeSeconds: number;
  }) => void;
  'game:paused': (data: { pausedAt: Date }) => void;
  'game:resumed': (data: { resumedAt: Date }) => void;
  'stage:started': (data: {
    stageNumber: number;
    title: string;
    visualTheme: string;
    timeLimitSeconds: number;
    question: unknown;
  }) => void;
  'answer:result': (data: {
    questionId: string;
    userAnswer?: string;
    isCorrect: boolean;
    timeUsed?: number;
    pointsAwarded: number;
    correctAnswer: string;
    answeredCount?: number;
    correctCount?: number;
  }) => void;
  'answer:status': (data: { playerName: string; isCorrect: boolean }) => void;
  'team:answer_status': (data: {
    teamId: string;
    answeredCount: number;
    memberCount: number;
  }) => void;
  'team:member_answered': (data: {
    teamId: string;
    userId: string;
    displayName: string;
    avatarKey: string;
    isCorrect: boolean;
    pointsAwarded: number;
    answeredCount: number;
    correctCount: number;
  }) => void;
  'leaderboard:update': (data: { entries: Array<Record<string, unknown>> }) => void;
  'leaderboard:show': (data: { entries: Array<Record<string, unknown>>; visible: boolean }) => void;
  'game:ended': (data: {
    reason?: string;
    winnerTeamId: string;
    winnerTeamName: string;
    finalLeaderboard: unknown[];
    results?: unknown;
  }) => void;
  'admin:live_update': (data: unknown) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'player:join_lobby': (data: { displayName: string; avatarKey: string; userId?: string }) => void;
  'player:ready': (data: { userId: string }) => void;
  'player:submit_answer': (data: {
    questionId: string;
    answer: string;
    timeUsedSeconds: number;
    teamId?: string;
    userId?: string;
  }) => void;
  'admin:join': () => void;
  'admin:start_game': (data?: { gameSessionId?: string }) => void;
  'admin:next_question': () => void;
  'admin:next_stage': () => void;
  'admin:show_leaderboard': () => void;
  'admin:end_game': (data?: { gameSessionId?: string }) => void;
  'admin:force_next_stage': (data?: { gameSessionId?: string }) => void;
  'leaderboard:request': () => void;
}
