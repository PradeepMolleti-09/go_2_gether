import React from "react";
import { useRoom } from "../context/RoomContext";

interface Props {
    open: boolean;
    onClose: () => void;
}

export const MembersModal = ({ open, onClose }: Props) => {
    const { room } = useRoom();

    if (!open) return null;

    const members = room?.members ?? [];
    const leader = room?.leader;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="pointer-events-auto z-50 w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-4 text-white">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">Room members ({members.length})</div>
                    <button className="text-xs text-neutral-300 hover:text-white" onClick={onClose}>Close</button>
                </div>

                <div className="flex flex-col gap-3">
                    {leader && (
                        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-yellow-500/50 shadow-lg bg-indigo-500 flex items-center justify-center">
                                {leader.avatarUrl ? (
                                    <img
                                        src={leader.avatarUrl}
                                        alt={leader.name}
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement?.classList.add('bg-indigo-500');
                                            const initial = document.createElement('span');
                                            initial.className = "text-xs font-bold text-white";
                                            initial.innerText = leader.name.substring(0, 2).toUpperCase();
                                            (e.target as HTMLImageElement).parentElement?.appendChild(initial);
                                        }}
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-white">
                                        {leader.name.substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-white">
                                    {leader.name}
                                    <span className="ml-2 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-bold text-yellow-300 uppercase tracking-wider">
                                        Leader
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {members.filter(m => m.id !== leader?.id).map((m) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-indigo-500 flex items-center justify-center">
                                {m.avatarUrl ? (
                                    <img
                                        src={m.avatarUrl}
                                        alt={m.name}
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement?.classList.add('bg-indigo-500');
                                            const initial = document.createElement('span');
                                            initial.className = "text-xs font-bold text-white";
                                            initial.innerText = m.name.substring(0, 2).toUpperCase();
                                            (e.target as HTMLImageElement).parentElement?.appendChild(initial);
                                        }}
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-white">
                                        {(m.name || "M").substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 text-sm font-medium text-neutral-200">
                                {m.name}
                            </div>
                        </div>
                    ))}

                    {!members.length && (
                        <div className="py-8 text-center text-[11px] uppercase tracking-widest text-neutral-500">
                            No other members yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MembersModal;
