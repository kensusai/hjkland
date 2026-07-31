// @vitest-environment jsdom
/**
 * Content verification (PLAN M6): every area-1 exercise is solvable, and its
 * par equals the recorded solution length (domain.md P4). This replays the
 * author's solution through the real vim engine and asserts:
 *   - the buffer reaches the target (solvable),
 *   - the solution uses exactly `par` keystrokes (par is achievable and tight),
 *   - the exercise only practices commands unlocked by its lesson or earlier.
 * If a par is wrong, this test fails loudly before players ever see it.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { installCodeMirrorDomStubs } from "./cmDomStubs";
import { commandId } from "../core/ids";
import { unlockedCommands } from "../core/curriculum/curriculum";
import { areas } from "../core/curriculum/areas";
import { initialProfile } from "../core/profile";
import { createVimEngine } from "./codeMirrorVimEngine";
import { replaySolution } from "./replaySolution";

beforeAll(installCodeMirrorDomStubs);

/** Solutions jsdom can't replay faithfully: j/k and { } need layout, R
 * overtypes only via real key events, / ? go through the search dialog, and
 * a Visual :s needs the dialog's automatic '<,'> range. Detected from the
 * solution tokens; ALL solutions are verified with real key events by
 * e2e/drive-content.mjs, which is the authoritative check. */
const needsRealBrowser = (solution: string[] | undefined): boolean =>
  !!solution?.some(
    (token) =>
      ["j", "k", "/", "?", "R", "{", "}"].includes(token) ||
      (token.startsWith(":") && solution.includes("V")),
  );

describe("authored content is solvable with correct pars", () => {
  for (const lesson of areas.flatMap((s) => s.lessons)) {
    for (const exercise of lesson.exercises) {
      const run = needsRealBrowser(exercise.solution) ? it.skip : it;
      run(`${exercise.id}: ${exercise.title}`, () => {
        const engine = createVimEngine(document.body);
        try {
          engine.reset(exercise.initialBuffer);
          const solution = exercise.solution;
          expect(
            solution,
            `no recorded solution for ${exercise.id}`,
          ).toBeDefined();
          replaySolution(engine, solution!);
          expect(engine.currentBuffer()).toBe(exercise.targetBuffer);
          // Par is the author's best keystroke count: an Ex-command token
          // like ":%s/a/b/g" is typed as its characters plus Enter.
          const parKeys = solution!.reduce(
            (n, token) => n + (token.startsWith(":") ? token.length + 1 : 1),
            0,
          );
          expect(parKeys).toBe(exercise.par);
        } finally {
          engine.destroy();
        }
      });
    }
  }
});

describe("authored areas respect the unlock constraint (R6)", () => {
  it("each exercise only practices commands unlocked by its lesson or earlier", () => {
    // Walk lessons in order, growing the unlocked set as we clear each.
    const cleared = {
      ...initialProfile,
      lessonClears: {} as Record<string, { clearedAt: Date }>,
    };
    for (const lesson of areas.flatMap((s) => s.lessons)) {
      // Commands this lesson introduces are available to its own exercises.
      cleared.lessonClears[lesson.id] = { clearedAt: new Date() };
      const available = unlockedCommands(cleared, areas);
      for (const exercise of lesson.exercises) {
        for (const cmd of exercise.practicedCommands) {
          // counts (e.g. "3") are keystrokes, not gated commands; skip pure digits.
          if (/^\d+$/.test(cmd)) continue;
          expect(
            available.has(cmd) || cmd === commandId("x"),
            `${exercise.id} practices ${cmd} before it is unlocked`,
          ).toBe(true);
        }
      }
    }
  });
});
