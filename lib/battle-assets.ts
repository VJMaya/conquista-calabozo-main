/**
 * Optional local artwork for Conquest of the Dungeon.
 * Phase 6B renders CSS pixel placeholders. Drop webp files here later;
 * components must never depend on those files existing.
 */
export const BATTLE_ASSET_PATHS = {
  background: '/game-assets/backgrounds/dungeon-arena.png',
  bosses: {
    idle: '/game-assets/bosses/dragon-idle.webp',
    hit: '/game-assets/bosses/dragon-hit.webp',
    dodge: '/game-assets/bosses/dragon-idle.webp',
    defeated: '/game-assets/bosses/dragon-defeated.webp',
  },
  characters: {
    fairy: { idle: '/game-assets/characters/fairy-idle.webp', attack: '/game-assets/characters/fairy-attack.webp' },
    wizard: { idle: '/game-assets/characters/wizard-idle.webp', attack: '/game-assets/characters/wizard-attack.webp' },
    knight: { idle: '/game-assets/characters/knight-idle.webp', attack: '/game-assets/characters/knight-attack.webp' },
    archer: { idle: '/game-assets/characters/archer-idle.webp', attack: '/game-assets/characters/archer-attack.webp' },
    elf: { idle: '/game-assets/characters/elf-idle.webp', attack: '/game-assets/characters/elf-attack.webp' },
    dwarf: { idle: '/game-assets/characters/dwarf-idle.webp', attack: '/game-assets/characters/dwarf-attack.webp' },
  },
  effects: {
    successfulHit: '/game-assets/effects/successful-hit.webp',
    miss: '/game-assets/effects/miss.webp',
  },
} as const;

export const HERO_PORTRAIT_PATHS: Record<string, string> = {
  fairy: '/game-assets/characters/fairy-clean.png',
  wizard: '/game-assets/characters/wizard-clean.png',
  knight: '/game-assets/characters/knight-clean.png',
  archer: '/game-assets/characters/archer-clean.png',
  elf: '/game-assets/characters/elf-clean.png',
  dwarf: '/game-assets/characters/dwarf-clean.png',
};

export function resolveHeroPortrait(avatarKey: string): string | null {
  return HERO_PORTRAIT_PATHS[avatarKey] ?? null;
}

/** Phase 6B: always use CSS placeholders so missing files cannot break the arena. */
export const USE_BATTLE_IMAGE_ASSETS = false;

export type BossPhase = 1 | 2 | 3;

/** Phase mapping is driven by the question number, not by boss health. */
export function resolveBossPhase(questionNumber: number): BossPhase {
  if (!Number.isFinite(questionNumber) || questionNumber <= 10) return 1;
  if (questionNumber <= 20) return 2;
  return 3;
}

export const BOSS_PHASE_CLASS: Record<BossPhase, string> = {
  1: 'phase-i',
  2: 'phase-ii',
  3: 'phase-iii',
};

/** 0 = front line, 1 = mid line, 2 = back line. */
export const FORMATION_ROW: Record<string, number> = {
  knight: 0,
  dwarf: 0,
  wizard: 1,
  archer: 1,
  fairy: 2,
  elf: 2,
};

export function formationRank(avatarKey: string): number {
  const row = FORMATION_ROW[avatarKey];
  return row === undefined ? 1 : row;
}

/** Melee classes take the front slots, casters the middle, support the back. */
export function orderPartyForFormation<T extends { avatarKey: string }>(members: T[]): T[] {
  return members
    .map((member, index) => ({ member, index }))
    .sort((a, b) => {
      const rankDiff = formationRank(a.member.avatarKey) - formationRank(b.member.avatarKey);
      return rankDiff !== 0 ? rankDiff : a.index - b.index;
    })
    .map((entry) => entry.member);
}
