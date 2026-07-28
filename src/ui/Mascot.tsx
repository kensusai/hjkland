/**
 * The park guide "ヤンク" — a smooth-vector cat named after vim's yank
 * (design/mockups/mascot-candidates.html 案C) — and its speech bubble. A
 * cheerful guide who shows players around; lines are picked by the caller
 * (home greeting, clear celebration). Replaced the pixel-art モーション君
 * (owner feedback: マイクラぽい絵はやめる); the mood API is unchanged.
 */
export type MascotMood = "normal" | "hype" | "stern";

export function MascotSprite({
  mood = "normal",
  size = 112,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="92" rx="24" ry="5" fill="rgb(43 58 74 / 0.15)" />
      {/* the balloon comes out when celebrating */}
      {mood === "hype" && (
        <>
          <circle
            cx="78"
            cy="16"
            r="9"
            fill="#ff5a5a"
            stroke="#2b3a4a"
            strokeWidth="2.4"
          />
          <path
            d="M78 25 Q78 36 70 42"
            stroke="#2b3a4a"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
      {/* ears */}
      <path
        d="M26 34 Q21 12 41 20 Z"
        fill="#ffb84d"
        stroke="#2b3a4a"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M74 34 Q79 12 59 20 Z"
        fill="#ffb84d"
        stroke="#2b3a4a"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M29 29 Q26 19 37 23 Z" fill="#ff9d9d" />
      <path d="M71 29 Q74 19 63 23 Z" fill="#ff9d9d" />
      {/* head + muzzle */}
      <ellipse
        cx="50"
        cy="52"
        rx="30"
        ry="28"
        fill="#ffb84d"
        stroke="#2b3a4a"
        strokeWidth="3"
      />
      <ellipse cx="50" cy="64" rx="17" ry="12" fill="#fff2dd" />
      {/* whiskers */}
      <path
        d="M18 50 L30 52 M18 58 L30 57 M82 50 L70 52 M82 58 L70 57"
        stroke="#2b3a4a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* face by mood */}
      {mood === "hype" ? (
        <>
          <path
            d="M35 44 Q40 39 45 44"
            stroke="#2b3a4a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M56 44 Q61 39 66 44"
            stroke="#2b3a4a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="50"
            cy="58"
            rx="5"
            ry="6"
            fill="#c22f3d"
            stroke="#2b3a4a"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          {mood === "stern" && (
            <path
              d="M34 38 L45 41 M66 38 L55 41"
              stroke="#2b3a4a"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}
          <circle cx="40" cy="46" r="4.5" fill="#2b3a4a" />
          <circle cx="61" cy="46" r="4.5" fill="#2b3a4a" />
          <circle cx="41.4" cy="44.6" r="1.4" fill="#fff" />
          <circle cx="62.4" cy="44.6" r="1.4" fill="#fff" />
          {mood === "stern" ? (
            <path
              d="M46 58 L54 58"
              stroke="#2b3a4a"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M47 58 Q50 61 53 58"
              stroke="#2b3a4a"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </>
      )}
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
        <MascotSprite size={28} /> ヤンクのガイド
      </div>
      <p className="text-xl leading-relaxed text-cream-dim">
        {hint ??
          "バッファを GOAL と同じ形にすればパーフェクトライド! 迷ったら移動して x から始めよう。"}
      </p>
    </div>
  );
}
