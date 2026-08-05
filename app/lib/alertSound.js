"use client";

// Synthesized alarm tone for the critical-alert popup — no binary asset
// needed, just WebAudio oscillators. A high-low-high "siren" beep, ~0.6s.

export function playCriticalAlertSound() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const now = ctx.currentTime;

  const tone = (freq, start, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration);
  };

  tone(1046, 0, 0.18);
  tone(784, 0.2, 0.18);
  tone(1046, 0.4, 0.18);

  // Browsers cap concurrent AudioContexts, so close this one once its tones
  // are done rather than leaking one per repeat.
  setTimeout(() => {
    ctx.close().catch(() => {});
  }, 900);
}
