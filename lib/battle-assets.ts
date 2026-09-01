/**
 * Optional local artwork for Conquest of the Dungeon.
 * Phase 6B renders CSS pixel placeholders. Drop webp files here later;
 * components must never depend on those files existing.
 */
export const BATTLE_ASSET_PATHS = {
  background: '/game-assets/backgrounds/dungeon-arena.webp',
  bosses: {
    idle: '/game-assets/bosses/dragon-idle.png',
    hit: '/game-assets/bosses/dragon-hit.png',
    dodge: '/game-assets/bosses/dragon-idle.png',
    defeated: '/game-assets/bosses/dragon-defeated.png',
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

/** Phase 6B: always use CSS placeholders so missing files cannot break the arena. */
export const USE_BATTLE_IMAGE_ASSETS = false;
