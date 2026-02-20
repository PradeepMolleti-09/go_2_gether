import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNotification } from "../context/NotificationContext";
import { ConfirmationModal } from "./ui/ConfirmationModal";
import { useState } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
}

export const MembersModal = ({ open, onClose }: Props) => {
    const { room, role } = useRoom();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showNotification } = useNotification();

    const [confirmKick, setConfirmKick] = useState<{ id: string; name: string } | null>(null);

    if (!open) return null;

    const members = room?.members ?? [];
    const leader = room?.leader;
    const isLeader = role === "leader" || room?.leader?.id === user?.id;

    const handleKick = () => {
        if (!socket || !room?._id || !confirmKick) return;
        socket.emit("room:kick", { roomId: room._id, targetUserId: confirmKick.id });
        showNotification(`${confirmKick.name} removed from room`, "info");
        setConfirmKick(null);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="pointer-events-auto relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-black/90 p-6 text-white shadow-2xl mx-4">

                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Room Crew</p>
                        <h3 className="text-xl font-black text-white">Members ({members.length})</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                    {/* Leader */}
                    {leader && (
                        <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-yellow-500/50 bg-indigo-500 flex items-center justify-center">
                                {leader.avatarUrl ? (
                                    <img src={leader.avatarUrl} alt={leader.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <span className="text-xs font-black text-white">{leader.name.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-white text-sm truncate">{leader.name}</p>
                                <span className="inline-block rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-black text-yellow-400 uppercase tracking-wider">
                                    👑 Leader
                                </span>
                            </div>
                            {leader.id === user?.id && (
                                <span className="text-[9px] text-white/30 font-bold uppercase">You</span>
                            )}
                        </div>
                    )}

                    {/* Members */}
                    {members.filter(m => m.id !== leader?.id).map((m) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 hover:bg-white/8 transition-all">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-indigo-500 flex items-center justify-center">
                                {m.avatarUrl ? (
                                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <span className="text-xs font-black text-white">{(m.name || "M").substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-neutral-200 text-sm truncate">{m.name}</p>
                                {m.id === user?.id && (
                                    <span className="text-[9px] text-white/30 font-bold uppercase">You</span>
                                )}
                            </div>
                            {/* Leader kick button */}
                            {isLeader && m.id !== user?.id && (
                                <button
                                    onClick={() => setConfirmKick({ id: m.id, name: m.name })}
                                    className="flex h-8 px-3 items-center justify-center rounded-xl bg-red-500/10 text-[9px] font-black uppercase tracking-wider text-red-500 transition-all hover:bg-red-500/20 active:scale-90"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    {members.length <= 1 && !members.some(m => m.id !== leader?.id) && (
                        <div className="py-8 text-center text-[11px] uppercase tracking-widest text-neutral-500">
                            No other members yet — share the room code!
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!confirmKick}
                title="Remove Member?"
                message={`Are you sure you want to remove ${confirmKick?.name} from this room?`}
                confirmLabel="Remove"
                cancelLabel="Cancel"
                isDestructive={true}
                onConfirm={handleKick}
                onCancel={() => setConfirmKick(null)}
            />
        </div>
    );
};

export default MembersModal;
