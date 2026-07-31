/**
 * Achievements (R18): unlocked the moment their condition holds, never
 * revoked. Conditions read only the Profile, so evaluation is a pure fold
 * that runs after every profile change (ui/store.ts centralizes the call).
 */
import { achievementId, type AchievementId } from "../ids";
import { DAILY_ID_PREFIX } from "../generation/generate";
import type { Profile } from "../profile";
import { areas } from "../curriculum/areas";
import { isLessonCleared } from "../curriculum/curriculum";
import { levelFromXp } from "./xp";

export interface AchievementDef {
  id: AchievementId;
  icon: string;
  name: string;
  description: string;
  isSatisfied(profile: Profile): boolean;
}

const goldCount = (profile: Profile) =>
  Object.values(profile.exerciseBests).filter((b) => b.medal === "gold").length;

export const achievementDefs: AchievementDef[] = [
  {
    id: achievementId("first-lesson"),
    icon: "🎈",
    name: "はじめての入園",
    description: "最初のレッスンをクリアする",
    isSatisfied: (p) => Object.keys(p.lessonClears).length >= 1,
  },
  {
    id: achievementId("first-gold"),
    icon: "💮",
    name: "初パーフェクトライド",
    description: "初めて金スタンプを押す",
    isSatisfied: (p) => goldCount(p) >= 1,
  },
  {
    id: achievementId("golds-10"),
    icon: "💎",
    name: "パーフェクト×10",
    description: "金スタンプを10個集める",
    isSatisfied: (p) => goldCount(p) >= 10,
  },
  {
    id: achievementId("streak-7"),
    icon: "🔥",
    name: "7日連続来園",
    description: "7日連続で遊びに来る",
    isSatisfied: (p) => p.streak.longest >= 7,
  },
  {
    id: achievementId("streak-30"),
    icon: "🎡",
    name: "30日連続来園",
    description: "30日連続で遊びに来る(成功条件のひとつ)",
    isSatisfied: (p) => p.streak.longest >= 30,
  },
  {
    // Legacy id from the ステージ era — persisted in profiles, never rename.
    id: achievementId("stage1-master"),
    icon: "🗺",
    name: "エントランス広場 制覇",
    description: "エントランス広場の全レッスンをクリアする",
    isSatisfied: (p) => {
      const area1 = areas[0];
      return (
        !!area1 &&
        area1.lessons.length > 0 &&
        area1.lessons.every((l) => isLessonCleared(p, l.id))
      );
    },
  },
  {
    id: achievementId("daily-debut"),
    icon: "🎪",
    name: "初デイリーライド",
    description: "デイリーチャレンジを初めてクリアする",
    isSatisfied: (p) =>
      Object.keys(p.exerciseBests).some((id) => id.startsWith(DAILY_ID_PREFIX)),
  },
  {
    id: achievementId("level-5"),
    icon: "🎟",
    name: "シーズンパス級",
    description: "レベル5に到達する",
    isSatisfied: (p) => levelFromXp(p.xp) >= 5,
  },
];

export interface AchievementOutcome {
  profile: Profile;
  newlyUnlocked: AchievementDef[];
}

/** Unlock every satisfied-but-not-yet-recorded achievement (R18). */
export function evaluateAchievements(
  profile: Profile,
  now: Date,
): AchievementOutcome {
  const newlyUnlocked = achievementDefs.filter(
    (def) =>
      profile.achievements[def.id] === undefined && def.isSatisfied(profile),
  );
  if (newlyUnlocked.length === 0) return { profile, newlyUnlocked };
  return {
    profile: {
      ...profile,
      achievements: {
        ...profile.achievements,
        ...Object.fromEntries(
          newlyUnlocked.map((def) => [def.id, { unlockedAt: now }]),
        ),
      },
    },
    newlyUnlocked,
  };
}
