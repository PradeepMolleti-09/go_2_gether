const SOUNDS = {
    message: "https://assets.mixkit.co/active_storage/sfx/2355/2355-preview.mp3",
    checkpoint: "https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3",
    system: "https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3",
    alert: "https://assets.mixkit.co/active_storage/sfx/2555/2555-preview.mp3",
};

export type SoundType = keyof typeof SOUNDS;

const audioCache: Record<string, HTMLAudioElement> = {};

export const playSound = (type: SoundType) => {
    try {
        const url = SOUNDS[type];
        if (!audioCache[url]) {
            audioCache[url] = new Audio(url);
        }
        const audio = audioCache[url];
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch((err) => {
            console.warn("Audio playback failed (usually due to user interaction policy):", err);
        });
    } catch (err) {
        console.error("Error playing sound:", err);
    }
};
