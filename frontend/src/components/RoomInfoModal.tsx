import { useState } from "react";
import { useRoom } from "../context/RoomContext";
import { useMapContext } from "../context/MapContext";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { transferLeadershipApi } from "../services/roomService";
import { QRCodeCanvas } from "qrcode.react";
import { Share2 } from "lucide-react";

interface RoomInfoModalProps {
    open: boolean;
    onClose: () => void;
}

export const RoomInfoModal = ({ open, onClose }: RoomInfoModalProps) => {
    const { room, clearRoom, setRoom } = useRoom();
    const { destination } = useMapContext();
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [isTransferring, setIsTransferring] = useState(false);

    if (!open || !room) return null;

    const isLeader = room.leader.id === user?.id;
    const otherMembers = room.members.filter((m) => m.id !== room.leader.id);

    const joinUrl = `${window.location.origin}/join/${room.code}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(room.code);
        showNotification("Room code copied!", "success");
    };

    const copyLinkToClipboard = () => {
        navigator.clipboard.writeText(joinUrl);
        showNotification("Join link copied!", "success");
    };

    const handleTransferLeadership = async () => {
        if (!selectedMemberId || !room) return;

        setIsTransferring(true);
        try {
            const updatedRoom = await transferLeadershipApi(room._id, selectedMemberId);
            setRoom(updatedRoom, updatedRoom.leader.id === user?.id ? "leader" : "member");
            showNotification("Leadership transferred successfully!", "success");
            setSelectedMemberId("");
        } catch (error) {
            console.error("Failed to transfer leadership:", error);
            showNotification("Failed to transfer leadership", "error");
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 bg-neutral-900 shadow-2xl">
                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            Trip Details
                        </h2>
                        {destination ? (
                            <p className="mt-1 text-sm text-blue-400 font-medium line-clamp-2 px-4">
                                📍 {destination.description}
                            </p>
                        ) : (
                            <p className="mt-1 text-sm text-neutral-400">
                                Share this to invite others
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-8">
                        {/* QR Code */}
                        <div className="group relative overflow-hidden rounded-3xl border-4 border-white/5 bg-white p-3 shadow-2xl transition-transform hover:scale-105">
                            <QRCodeCanvas
                                value={joinUrl}
                                size={160}
                                level="H"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                <p className="text-xs font-medium text-white">Scan to Join</p>
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                    Room Code
                                </label>
                                <div
                                    onClick={copyToClipboard}
                                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
                                >
                                    <span className="text-xl font-mono font-bold tracking-[0.2em] text-white">
                                        {room.code}
                                    </span>
                                    <svg
                                        className="h-5 w-5 text-neutral-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                    Invite Link
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={copyLinkToClipboard}
                                        className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition-transform active:scale-95"
                                    >
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (navigator.share) {
                                                try {
                                                    await navigator.share({
                                                        title: 'Join Go2Gether',
                                                        text: `Join my trip on Go2Gether! Code: ${room.code}`,
                                                        url: joinUrl,
                                                    });
                                                } catch (err) {
                                                    if ((err as Error).name !== 'AbortError') {
                                                        copyLinkToClipboard();
                                                    }
                                                }
                                            } else {
                                                copyLinkToClipboard();
                                            }
                                        }}
                                        className="flex aspect-square items-center justify-center rounded-2xl bg-indigo-500/10 px-4 text-indigo-400 transition-all hover:bg-indigo-500/20 active:scale-95"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-white/5 pt-6 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {room.members.slice(0, 3).map((member) => (
                                    <div
                                        key={member.id}
                                        className="h-8 w-8 overflow-hidden rounded-full border-2 border-neutral-900 bg-neutral-800"
                                    >
                                        {member.avatarUrl ? (
                                            <img
                                                src={member.avatarUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-white">
                                                {member.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {room.members.length > 3 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-900 bg-neutral-800 text-[10px] text-white">
                                        +{room.members.length - 3}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-neutral-400">
                                <span className="font-bold text-white">
                                    {room.members.length}
                                </span>{" "}
                                participants exploring together
                            </p>
                        </div>

                        {/* Transfer Leadership Section - Only for Leader */}
                        {isLeader && otherMembers.length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                                    Transfer Leadership
                                </h3>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedMemberId}
                                        onChange={(e) => setSelectedMemberId(e.target.value)}
                                        className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                        disabled={isTransferring}
                                    >
                                        <option value="">Select new leader...</option>
                                        {otherMembers.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleTransferLeadership}
                                        disabled={!selectedMemberId || isTransferring}
                                        className="rounded-xl bg-indigo-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isTransferring ? "..." : "Transfer"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                onClose();
                                clearRoom();
                                showNotification("Session terminated", "info");
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500/20 active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Terminate Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
