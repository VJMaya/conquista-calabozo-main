import type { AvatarClass } from '@/types/game';

export type CharacterVisualState = 'idle' | 'attacking' | 'successful-hit' | 'missed-attack';
export type BossVisualState = 'idle' | 'hit' | 'dodge' | 'defeated';
export type BattleEffectKind = 'none' | 'success' | 'critical' | 'miss' | 'timeout';
export type AttackStyle =
  | 'fairy-spark'
  | 'wizard-bolt'
  | 'knight-slash'
  | 'archer-arrow'
  | 'elf-strike'
  | 'dwarf-hammer';

export interface BattleMember {
  id: string;
  displayName: string;
  avatarKey: AvatarClass | string;
  isConnected: boolean;
  answeredCount: number;
  correctCount: number;
}

export interface BattleQuestion {
  id: string;
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  stageNumber?: number;
  stageTitle?: string;
  stageDescription?: string;
  questionNumber?: number;
  totalQuestions?: number;
  timeLimitSeconds: number;
}

export interface BattleFeedback {
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string;
  userAnswer?: string;
}

export interface BattleAnimEvent {
  key: string;
  userId: string;
  avatarKey: string;
  isCorrect: boolean;
  pointsAwarded: number;
  kind: 'success' | 'critical' | 'miss' | 'timeout';
  questionId?: string;
}

export interface BattleArenaProps {
  currentUserId: string;
  teamName: string;
  members: BattleMember[];
  question: BattleQuestion | null;
  remainingSeconds: number;
  answered: boolean;
  waitingForTeammates: boolean;
  teamFinished: boolean;
  currentRank?: number | null;
  stageNumber: number;
  questionNumber: number;
  totalQuestions?: number;
  totalStages?: number;
  feedback?: BattleFeedback | null;
  activeAnim?: BattleAnimEvent | null;
  bossHealthPercent: number;
  onSubmit: (letter: string) => void;
  onOpenRanking?: () => void;
}
