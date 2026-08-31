import { QUESTIONS_PER_STAGE, STAGES as PACK_STAGES, TOTAL_STAGES, type PackStage } from './pack';
import { QUESTIONS } from './questions';

export type GameStage = PackStage;

export const STAGES: GameStage[] = PACK_STAGES;

export { TOTAL_STAGES };

export function getStageByNumber(stageNumber: number): GameStage | undefined {
  return STAGES.find((stage) => stage.stageNumber === stageNumber);
}

export function getStageNumberForQuestionIndex(questionIndex: number): number {
  return Math.floor(questionIndex / QUESTIONS_PER_STAGE) + 1;
}

export function getFirstQuestionIndexForStage(stageNumber: number): number {
  return (stageNumber - 1) * QUESTIONS_PER_STAGE;
}

export function countQuestionsInStage(stageNumber: number): number {
  return QUESTIONS.filter((question) => question.stageNumber === stageNumber).length;
}
