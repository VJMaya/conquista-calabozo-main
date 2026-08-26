// lib/scoring.ts

/**
 * Calculate individual points for a correct answer
 * @param pointsBase Base points from the question (default 100)
 * @param timeLimitSeconds Total time limit for the stage
 * @param responseTimeSeconds Time taken by the user to respond
 * @returns Points awarded to the individual
 */
export function calculateIndividualPoints(
  isCorrect: boolean,
  pointsBase: number,
  timeLimitSeconds: number,
  responseTimeSeconds: number
): number {
  if (!isCorrect) {
    return 0;
  }

  const timeBonus = Math.max(0, timeLimitSeconds - responseTimeSeconds);
  return pointsBase + timeBonus;
}

/**
 * Calculate team score for a stage
 * @param individualPoints Array of individual points from each team member
 * @returns Total team score for the stage
 */
export function calculateStageScore(individualPoints: number[]): number {
  return individualPoints.reduce((sum, points) => sum + points, 0);
}

/**
 * Calculate final team score with bonuses
 * @param totalStagePoints Sum of all stage points
 * @param completedAllStages Whether team completed all 10 stages
 * @param timeRemainingSeconds Time remaining when completed
 * @returns Final team score with bonuses
 */
export function calculateFinalScore(
  totalStagePoints: number,
  completedAllStages: boolean,
  timeRemainingSeconds: number
): number {
  let finalScore = totalStagePoints;

  if (completedAllStages) {
    finalScore += 1000; // Completion bonus
  }

  if (timeRemainingSeconds > 0 && completedAllStages) {
    finalScore += timeRemainingSeconds * 2; // Time bonus
  }

  return finalScore;
}

/**
 * Normalize answer for comparison
 * @param answer The answer to normalize
 * @returns Normalized answer
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Check if answer is correct
 * @param submittedAnswer Answer submitted by user
 * @param correctAnswer Correct answer from question
 * @param questionType Type of question
 * @returns Whether the answer is correct
 */
export function isAnswerCorrect(
  submittedAnswer: string,
  correctAnswer: string,
  questionType: 'multiple_choice' | 'short_text' | 'true_false'
): boolean {
  if (questionType === 'multiple_choice' || questionType === 'true_false') {
    // For multiple choice and true/false, check exact match (case-insensitive)
    return normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer);
  }

  if (questionType === 'short_text') {
    // For short text, allow fuzzy matching
    return normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer);
  }

  return false;
}

/**
 * Compare two leaderboard entries for sorting
 * Criteria:
 * 1. Higher score
 * 2. More correct answers
 * 3. Lower total time
 * 4. Higher team size (more full participation)
 * @returns Comparison result for sort function
 */
export function compareLeaderboardEntries(
  a: {
    finalScore: number;
    totalCorrect: number;
    totalTimeSeconds: number;
    teamSize: number;
  },
  b: {
    finalScore: number;
    totalCorrect: number;
    totalTimeSeconds: number;
    teamSize: number;
  }
): number {
  // 1. Higher score wins
  if (a.finalScore !== b.finalScore) {
    return b.finalScore - a.finalScore;
  }

  // 2. More correct answers wins
  if (a.totalCorrect !== b.totalCorrect) {
    return b.totalCorrect - a.totalCorrect;
  }

  // 3. Lower time wins
  if (a.totalTimeSeconds !== b.totalTimeSeconds) {
    return a.totalTimeSeconds - b.totalTimeSeconds;
  }

  // 4. Higher team participation wins
  return b.teamSize - a.teamSize;
}
