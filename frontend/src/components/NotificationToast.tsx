import { useNotification } from "../context/NotificationContext";

export const NotificationToast = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg backdrop-blur-xl animate-fadeIn border ${notification.type === "success"
                            ? "bg-green-500/90 border-green-600 text-white"
                            : notification.type === "error"
                                ? "bg-red-500/90 border-red-600 text-white"
                                : notification.type === "warning"
                                    ? "bg-yellow-500/90 border-yellow-600 text-white"
                                    : "bg-blue-500/90 border-blue-600 text-white"
                        }`}
                >
                    <span className="text-lg">
                        {notification.type === "success"
                            ? "✓"
                            : notification.type === "error"
                                ? "✕"
                                : notification.type === "warning"
                                    ? "⚠"
                                    : "ℹ"}
                    </span>
                    <span className="flex-1">{notification.message}</span>
                    <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-lg hover:opacity-70"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};
