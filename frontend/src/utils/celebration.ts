
// Celebration confetti logic
export const triggerCelebration = () => {
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
        const particleCount = 50;
        // Since particles fall down, start a bit higher than random
        // @ts-ignore
        if (window.confetti) {
            // @ts-ignore
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            // @ts-ignore
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }
    }, 250);

    setTimeout(() => clearInterval(interval), 3000);
};

export const playCelebrationSound = () => {
    // Simple synthesized fanfare using Web Audio API to avoid external assets for now
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Notes: C4, E4, G4, C5 (Simple C Major arpeggio)
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.15;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
    });
};
