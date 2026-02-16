const SOUNDS = {
    message: "/correct-bell-twinkle-jam-fx-1-00-05.mp3",
    checkpoint: "/notification-bells-sms-received-jam-fx-medium-1-00-01.mp3",
    system: "/correct-bell-twinkle-jam-fx-1-00-05.mp3",
    alert: "/alarm-warning-beeps-ra-music-1-00-02.mp3",
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
