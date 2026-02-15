import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRoom } from "../context/RoomContext";
import { joinRoomApi } from "../services/roomService";
import { useNotification } from "../context/NotificationContext";

export const JoinRoom = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setRoom } = useRoom();
    const { showNotification } = useNotification();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const performJoin = async () => {
            if (!user) {
                // Not logged in, redirect to landing with state to join later
                showNotification("Please login to join the trip", "info");
                navigate("/", { replace: true });
                return;
            }

            if (!code) {
                navigate("/", { replace: true });
                return;
            }

            try {
                const room = await joinRoomApi(code);
                setRoom(room, "member");
                showNotification(`Joined trip ${code}!`, "success");
                navigate("/trip", { replace: true });
            } catch (err: any) {
                console.error("Join failed:", err);
                setError(err.message || "Failed to join room");
                showNotification("Invalid or expired invite link", "error");
                setTimeout(() => navigate("/", { replace: true }), 3000);
            }
        };

        performJoin();
    }, [code, user, navigate, setRoom, showNotification]);

    return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
            <div className="text-center">
                {!error ? (
                    <>
                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
                        <h2 className="text-xl font-medium">Joining trip...</h2>
                        <p className="text-sm text-neutral-400 mt-2">Preparing your map</p>
                    </>
                ) : (
                    <>
                        <div className="mb-4 text-4xl">⚠️</div>
                        <h2 className="text-xl font-medium text-red-400">Join Failed</h2>
                        <p className="text-sm text-neutral-400 mt-2">{error}</p>
                        <p className="text-xs text-neutral-500 mt-4 italic">Redirecting you back...</p>
                    </>
                )}
            </div>
        </div>
    );
};
