/**
 * Retro sound effects, synthesized with WebAudio (no assets). Square waves =
 * 8-bit tone that matches the art direction. Sounds fire on rewarding moments
 * only (clear, lesson complete, achievement) — never per keystroke, so they
 * can't interfere with typing (非機能要件: 演出は入力をブロックしない).
 * Mute preference is a UI setting, not progress → localStorage, not Profile.
 */
const MUTE_KEY = "hjkland-muted";
let muted =
  typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
let context: AudioContext | null = null;

export const isMuted = () => muted;

export function toggleMuted(): boolean {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  return muted;
}

function beep(
  frequency: number,
  startAt: number,
  duration = 0.09,
  volume = 0.045,
) {
  if (!context) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  const t = context.currentTime + startAt;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(context.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function ensureContext(): boolean {
  if (muted) return false;
  // Created lazily on first play — by then a user gesture (keystroke/click)
  // has happened, so autoplay policy allows it.
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return true;
}

const NOTES = { C5: 523, E5: 659, G5: 784, C6: 1047, G4: 392, E4: 330 };

export function playClear(medal: "gold" | "silver" | "bronze"): void {
  if (!ensureContext()) return;
  if (medal === "gold") {
    // rising arpeggio — the perfect-ride fanfare
    beep(NOTES.C5, 0);
    beep(NOTES.E5, 0.08);
    beep(NOTES.G5, 0.16);
    beep(NOTES.C6, 0.24, 0.18, 0.05);
  } else if (medal === "silver") {
    beep(NOTES.E5, 0);
    beep(NOTES.G5, 0.09, 0.14);
  } else {
    beep(NOTES.G4, 0, 0.12);
  }
}

export function playLessonComplete(): void {
  if (!ensureContext()) return;
  beep(NOTES.G4, 0);
  beep(NOTES.C5, 0.09);
  beep(NOTES.E5, 0.18);
  beep(NOTES.G5, 0.27);
  beep(NOTES.C6, 0.36, 0.25, 0.05);
}

export function playUnlock(): void {
  if (!ensureContext()) return;
  beep(NOTES.E5, 0, 0.06);
  beep(NOTES.C6, 0.07, 0.16, 0.05);
}

/*
 * Practice BGM — a carousel-style chiptune waltz, synthesized like the SFX
 * (no assets). Runs off-thread on the WebAudio clock so it never blocks
 * typing; scheduled one loop at a time with a setTimeout rescheduler.
 * BGM has its own mute (separate from SFX): music taste ≠ effects taste.
 */
const BGM_KEY = "hjkland-bgm-muted";
let bgmMuted =
  typeof localStorage !== "undefined" && localStorage.getItem(BGM_KEY) === "1";
let bgmTimer: ReturnType<typeof setTimeout> | null = null;
let bgmGain: GainNode | null = null;

export const isBgmMuted = () => bgmMuted;

export function toggleBgm(): boolean {
  bgmMuted = !bgmMuted;
  localStorage.setItem(BGM_KEY, bgmMuted ? "1" : "0");
  if (bgmMuted) stopBgm();
  else startBgm();
  return bgmMuted;
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** One waltz loop: [beat, midiNote, duration(beats), voice]. 3/4 at 150bpm,
 * 8 bars — bass on 1, chord stabs on 2&3, a merry melody riding on top. */
const BGM_BEAT = 60 / 150;
const BGM_BARS = 8;
const BGM_SCORE: [number, number, number, "bass" | "chord" | "lead"][] =
  (() => {
    const score: [number, number, number, "bass" | "chord" | "lead"][] = [];
    // I - IV - V - I progression, twice (C F G C / C F G C)
    const bassLine = [48, 53, 55, 48, 48, 53, 55, 48]; // C3 F3 G3 C3 …
    const chordTones: Record<number, number[]> = {
      48: [60, 64], // C: C4 E4
      53: [60, 65], // F: C4 F4
      55: [59, 62], // G: B3 D4
    };
    bassLine.forEach((bass, bar) => {
      const start = bar * 3;
      score.push([start, bass, 0.9, "bass"]);
      for (const beat of [1, 2]) {
        for (const tone of chordTones[bass]!) {
          score.push([start + beat, tone, 0.45, "chord"]);
        }
      }
    });
    // Melody: quarter notes, one per beat (24 beats) — a simple carousel tune.
    const lead = [
      76, 79, 84, 79, 76, 79, 77, 81, 84, 81, 77, 81, 79, 83, 86, 83, 79, 83,
      84, 79, 76, 72, 76, 79,
    ];
    lead.forEach((note, beat) => score.push([beat, note, 0.8, "lead"]));
    return score;
  })();

function scheduleBgmLoop(loopStart: number): void {
  if (!context || !bgmGain) return;
  for (const [beat, note, durBeats, voice] of BGM_SCORE) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = voice === "lead" ? "triangle" : "square";
    osc.frequency.value = midi(note);
    const t = loopStart + beat * BGM_BEAT;
    const volume = voice === "lead" ? 0.028 : voice === "bass" ? 0.02 : 0.011;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durBeats * BGM_BEAT);
    osc.connect(gain).connect(bgmGain);
    osc.start(t);
    osc.stop(t + durBeats * BGM_BEAT);
  }
}

/** Start the practice BGM loop (no-op when BGM is muted or already playing). */
export function startBgm(): void {
  if (bgmMuted || bgmTimer !== null) return;
  if (!ensureContextForBgm()) return;
  bgmGain = context!.createGain();
  bgmGain.gain.value = 1;
  bgmGain.connect(context!.destination);
  const loopDur = BGM_BARS * 3 * BGM_BEAT;
  let nextLoop = context!.currentTime + 0.05;
  const pump = () => {
    scheduleBgmLoop(nextLoop);
    nextLoop += loopDur;
    // Re-arm well before the scheduled audio runs out.
    bgmTimer = setTimeout(pump, loopDur * 1000 - 250);
  };
  pump();
}

export function stopBgm(): void {
  if (bgmTimer !== null) {
    clearTimeout(bgmTimer);
    bgmTimer = null;
  }
  // Cut the whole music bus; scheduled oscillators die silently with it.
  bgmGain?.disconnect();
  bgmGain = null;
}

function ensureContextForBgm(): boolean {
  // Unlike SFX, BGM ignores the SFX mute — but shares the lazy context.
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return true;
}
