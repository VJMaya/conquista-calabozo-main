import type { AttackStyle, BattleAnimEvent } from '@/types/battle';

export const BATTLE_ANIM_MS = 500;
export const BATTLE_SEEN_LIMIT = 80;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function buildAnimKey(userId: string, questionId: string, source: string): string {
  return `${userId}::${questionId}::${source}`;
}

export function resolveAttackStyle(avatarKey: string): AttackStyle {
  switch (avatarKey) {
    case 'fairy':
      return 'fairy-spark';
    case 'wizard':
      return 'wizard-bolt';
    case 'knight':
      return 'knight-slash';
    case 'archer':
      return 'archer-arrow';
    case 'elf':
      return 'elf-strike';
    case 'dwarf':
      return 'dwarf-hammer';
    default:
      return 'knight-slash';
  }
}

export function createBattleAnimEvent(partial: Omit<BattleAnimEvent, 'key'> & { key?: string }): BattleAnimEvent {
  const key =
    partial.key ||
    buildAnimKey(partial.userId, partial.questionId || 'none', partial.kind);
  return { ...partial, key };
}

type QueueListener = (event: BattleAnimEvent | null) => void;

export class BattleAnimationQueue {
  private queue: BattleAnimEvent[] = [];
  private seen: string[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private current: BattleAnimEvent | null = null;
  private listeners = new Set<QueueListener>();
  private disposed = false;

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => {
      this.listeners.delete(listener);
    };
  }

  enqueue(event: BattleAnimEvent): void {
    if (this.disposed) return;
    if (this.seen.includes(event.key)) return;
    this.seen.push(event.key);
    if (this.seen.length > BATTLE_SEEN_LIMIT) {
      this.seen.splice(0, this.seen.length - BATTLE_SEEN_LIMIT);
    }
    this.queue.push(event);
    this.pump();
  }

  getCurrent(): BattleAnimEvent | null {
    return this.current;
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
    this.current = null;
    this.listeners.clear();
  }

  private emit(event: BattleAnimEvent | null): void {
    this.listeners.forEach((listener) => listener(event));
  }

  private pump(): void {
    if (this.disposed || this.current || this.queue.length === 0) return;
    const next = this.queue.shift();
    if (!next) return;
    this.current = next;
    this.emit(next);
    const duration = prefersReducedMotion() ? 80 : BATTLE_ANIM_MS;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.current = null;
      this.emit(null);
      this.pump();
    }, duration);
  }
}
