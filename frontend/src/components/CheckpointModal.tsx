import { useState, useEffect } from "react";
import { useMapContext } from "../context/MapContext";
import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useSocket } from "../context/SocketContext";
import { checkpointService } from "../services/checkpointService";

export const CheckpointModal = () => {
    const {
        pendingCheckpointLocation,
        setPendingCheckpointLocation,
        checkpointMode,
        setCheckpointMode,
        checkpoints,
        setCheckpoints,
    } = useMapContext();
    const { room } = useRoom();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { socket } = useSocket();
    const [title, setTitle] = useState("");
    const [tag, setTag] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const isLeader = room?.leader?.id === user?.id;

    useEffect(() => {
        // Reset form when modal closes
        if (checkpointMode === "none") {
            setTitle("");
            setTag("");
            setDescription("");
        }
    }, [checkpointMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !pendingCheckpointLocation) return;

        // Ensure only leader can submit (defensive)
        if (!isLeader) {
            showNotification("Only the trip leader can create checkpoints", "error");
            return;
        }

        // Debug logging
        console.log("Checkpoint creation - Room:", room);
        console.log("Checkpoint creation - activeTrip:", room?.activeTrip);

        // Use activeTrip if available, otherwise fall back to room ID
        const tripId = room?.activeTrip ? room.activeTrip : room?._id;
        if (!tripId) {
            showNotification("Unable to determine trip or room id for checkpoint", "error");
            return;
        }

        setLoading(true);
        try {
            const checkpoint = await checkpointService.createCheckpoint(
                tripId,
                {
                    title: title.trim(),
                    tag: tag.trim() || undefined,
                    description: description.trim() || undefined,
                    lat: pendingCheckpointLocation.lat,
                    lng: pendingCheckpointLocation.lng,
                }
            );

            console.log("Checkpoint created:", checkpoint);
            setCheckpoints([...checkpoints, checkpoint]);
            showNotification(`Checkpoint "${title}" created!`, "success");

            // Notify other room members via checkpoint event
            if (socket && room?._id) {
                console.log("Emitting checkpoint:created event");
                socket.emit("checkpoint:created", {
                    roomId: room._id,
                    checkpoint,
                });

                // Also send to chat
                const chatMessage = `📍 Checkpoint: ${title}${tag ? ` - ${tag}` : ""}`;
                console.log("Emitting chat message:", chatMessage);
                socket.emit("chat:message", {
                    roomId: room._id,
                    text: chatMessage,
                    userId: user?.id,
                    userName: user?.name,
                    userAvatar: user?.avatarUrl,
                    isCheckpointNotification: true,
                    checkpointId: checkpoint._id,
                    location: { lat: checkpoint.location.lat, lng: checkpoint.location.lng },
                });
                // Also dispatch a local event so the sender sees the message immediately
                try {
                    const payload = {
                        userId: user?.id,
                        userName: user?.name,
                        userAvatar: user?.avatarUrl,
                        text: chatMessage,
                        isCheckpointNotification: true,
                        checkpointId: checkpoint._id,
                        location: { lat: checkpoint.location.lat, lng: checkpoint.location.lng },
                        createdAt: Date.now(),
                    };
                    window.dispatchEvent(new CustomEvent("local-chat-message", { detail: payload }));
                } catch (err) {
                    console.warn("Failed to dispatch local chat event", err);
                }
            }

            setCheckpointMode("none");
            setPendingCheckpointLocation(null);
            setTitle("");
            setTag("");
            setDescription("");
        } catch (error: any) {
            console.error("Failed to create checkpoint:", error);
            const msg =
                error && typeof error === "object" && "message" in error
                    ? (error.message as string)
                    : String(error);
            showNotification(`Failed to create checkpoint: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCheckpointMode("none");
        setPendingCheckpointLocation(null);
        setTitle("");
        setTag("");
        setDescription("");
    };

    if (checkpointMode === "none" || !pendingCheckpointLocation) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            <div
                className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
            />
            <div className="pointer-events-auto flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/90 p-6 shadow-2xl backdrop-blur-xl w-full max-w-md">
                <h2 className="text-lg font-semibold text-white">Create Checkpoint</h2>

                {!isLeader && (
                    <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-200">
                        Only the trip leader can create checkpoints
                    </div>
                )}

                {isLeader && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">
                                Checkpoint Name *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Coffee Shop, Gas Station, Hotel"
                                className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder:text-neutral-500 outline-none border border-white/10 focus:border-white/30"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">
                                Tag/Note for Checkpoint
                            </label>
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                placeholder="e.g., Lets have dinner here, Good for photos"
                                className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder:text-neutral-500 outline-none border border-white/10 focus:border-white/30"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add notes about this checkpoint..."
                                className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder:text-neutral-500 outline-none border border-white/10 focus:border-white/30 resize-none h-20"
                                disabled={loading}
                            />
                        </div>

                        <div className="text-xs text-neutral-400">
                            📍 {pendingCheckpointLocation.lat.toFixed(4)},{" "}
                            {pendingCheckpointLocation.lng.toFixed(4)}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-white/10 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || loading}
                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>
                )}

                {!isLeader && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-white/10"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
