/**
 * The pixel-art park guide "モーション君" — a cat with a balloon
 * (design/mockups/rebrand-hjkland.html) — and its speech bubble. A cheerful
 * guide who shows players around; lines are picked by the caller (home
 * greeting, clear celebration). Replaced the dojo sensei in the hjkland
 * rebrand; the mood API is unchanged.
 */
export type MascotMood = "normal" | "hype" | "stern";

export function MascotSprite({
  mood = "normal",
  size = 112,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  // Mouth opens for hype; a flat brow line for stern (thinking hard).
  const mouth =
    mood === "hype" ? (
      <rect x="8" y="9" width="3" height="2" fill="#c22f3d" />
    ) : mood === "stern" ? (
      <rect x="8" y="10" width="3" height="1" fill="#8a5a2b" />
    ) : (
      <rect x="8" y="9" width="2" height="1" fill="#8a5a2b" />
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* balloon on a string (raised paw when hyped) */}
      {mood === "hype" && (
        <>
          <rect x="15" y="1" width="3" height="4" fill="#ff5a5a" />
          <rect x="16" y="5" width="1" height="4" fill="#2b3a4a" />
          <rect x="14" y="9" width="2" height="2" fill="#ffb84d" />
        </>
      )}
      {/* ears */}
      <rect x="5" y="2" width="2" height="2" fill="#ffb84d" />
      <rect x="12" y="2" width="2" height="2" fill="#ffb84d" />
      {/* head */}
      <rect x="4" y="4" width="11" height="7" fill="#ffb84d" />
      {/* eyes (a lowered brow for stern) */}
      {mood === "stern" && (
        <>
          <rect x="6" y="5" width="2" height="1" fill="#8a5a2b" />
          <rect x="11" y="5" width="2" height="1" fill="#8a5a2b" />
        </>
      )}
      <rect x="6" y="6" width="2" height="2" fill="#253244" />
      <rect x="11" y="6" width="2" height="2" fill="#253244" />
      {mouth}
      {/* whiskers */}
      <rect x="2" y="7" width="2" height="1" fill="#e59a2f" />
      <rect x="15" y="7" width="2" height="1" fill="#e59a2f" />
      {/* body + stripe */}
      <rect x="5" y="11" width="9" height="5" fill="#ffd9a1" />
      <rect x="5" y="12" width="9" height="1" fill="#ffb84d" />
      {/* paws */}
      <rect x="5" y="16" width="3" height="3" fill="#ffb84d" />
      <rect x="11" y="16" width="3" height="3" fill="#ffb84d" />
      {/* tail */}
      <rect x="14" y="12" width="2" height="2" fill="#ffb84d" />
      <rect x="15" y="10" width="2" height="2" fill="#ffb84d" />
    </svg>
  );
}

export function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-4 inline-block rounded-xl border-3 border-ink bg-paper px-5 py-3 font-black text-paper-ink shadow-[3px_3px_0_rgb(43_58_74/0.35)]">
      <span
        aria-hidden="true"
        className="absolute -left-2.5 top-4 border-6 border-transparent border-r-ink"
      />
      {children}
    </div>
  );
}

/** Guide panel for generated exercises (daily/drill screens). */
export function GuideHintPanel({ hint }: { hint?: string | undefined }) {
  return (
    <div className="pixel-panel p-4">
      <div className="mb-2 flex items-center gap-2 font-mono text-sm font-black tracking-[0.2em] text-matcha-dim">
        <MascotSprite size={28} /> モーション君のガイド
      </div>
      <p className="text-xl leading-relaxed text-cream-dim">
        {hint ??
          "バッファを GOAL と同じ形にすればパーフェクトライド! 迷ったら移動して x から始めよう。"}
      </p>
    </div>
  );
}
