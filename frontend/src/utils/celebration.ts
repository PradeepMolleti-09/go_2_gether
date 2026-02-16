
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
    try {
        const audio = new Audio("/sound_effect.mp3");
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(err => console.warn("Celebration play failed:", err));

        // Stop after 8 seconds
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 8000);
    } catch (err) {
        console.error("Error playing celebration sound:", err);
    }
};
