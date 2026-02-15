import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, ArrowRight, Copy, LogOut, Loader2 } from "lucide-react";
import { useRoom } from "../../context/RoomContext";
import { createRoomApi, joinRoomApi } from "../../services/roomService";
import { useNotification } from "../../context/NotificationContext";

export const RoomManager = () => {
    const { room, setRoom, clearRoom } = useRoom();
    const { showNotification } = useNotification();
    const [joinCode, setJoinCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"choice" | "join">("choice");

    const handleCreateRoom = async () => {
        setIsLoading(true);
        try {
            const newRoom = await createRoomApi();
            setRoom(newRoom, "leader");
            showNotification("Secure room created", "success");
        } catch (error) {
            showNotification("Failed to initialize room", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) return;
        setIsLoading(true);
        try {
            const joinedRoom = await joinRoomApi(joinCode.toUpperCase());
            setRoom(joinedRoom, "member");
            showNotification("Successfully joined voyage", "success");
        } catch (error) {
            showNotification("Invalid protocol code", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (room) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-auto w-full max-w-[280px] rounded-[32px] border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-3xl group"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Protocol Code</p>
                        <h3 className="text-3xl font-black tracking-tighter text-white tabular-nums">{room.code}</h3>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(room.code);
                            showNotification("Code synced to clipboard", "info");
                        }}
                        className="flex items-center justify-center gap-3 rounded-2xl bg-white/5 py-4 text-[11px] font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/10 active:scale-95 group/btn"
                    >
                        <Copy size={14} className="transition-transform group-hover/btn:scale-110" />
                        Copy Access Key
                    </button>
                    <button
                        onClick={clearRoom}
                        className="flex items-center justify-center gap-3 rounded-2xl bg-red-500/10 py-4 text-[11px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/20 active:scale-95"
                    >
                        <LogOut size={14} />
                        Terminate Session
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto w-[90vw] sm:w-auto sm:min-w-[380px] rounded-[32px] sm:rounded-[48px] border border-white/10 bg-black/40 p-6 sm:p-12 shadow-2xl backdrop-blur-3xl"
        >
            <AnimatePresence mode="wait">
                {mode === "choice" ? (
                    <motion.div
                        key="choice"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10"
                    >
                        <div className="text-center">
                            <h2 className="mb-2 text-3xl font-black tracking-tighter text-white">Start Expedition</h2>
                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Select your entry protocol</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleCreateRoom}
                                disabled={isLoading}
                                className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-[32px] bg-white p-8 transition-all hover:bg-neutral-100 disabled:opacity-50"
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
                                onClick={() => setMode("join")}
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
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <button
                                onClick={() => setMode("choice")}
                                className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors"
                            >
                                ← Go Back
                            </button>
                            <h2 className="mb-2 text-3xl font-black tracking-tighter text-white">Access Key</h2>
                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Enter the 6-digit sync code</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="SYNC-CODE"
                                value={joinCode}
                                maxLength={6}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="w-full rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center text-2xl font-black tracking-[0.5em] text-white outline-none ring-indigo-500/0 transition-all focus:border-indigo-500/50 focus:ring-[12px] focus:ring-indigo-500/10"
                            />
                            <button
                                onClick={handleJoinRoom}
                                disabled={isLoading || joinCode.length < 4}
                                className="group flex w-full items-center justify-center gap-4 rounded-3xl bg-indigo-600 py-6 text-sm font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] disabled:opacity-20 disabled:grayscale"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <span>Join Secure Room</span>}
                                {!isLoading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />}
                            </button>
                        </div>

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
