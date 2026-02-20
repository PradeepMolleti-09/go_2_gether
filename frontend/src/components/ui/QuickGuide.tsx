import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const QuickGuide = () => {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem("go2gether_guide_seen");
        if (!hasSeenGuide) {
            const timer = setTimeout(() => setShow(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const steps = [
        {
            title: "Welcome to Go2Gether!",
            description: "Your real-time group travel companion. Let's get you started with a quick tour of how to use this map interface.",
            icon: "🌍"
        },
        {
            title: "The Sidebar Menu",
            description: "Click the ☰ icon on the left (or hover on desktop) to access all features: Chat, Checkpoints, Members, and Trip Controls.",
            icon: "☰"
        },
        {
            title: "Voice Chat",
            description: "Stay connected! Open Chat and hold the 🎤 button to send a voice message. Incoming voice messages play automatically for everyone.",
            icon: "🎙️"
        },
        {
            title: "Real-time Tracking",
            description: "Start a trip as a leader to track distance and ETA. Everyone in the room will see movements live on the map.",
            icon: "🚀"
        }
    ];

    const handleClose = () => {
        setShow(false);
        localStorage.setItem("go2gether_guide_seen", "true");
    };

    const nextStep = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-black/90 p-8 shadow-2xl backdrop-blur-3xl"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/20 text-4xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                {steps[step].icon}
                            </div>
                            <h2 className="mb-3 text-xl font-black text-white">{steps[step].title}</h2>
                            <p className="mb-8 text-sm leading-relaxed text-neutral-400">
                                {steps[step].description}
                            </p>

                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={nextStep}
                                    className="w-full rounded-2xl bg-white py-4 text-sm font-black text-black transition-all hover:bg-neutral-200 active:scale-95"
                                >
                                    {step === steps.length - 1 ? "Get Started" : "Next Step"}
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="w-full py-2 text-xs font-bold text-neutral-500 hover:text-white"
                                >
                                    Skip Guide
                                </button>
                            </div>

                            <div className="mt-6 flex gap-1.5">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-indigo-500" : "w-1.5 bg-white/10"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
