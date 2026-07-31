import { describe, expect, it } from "vitest";
import { commandId, lessonId } from "../ids";
import { initialProfile, type Profile } from "../profile";
import { areaLessonStatuses, unlockedCommands } from "./curriculum";
import { markLessonCleared } from "./markLessonCleared";
import { areas } from "./areas";

const clearLessons = (...ids: string[]): Profile => ({
  ...initialProfile,
  lessonClears: Object.fromEntries(
    ids.map((id) => [lessonId(id), { clearedAt: new Date("2026-07-11") }]),
  ),
});

// R7: statuses are guidance, never a gate — every lesson is always playable.
describe("areaLessonStatuses (R7)", () => {
  it("recommends the first uncleared lesson; the rest are upcoming", () => {
    const statuses = areaLessonStatuses(initialProfile, areas, 0);
    expect(statuses[0]).toBe("current");
    expect(statuses[1]).toBe("upcoming");
    expect(statuses.at(-1)).toBe("upcoming");
  });

  it("advances the recommendation as lessons are cleared", () => {
    const profile = clearLessons("s1-l1-x", "s1-l2-hl");
    const statuses = areaLessonStatuses(profile, areas, 0);
    expect(statuses[0]).toBe("cleared");
    expect(statuses[1]).toBe("cleared");
    expect(statuses[2]).toBe("current");
    expect(statuses[3]).toBe("upcoming");
  });

  it("keeps the single recommendation in the earliest incomplete area", () => {
    // Area 1 is incomplete → area 2 has no "current", only upcoming ones.
    const statuses = areaLessonStatuses(clearLessons("s1-l1-x"), areas, 1);
    expect(statuses.every((s) => s === "upcoming")).toBe(true);
  });

  it("shows out-of-order clears as cleared even in later areas", () => {
    // Free roam: an area-2 lesson cleared while area 1 is unfinished still
    // reads as cleared on the map (and its commands unlock via R5).
    const statuses = areaLessonStatuses(clearLessons("s2-l1-dw"), areas, 1);
    expect(statuses[0]).toBe("cleared");
    expect(statuses[1]).toBe("upcoming");
  });
});

describe("unlockedCommands (R5)", () => {
  it("is empty initially and grows with cleared lessons", () => {
    expect(unlockedCommands(initialProfile, areas).size).toBe(0);
    const profile = clearLessons("s1-l1-x", "s1-l2-hl");
    const unlocked = unlockedCommands(profile, areas);
    expect(unlocked.has(commandId("x"))).toBe(true);
    expect(unlocked.has(commandId("h"))).toBe(true);
    expect(unlocked.has(commandId("l"))).toBe(true);
    expect(unlocked.has(commandId("w"))).toBe(false); // lesson 4, not cleared
  });
});

describe("markLessonCleared (R5 unlock, R16 XP-once)", () => {
  it("records the clear and grants lesson XP on first clear", () => {
    const { profile, xpGained, firstClear } = markLessonCleared(
      initialProfile,
      lessonId("s1-l1-x"),
      new Date("2026-07-11T20:00:00"),
    );
    expect(firstClear).toBe(true);
    expect(xpGained).toBe(20);
    expect(profile.xp).toBe(20);
    expect(profile.lessonClears[lessonId("s1-l1-x")]).toBeDefined();
  });

  it("does not grant XP or overwrite on a re-clear (R16)", () => {
    const once = markLessonCleared(
      initialProfile,
      lessonId("s1-l1-x"),
      new Date("2026-07-11T20:00:00"),
    ).profile;
    const again = markLessonCleared(
      once,
      lessonId("s1-l1-x"),
      new Date("2026-07-12T20:00:00"),
    );
    expect(again.xpGained).toBe(0);
    expect(again.firstClear).toBe(false);
    expect(again.profile.xp).toBe(20);
    expect(
      again.profile.lessonClears[lessonId("s1-l1-x")]?.clearedAt.toISOString(),
    ).toBe(new Date("2026-07-11T20:00:00").toISOString()); // unchanged
  });
});
