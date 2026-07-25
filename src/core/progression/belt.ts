/**
 * Passport tiers (docs/domain.md 用語集: 帯 `Belt` — display renamed in the
 * hjkland rebrand). A flavorful label for the player's level, from a one-day
 * pass up to the legend pass. Pure mapping from level; XP/level rules live
 * in xp.ts. Code name Belt is kept so stored data and tests stay stable.
 */
const BELTS = [
  "ワンデーパス", // 1-2
  "ウィークパス", // 3-4
  "マンスリーパス", // 5-6
  "シーズンパス", // 7-8
  "年間パス", // 9-10
  "プレミア年パス", // 11-14
  "レジェンドパス", // 15+
] as const;

const THRESHOLDS = [1, 3, 5, 7, 9, 11, 15];

export function beltForLevel(level: number): string {
  let belt: string = BELTS[0];
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (level >= THRESHOLDS[i]!) belt = BELTS[i]!;
  }
  return belt;
}
