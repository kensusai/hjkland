/**
 * Curriculum types and unlock rules (docs/domain.md R5–R7).
 * Content is code-managed static data (docs/database.md); only clear records
 * are persisted. A lesson unlocks commands (R5); lessons within an area are
 * ordered and gate the next (R7); an area opens when the previous is cleared.
 */
import type { CommandId, LessonId } from "../ids";
import type { Exercise } from "../practice/exercise";
import type { Profile } from "../profile";

export interface Lesson {
  id: LessonId;
  title: string;
  /** Short teaching text shown before the exercises. */
  brief: string;
  /** Commands this lesson introduces and unlocks on clear (R5). */
  unlocks: CommandId[];
  /** Optional aside about modern editors, e.g. LazyVim (domain.md P9). */
  note?: string;
  /** エリア最後の総仕上げ: the UI stages a boss fight for these. */
  boss?: boolean;
  exercises: Exercise[];
}

export interface Area {
  id: string;
  /** 表示名。「絵文字 区画名 — 学習テーマ」の形(例: "🎈 エントランス広場 — 基本移動")。 */
  name: string;
  lessons: Lesson[];
}

/** Progress-derived status of a lesson on the world map. Pure guidance:
 * every lesson is playable at any time (R7) — "current" marks the
 * recommended next lesson, "upcoming" the not-yet-cleared rest. */
export type LessonStatus = "cleared" | "current" | "upcoming";

/** A lesson is cleared when the profile has a clear record for it (R5). */
export function isLessonCleared(profile: Profile, lessonId: LessonId): boolean {
  return profile.lessonClears[lessonId] !== undefined;
}

/**
 * Status of every lesson in an area — display guidance only, never a gate
 * (R7). The first not-yet-cleared lesson in curriculum order is "current"
 * (the recommended next); every other uncleared lesson is "upcoming". When
 * an earlier area still has uncleared lessons, this area's uncleared
 * lessons are all "upcoming" (the recommendation lives in that area).
 */
export function areaLessonStatuses(
  profile: Profile,
  areas: Area[],
  areaIndex: number,
): LessonStatus[] {
  const area = areas[areaIndex];
  if (!area) return [];
  const previousAreasCleared = areas
    .slice(0, areaIndex)
    .every((s) => s.lessons.every((l) => isLessonCleared(profile, l.id)));

  let foundCurrent = false;
  return area.lessons.map((lesson) => {
    if (isLessonCleared(profile, lesson.id)) return "cleared";
    if (previousAreasCleared && !foundCurrent) {
      foundCurrent = true;
      return "current";
    }
    return "upcoming";
  });
}

/** Commands unlocked so far, derived from clear records (R5, no separate store). */
export function unlockedCommands(
  profile: Profile,
  areas: Area[],
): Set<CommandId> {
  const unlocked = new Set<CommandId>();
  for (const area of areas) {
    for (const lesson of area.lessons) {
      if (isLessonCleared(profile, lesson.id)) {
        for (const command of lesson.unlocks) unlocked.add(command);
      }
    }
  }
  return unlocked;
}
