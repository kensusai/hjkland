/**
 * Full-content verification drive: replays EVERY authored exercise's 模範解答
 * in a real browser with REAL key events (page.keyboard), engine-direct.
 * This is the browser-side complement of src/vim/stageContent.test.ts —
 * display-line j/k, R overtype and the / ? search dialog cannot be driven in
 * jsdom, so the browserOnly exercises are only provable here. Asserts, per
 * exercise: the solution reaches the target buffer and its keystroke count
 * equals `par` (domain.md P4; an Ex token ":cmd" costs its length + Enter).
 *
 * Run: npm run dev (another shell) then `node e2e/drive-content.mjs`.
 */
import { chromium } from "playwright";
import { BASE } from "./lib.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();
const log = (...a) => console.log("[content]", ...a);

await page.goto(BASE);
await page.evaluate(async () => {
  const { createVimEngine } = await import("/src/vim/codeMirrorVimEngine.ts");
  const host = document.createElement("div");
  document.body.appendChild(host);
  window.__engine = createVimEngine(host);
});

const exercises = await page.evaluate(async () => {
  const { stages } = await import("/src/core/curriculum/stages.ts");
  return stages.flatMap((s) =>
    s.lessons.flatMap((l) =>
      l.exercises.map((e) => ({
        id: e.id,
        initial: e.initialBuffer,
        target: e.targetBuffer,
        par: e.par,
        solution: e.solution ?? null,
      })),
    ),
  );
});

const KEYMAP = {
  "<Esc>": "Escape",
  "<CR>": "Enter",
  " ": "Space",
  "<C-v>": "Control+v",
};
const failures = [];
for (const exercise of exercises) {
  if (!exercise.solution) {
    failures.push(`${exercise.id}: no recorded solution`);
    continue;
  }
  await page.evaluate((b) => {
    window.__engine.reset(b);
    window.__engine.focus();
  }, exercise.initial);
  let par = 0;
  for (const token of exercise.solution) {
    if (token.startsWith(":")) {
      for (const ch of token)
        await page.keyboard.press(ch === " " ? "Space" : ch);
      await page.keyboard.press("Enter");
      par += token.length + 1;
    } else {
      await page.keyboard.press(KEYMAP[token] ?? token);
      par += 1;
    }
  }
  await page.waitForTimeout(15);
  const got = await page.evaluate(() => window.__engine.currentBuffer());
  if (got !== exercise.target) {
    failures.push(
      `${exercise.id}: solution missed target\n  got:    ${JSON.stringify(got)}\n  wanted: ${JSON.stringify(exercise.target)}`,
    );
  }
  if (par !== exercise.par) {
    failures.push(
      `${exercise.id}: par ${exercise.par} != solution cost ${par}`,
    );
  }
}

log(`replayed ${exercises.length} exercises with real key events`);
for (const failure of failures) log("FAIL", failure);
await browser.close();
if (failures.length > 0) throw new Error(`${failures.length} exercises failed`);
log("all authored solutions verified in the browser ✓");
