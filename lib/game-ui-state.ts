export interface GameUiSnapshot {
  questionId: string;
  answered: boolean;
  waitingForTeam: boolean;
  teamFinished: boolean;
  selectedAnswer: string;
  remainingSeconds: number;
  feedback: {
    isCorrect: boolean;
    pointsAwarded: number;
    correctAnswer: string;
    userAnswer?: string;
    outcome?: 'correct' | 'incorrect' | 'timeout';
  } | null;
}

const STORAGE_PREFIX = 'cc-game-ui:';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadGameUiSnapshot(userId: string): GameUiSnapshot | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameUiSnapshot>;
    if (!parsed.questionId || typeof parsed.questionId !== 'string') return null;
    return {
      questionId: parsed.questionId,
      answered: Boolean(parsed.answered),
      waitingForTeam: Boolean(parsed.waitingForTeam),
      teamFinished: Boolean(parsed.teamFinished),
      selectedAnswer: typeof parsed.selectedAnswer === 'string' ? parsed.selectedAnswer : '',
      remainingSeconds: Number.isFinite(parsed.remainingSeconds) ? Number(parsed.remainingSeconds) : 0,
      feedback: parsed.feedback && typeof parsed.feedback === 'object' ? parsed.feedback : null,
    };
  } catch {
    return null;
  }
}

export function saveGameUiSnapshot(userId: string, snapshot: GameUiSnapshot): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(snapshot));
  } catch {
    // Ignore quota / private-mode failures; live socket state still works.
  }
}

export function clearGameUiSnapshot(userId: string): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore.
  }
}
