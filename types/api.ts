// types/api.ts
import { z } from 'zod';

export const GuestLoginSchema = z.object({
  displayName: z.string().min(2).max(50),
  avatarKey: z.enum(['fairy', 'wizard', 'knight', 'archer', 'elf', 'dwarf']),
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const CreateSessionSchema = z.object({
  name: z.string().min(3).max(200),
  theme: z.string().default('Medieval Fantasy'),
  maxPlayers: z.number().int().min(10).max(200).default(200),
  minPlayers: z.number().int().min(10).default(10),
  teamSize: z.number().int().default(5),
  totalDurationMinutes: z.number().int().default(45),
  numberOfStages: z.number().int().default(10),
  allowIncompleteTeams: z.boolean().default(true),
});

export const CreateStageSchema = z.object({
  gameSessionId: z.string(),
  stageNumber: z.number().int().min(1).max(10),
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  visualTheme: z.string(),
  timeLimitSeconds: z.number().int().default(270),
  isActive: z.boolean().default(true),
});

export const CreateQuestionSchema = z.object({
  stageId: z.string(),
  questionType: z.enum(['multiple_choice', 'short_text', 'true_false']),
  questionText: z.string().min(5),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.string(),
  pointsBase: z.number().int().default(100),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const SubmitAnswerSchema = z.object({
  gameSessionId: z.string(),
  teamId: z.string(),
  userId: z.string(),
  stageId: z.string(),
  questionId: z.string(),
  answer: z.string(),
  timeUsedSeconds: z.number().int().min(0),
});

export type GuestLogin = z.infer<typeof GuestLoginSchema>;
export type AdminLogin = z.infer<typeof AdminLoginSchema>;
export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type CreateStage = z.infer<typeof CreateStageSchema>;
export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;
export type SubmitAnswer = z.infer<typeof SubmitAnswerSchema>;
