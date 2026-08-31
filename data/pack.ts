import pack from './pack.json';

export type AnswerLetter = 'A' | 'B' | 'C' | 'D';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface PackStage {
  id: string;
  stageNumber: number;
  title: string;
  description: string;
  visualTheme: string;
  timeLimitSeconds: number;
}

export interface PackQuestion {
  id: string;
  stageNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerLetter;
  pointsBase: number;
  timeLimitSeconds: number;
  difficulty: QuestionDifficulty;
}

export interface PackConstants {
  QUESTIONS_PER_STAGE: number;
  TOTAL_STAGES: number;
  TOTAL_QUESTIONS: number;
  PLAYERS_PER_TEAM: number;
  MAX_PLAYERS: number;
  MAX_TEAMS: number;
  MIN_PLAYERS_TO_START: number;
}

export interface ContentPack {
  constants: PackConstants;
  teamNames: string[];
  stages: PackStage[];
  questions: PackQuestion[];
}

const contentPack = pack as unknown as ContentPack;

export const TEAM_NAMES: string[] = contentPack.teamNames;
export const STAGES: PackStage[] = contentPack.stages;
export const QUESTIONS: PackQuestion[] = contentPack.questions;

export const QUESTIONS_PER_STAGE = contentPack.constants.QUESTIONS_PER_STAGE;
export const TOTAL_STAGES = contentPack.constants.TOTAL_STAGES;
export const TOTAL_QUESTIONS = contentPack.constants.TOTAL_QUESTIONS;
export const PLAYERS_PER_TEAM = contentPack.constants.PLAYERS_PER_TEAM;
export const MAX_PLAYERS = contentPack.constants.MAX_PLAYERS;
export const MAX_TEAMS = contentPack.constants.MAX_TEAMS;
export const MIN_PLAYERS_TO_START = contentPack.constants.MIN_PLAYERS_TO_START;

export default contentPack;
