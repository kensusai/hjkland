/**
 * Drill screen: five generated exercises weighted toward weak commands
 * (R19, P6). Completing the session counts as the day's learning activity.
 */
import { useEffect, useRef, useState } from "react";
import { weakCommands } from "../core/analytics/weakness";
import {
  applyPracticeAttempt,
  recordLearningActivity,
} from "../core/applyProgress";
import { unlockedCommands } from "../core/curriculum/curriculum";
import { areas } from "../core/curriculum/areas";
import { generateDrill } from "../core/generation/generate";
import type { Exercise } from "../core/practice/exercise";
import type { Medal } from "../core/practice/medal";
import {
  PracticePlayer,
  ResultFooter,
  RESULT_SHORT,
  ResultHeadline,
  StreakChip,
  type FinishedInfo,
} from "./PracticePlayer";
import { useAppStore } from "./storeContext";

type State =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; exercises: Exercise[] };

export function DrillScreen() {
  const store = useAppStore((s) => s.store);
  const clock = useAppStore((s) => s.clock);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const navigate = useAppStore((s) => s.navigate);
  const [state, setState] = useState<State>({ status: "loading" });
  const [lastXp, setLastXp] = useState(0);
  const [bounty, setBounty] = useState<(Medal | null)[]>([]);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const attempts = await store.loadAttempts(); // analytics path, not boot
      if (cancelled) return;
      const exercises = generateDrill({
        seed: clock.now().getTime().toString(),
        unlocked: unlockedCommands(profileRef.current, areas),
        weakCommands: weakCommands(attempts),
      });
      setBounty(exercises.map(() => null));
      setState(
        exercises.length === 0
          ? { status: "unavailable" }
          : { status: "ready", exercises },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [clock, store]);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center font-mono text-cream-faint">
        ローディング<span className="blink">▮</span>
      </main>
    );
  }
  if (state.status === "unavailable") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 font-mono">
        <p>ドリルは最初のレッスンをクリアするとオープンする。</p>
        <button
          type="button"
          className="btn-chunky border-b-[6px] border-shu-dark bg-shu px-8 py-3 font-black text-[#fff6ec]"
          onClick={() => navigate({ screen: "home" })}
        >
          パークへ
        </button>
      </main>
    );
  }

  const onAttemptFinished = (info: FinishedInfo) => {
    void store.appendAttempt(info.attempt);
    const practice = applyPracticeAttempt(profileRef.current, info.attempt);
    let next = practice.profile;
    if (info.isLastExercise) {
      next = recordLearningActivity(next, info.attempt.playedAt).profile;
    }
    if (next !== profileRef.current) setProfile(next);
    setLastXp(practice.xpGained);
    // onAttemptFinished only fires for cleared attempts, and a clear always
    // carries a medal (bronze at worst) — abandoned retries never reach here.
    const medal = info.attempt.medal;
    if (medal) {
      setBounty((b) => b.map((r, i) => (i === info.exerciseIndex ? medal : r)));
    }
  };

  return (
    <PracticePlayer
      exercises={state.exercises}
      source="drill"
      headerLeft={
        <>
          <button
            type="button"
            onClick={() => navigate({ screen: "home" })}
            className="text-sm text-cream-faint hover:text-cream"
          >
            ← マップ
          </button>
          <span className="border-2 border-ink px-2 text-[0.625rem] tracking-widest text-shu">
            ドリル · 5連続ライド
          </span>
        </>
      }
      sidePanel={({ exercise: playing }) => {
        // The player's LIVE exercise decides the highlight — the first
        // unbeaten bounty drifts to the next enemy when a beaten one is
        // being retried.
        const currentEnemy = state.exercises.indexOf(playing);
        return (
          <div className="pixel-panel p-4">
            <div className="mb-3 font-mono text-xs font-black tracking-[0.2em] text-shu">
              🎫 ライドチケット — {bounty.filter(Boolean).length}/
              {state.exercises.length} クリア
            </div>
            <div className="flex flex-col gap-2">
              {state.exercises.map((ex, i) => {
                const result = bounty[i];
                const isCurrent = i === currentEnemy;
                return (
                  <div
                    key={ex.id}
                    className={`flex items-center gap-3 border-2 px-3 py-1.5 font-mono text-sm ${
                      isCurrent
                        ? "border-shu bg-[#241512]"
                        : result
                          ? "border-ink opacity-60"
                          : "border-ink-bold opacity-40"
                    }`}
                  >
                    <span className="text-xl">{result ? "💥" : "👾"}</span>
                    <span
                      className={`font-black ${isCurrent ? "text-shu" : "text-cream-dim"} ${result ? "line-through" : ""}`}
                    >
                      {ex.practicedCommands.slice(0, 4).join(" ")}
                    </span>
                    {isCurrent && (
                      <span className="blink ml-auto text-[0.625rem] text-gold">
                        ◀ いまここ
                      </span>
                    )}
                    {result && (
                      <span className="ml-auto text-[0.625rem] font-black text-matcha">
                        {RESULT_SHORT[result]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {playing.hint && (
              <p className="mt-3 border-t-2 border-ink pt-2 text-sm text-cream-dim">
                💡 {playing.hint}
              </p>
            )}
          </div>
        );
      }}
      onAttemptFinished={onAttemptFinished}
      renderResult={(info, controls) => (
        <DrillResult
          info={info}
          xpGained={lastXp}
          bounty={bounty}
          onRetry={controls.retry}
          onNext={
            info.isLastExercise
              ? () => navigate({ screen: "home" })
              : controls.advance
          }
        />
      )}
    />
  );
}

function DrillResult({
  info,
  xpGained,
  bounty,
  onRetry,
  onNext,
}: {
  info: FinishedInfo;
  xpGained: number;
  bounty: (Medal | null)[];
  onRetry: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <ResultHeadline attempt={info.attempt} />
      {info.isLastExercise && (
        <>
          <div className="mt-3 font-mono font-black text-matcha">
            5連続ライド、完走!! 記録:
          </div>
          <div className="mt-2 flex justify-center gap-2 font-mono text-sm font-black">
            {bounty.map((r, i) =>
              r ? (
                <span
                  key={i}
                  className="border-2 border-matcha-dim px-2 py-0.5 text-matcha"
                >
                  {RESULT_SHORT[r]}
                </span>
              ) : (
                <span
                  key={i}
                  className="border-2 border-ink-bold px-2 py-0.5 text-cream-faint"
                >
                  💨
                </span>
              ),
            )}
          </div>
        </>
      )}
      <ResultFooter
        xpGained={xpGained}
        primaryLabel={info.isLastExercise ? "パークへ ▶" : "次のライド ▶"}
        onPrimary={onNext}
        onRetry={onRetry}
        extraChips={info.isLastExercise ? <StreakChip /> : undefined}
      />
    </>
  );
}
