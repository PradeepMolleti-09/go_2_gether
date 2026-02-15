import { useState } from "react";
import { useMapContext } from "../context/MapContext";
import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useSocket } from "../context/SocketContext";
import { checkpointService } from "../services/checkpointService";
import { ConfirmationModal } from "./ui/ConfirmationModal";

export const CheckpointsList = () => {
    const { checkpoints, setCheckpoints } = useMapContext();
    const { room } = useRoom();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { socket } = useSocket();

    const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isLeader = room?.leader?.id === user?.id;

    if (!checkpoints || checkpoints.length === 0) {
        return (
            <div className="bg-black/70 border border-white/10 rounded-[24px] p-3 backdrop-blur-3xl shadow-2xl pointer-events-auto h-full">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-2">
                    Checkpoints
                </h3>
                <p className="text-[11px] text-neutral-500 italic">No checkpoints active</p>
            </div>
        );
    }

    const handleDeleteCheckpoint = async () => {
        console.log("🔴 handleDeleteCheckpoint called");
        console.log("confirmDelete:", confirmDelete);
        console.log("isLeader:", isLeader);

        if (!confirmDelete || !isLeader) {
            console.log("❌ Early return - confirmDelete or isLeader check failed");
            return;
        }

        const { id: checkpointId, title } = confirmDelete;
        console.log("🎯 Deleting checkpoint:", { checkpointId, title });

        setIsDeleting(true);
        try {
            console.log("📡 Calling API to delete checkpoint...");
            await checkpointService.deleteCheckpoint(checkpointId);
            console.log("✅ API call successful");

            setCheckpoints(checkpoints.filter((cp) => cp._id !== checkpointId));
            console.log("✅ Local state updated");

            showNotification(`Checkpoint "${title}" removed`, "success");

            if (socket && room?._id) {
                console.log("📤 Emitting socket event");
                socket.emit("checkpoint:deleted", {
                    roomId: room._id,
                    checkpointId,
                });
            }
            setConfirmDelete(null);
            console.log("✅ Deletion complete");
        } catch (error) {
            console.error("❌ Failed to delete checkpoint:", error);
            showNotification("Failed to delete checkpoint. Please try again.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="bg-black/70 border border-white/10 rounded-[24px] p-3 backdrop-blur-3xl shadow-2xl pointer-events-auto h-full max-h-52 flex flex-col">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-4 flex items-center gap-2">
                    <span className="text-indigo-400">📍</span> Checkpoints ({checkpoints.length})
                </h3>
                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {checkpoints.map((checkpoint) => (
                        <div
                            key={checkpoint._id}
                            className="bg-white/5 border border-white/5 rounded-2xl p-3 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[12px] font-bold text-white truncate">
                                        {checkpoint.title}
                                    </h4>
                                    {(checkpoint as any).tag && (
                                        <p className="text-[10px] text-indigo-300 font-medium truncate mt-0.5 opacity-80">
                                            #{(checkpoint as any).tag}
                                        </p>
                                    )}
                                </div>
                                {isLeader && (
                                    <button
                                        onClick={() => {
                                            console.log("🔵 Remove button clicked for checkpoint:", checkpoint._id, checkpoint.title);
                                            setConfirmDelete({ id: checkpoint._id, title: checkpoint.title });
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 px-2 py-1 rounded-lg bg-red-500/20 text-[9px] font-bold text-red-400 hover:bg-red-500/30 flex-shrink-0"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                `}</style>
            </div>

            <ConfirmationModal
                isOpen={!!confirmDelete}
                title="Remove Checkpoint"
                message={`Are you sure you want to remove "${confirmDelete?.title}"? This will alert all participants.`}
                confirmLabel="Remove"
                cancelLabel="Keep it"
                isDestructive={true}
                isLoading={isDeleting}
                onConfirm={handleDeleteCheckpoint}
                onCancel={() => !isDeleting && setConfirmDelete(null)}
            />
        </>
    );
};
