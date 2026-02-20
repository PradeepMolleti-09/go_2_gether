import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, ArrowRight, Copy, LogOut, Loader2, User, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { createRoomApi, joinRoomApi } from "../../services/roomService";
import { useNotification } from "../../context/NotificationContext";

type Step = "name" | "choice" | "join";

export const RoomManager = () => {
    const { room, clearRoom, setRoom } = useRoom();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [step, setStep] = useState<Step>("name");
    const [displayName, setDisplayName] = useState(user?.name || "");
    const [joinCode, setJoinCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const handleCreateRoom = async () => {
        setIsLoading(true);
        try {
            const newRoom = await createRoomApi();
            setRoom(newRoom, "leader");
            showNotification(`Welcome, ${displayName}! Secure room created.`, "success");
        } catch {
            showNotification("Failed to initialize room", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRoom = async (codeToJoin?: string) => {
        const finalCode = (codeToJoin || joinCode).trim().toUpperCase();
        if (!finalCode) return;
        setIsLoading(true);
        try {
            const joinedRoom = await joinRoomApi(finalCode);
            setRoom(joinedRoom, "member");
            showNotification(`Welcome, ${displayName}! Joined voyage.`, "success");
            if (isScanning) stopScanner();
        } catch {
            showNotification("Invalid access code", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const startScanner = async () => {
        setIsScanning(true);
        setTimeout(() => {
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;
            scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // Expecting code or URL with code
                    const code = decodedText.length === 6 ? decodedText : decodedText.split("/").pop();
                    if (code && code.length === 6) {
                        handleJoinRoom(code);
                    }
                },
                () => { /* silent fail for frames */ }
            ).catch(err => {
                console.error(err);
                showNotification("Camera access denied", "error");
                setIsScanning(false);
            });
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current = null;
                setIsScanning(false);
            }).catch(console.error);
        } else {
            setIsScanning(false);
        }
    };

    // ── Active room card ──────────────────────────────────────────────────────
    if (room) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-auto w-full max-w-[320px] rounded-[32px] border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-3xl"
            >
                <div className="mb-6 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Protocol Code</p>
                    <h3 className="text-4xl font-black tracking-tighter text-white tabular-nums">{room.code}</h3>

                    <div className="mt-4 rounded-2xl bg-white p-3 shadow-xl">
                        <QRCodeCanvas value={room.code} size={140} level="H" />
                    </div>
                    <p className="mt-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Scan to join expedition</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(room.code);
                            showNotification("Code copied to clipboard", "info");
                        }}
                        className="flex items-center justify-center gap-3 rounded-2xl bg-white/5 py-4 text-[11px] font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/10 active:scale-95 border border-white/5"
                    >
                        <Copy size={14} />
                        Copy Access Key
                    </button>
                    <button
                        onClick={clearRoom}
                        className="flex items-center justify-center gap-3 rounded-2xl bg-red-500/10 py-4 text-[11px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/20 active:scale-95 border border-red-500/10"
                    >
                        <LogOut size={14} />
                        Leave Room
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── Pre-join flow ─────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto w-[92vw] sm:w-auto sm:min-w-[400px] rounded-[32px] sm:rounded-[48px] border border-white/10 bg-black/40 p-7 sm:p-12 shadow-2xl backdrop-blur-3xl"
        >
            <AnimatePresence mode="wait">

                {/* ── Step 1: Enter Name ── */}
                {step === "name" && (
                    <motion.div
                        key="name"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                                <User size={28} className="text-white" />
                            </div>
                            <h2 className="mb-2 text-3xl font-black tracking-tighter text-white">Your Name</h2>
                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">How should others see you?</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Enter your name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && displayName.trim() && setStep("choice")}
                                className="w-full rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center text-xl font-black text-white outline-none focus:border-indigo-500/50 focus:ring-[12px] focus:ring-indigo-500/10 transition-all"
                            />
                            <button
                                onClick={() => displayName.trim() && setStep("choice")}
                                disabled={!displayName.trim()}
                                className="group flex w-full items-center justify-center gap-4 rounded-3xl bg-indigo-600 py-5 text-sm font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] disabled:opacity-20 disabled:grayscale"
                            >
                                Continue
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Step 2: Create or Join ── */}
                {step === "choice" && (
                    <motion.div
                        key="choice"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Hey, {displayName}!</p>
                            <h2 className="mb-2 text-3xl font-black tracking-tighter text-white">Start Expedition</h2>
                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Select your entry protocol</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleCreateRoom}
                                disabled={isLoading}
                                className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-[32px] bg-white p-8 transition-all hover:bg-neutral-100 active:scale-98 disabled:opacity-50"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Plus size={28} />}
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-black text-black">Create New Room</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Initialize a new secure trip</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("join")}
                                className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 active:scale-98"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-transform group-hover:scale-110 duration-500">
                                    <Users size={28} />
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-black text-white">Join Expedition</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Enter an existing room code</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("name")}
                                className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors mt-2"
                            >
                                ← Change Name
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Step 3: Enter Code ── */}
                {step === "join" && (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <button
                                onClick={() => { if (isScanning) stopScanner(); setStep("choice"); }}
                                className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors"
                            >
                                ← Go Back
                            </button>
                            <h2 className="mb-2 text-3xl font-black tracking-tighter text-white">Access Key</h2>
                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Enter code or scan QR</p>
                        </div>

                        {/* Scanner View */}
                        {isScanning ? (
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-2">
                                <div id="reader" className="w-full overflow-hidden rounded-2xl" />
                                <button
                                    onClick={stopScanner}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 py-3 text-[10px] font-black uppercase tracking-widest text-red-500"
                                >
                                    Cancel Scan
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="SYNC-CODE"
                                        value={joinCode}
                                        maxLength={6}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === "Enter" && joinCode.length >= 4 && handleJoinRoom()}
                                        className="w-full rounded-3xl border border-white/10 bg-white/5 px-8 pt-6 pb-6 text-center text-3xl font-black tracking-[0.5em] text-white outline-none focus:border-indigo-500/50 focus:ring-[12px] focus:ring-indigo-500/10 transition-all"
                                    />
                                    <button
                                        onClick={startScanner}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-indigo-400 hover:bg-white/10 hover:text-indigo-300 transition-all"
                                        title="Scan QR"
                                    >
                                        <Camera size={24} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleJoinRoom()}
                                    disabled={isLoading || joinCode.length < 4}
                                    className="group flex w-full items-center justify-center gap-4 rounded-3xl bg-indigo-600 py-6 text-sm font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] disabled:opacity-20 disabled:grayscale"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <span>Join Secure Room</span>}
                                    {!isLoading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />}
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-indigo-500/40" />
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">End-to-End Encrypted Voyage</span>
                            <div className="h-1 w-1 rounded-full bg-indigo-500/40" />
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </motion.div>
    );
};
