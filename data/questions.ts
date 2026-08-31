import {
  QUESTIONS as PACK_QUESTIONS,
  QUESTIONS_PER_STAGE,
  TOTAL_QUESTIONS,
  type PackQuestion,
  type QuestionDifficulty,
} from './pack';

export type { QuestionDifficulty };

export type GameQuestion = PackQuestion;

export const QUESTIONS: GameQuestion[] = PACK_QUESTIONS;

export { QUESTIONS_PER_STAGE, TOTAL_QUESTIONS };

export function getQuestionById(questionId: string): GameQuestion | undefined {
  return QUESTIONS.find((question) => question.id === questionId);
}

export function getQuestionsByStage(stageNumber: number): GameQuestion[] {
  return QUESTIONS.filter((question) => question.stageNumber === stageNumber);
}

export function getQuestionAtIndex(index: number): GameQuestion | undefined {
  return QUESTIONS[index];
}

export function toPublicQuestion(question: GameQuestion, questionIndex: number) {
  return {
    id: question.id,
    stageNumber: question.stageNumber,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    pointsBase: question.pointsBase,
    timeLimitSeconds: question.timeLimitSeconds,
    difficulty: question.difficulty,
    questionType: 'multiple_choice' as const,
    questionNumber: questionIndex + 1,
    totalQuestions: TOTAL_QUESTIONS,
  };
}
