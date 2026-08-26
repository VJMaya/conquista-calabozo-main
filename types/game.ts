// types/game.ts
export type AvatarClass = 'fairy' | 'wizard' | 'knight' | 'archer' | 'elf' | 'dwarf';

export interface Player {
  id: string;
  displayName: string;
  avatarKey: AvatarClass;
  socketId?: string;
  isConnected: boolean;
  isReady?: boolean;
}

export interface GameTeam {
  id: string;
  name: string;
  members: Player[];
  currentStage: number;
  totalCorrect: number;
  totalTimeSeconds: number;
  finalScore: number;
}

export interface Question {
  id: string;
  stageId: string;
  questionType: 'multiple_choice' | 'short_text' | 'true_false';
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  pointsBase: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  imageUrl?: string;
}

export interface Stage {
  id: string;
  stageNumber: number;
  title: string;
  description?: string;
  visualTheme: string;
  timeLimitSeconds: number;
  isActive: boolean;
}

export interface PlayerAnswer {
  userId: string;
  questionId: string;
  answer: string;
  responseTimeSeconds: number;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface StageResult {
  stageNumber: number;
  question: Question;
  answers: Map<string, PlayerAnswer>;
  stageScore: number;
  completedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  totalCorrect: number;
  totalTimeSeconds: number;
  finalScore: number;
  currentStage: number;
}
