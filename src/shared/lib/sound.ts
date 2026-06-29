// Notification sound: plays a file URL if given, otherwise (or on failure) a generated
// Web Audio chime. Custom sounds: drop a file in `public/sounds/…` and pass its path,
// or set the relevant VITE_* env var. Browsers allow audio only after a user gesture.

function playChime(tones: number[]) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
    window.setTimeout(() => ctx.close().catch(() => {}), 700 + tones.length * 160);
  } catch {
    /* audio is best-effort */
  }
}

export function playSound(url?: string, fallbackTones: number[] = [880, 1175]) {
  if (url) {
    try {
      const audio = new Audio(url);
      const p = audio.play();
      if (p && typeof p.then === 'function') p.catch(() => playChime(fallbackTones));
      return;
    } catch {
      /* fall through to chime */
    }
  }
  playChime(fallbackTones);
}
