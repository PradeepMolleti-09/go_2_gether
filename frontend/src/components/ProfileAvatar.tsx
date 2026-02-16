import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRoom } from "../context/RoomContext";
import { ConfirmationModal } from "./ui/ConfirmationModal";

export const ProfileAvatar = () => {
    const { user, clearAuth } = useAuth();
    const { clearRoom } = useRoom();
    const [imageError, setImageError] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        // Clear all session data
        clearRoom();
        clearAuth();
        // Clear all destination and chat data
        window.localStorage.removeItem("go2gether_destination");
        window.localStorage.removeItem("go2gether_route_path");
        // Clear all chat messages (keys like go2gether_chat_*)
        Object.keys(window.localStorage).forEach((key) => {
            if (key.startsWith("go2gether_chat_")) {
                window.localStorage.removeItem(key);
            }
        });
        // Redirect to landing page
        window.location.href = "/";
    };

    const getInitials = (name?: string) => {
        if (!name) return "?";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (!user) return null;

    return (
        <div className="absolute top-4 right-4 z-30">
            <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-3 rounded-full bg-black/60 px-3 py-2 backdrop-blur-2xl hover:bg-black/80 transition-colors"
                title={user.name}
            >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg bg-indigo-500 flex items-center justify-center">
                    {user.avatarUrl && !imageError ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <span className="text-xs font-bold text-white">
                            {getInitials(user.name)}
                        </span>
                    )}
                </div>

                <span className="text-sm text-white font-medium hidden sm:inline">
                    {user.name}
                </span>
            </button>

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                title="Sign Out"
                message="Are you sure you want to log out? Your session data will be cleared."
                confirmLabel="Log Out"
                cancelLabel="Cancel"
                isDestructive={true}
                onConfirm={handleLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
};
