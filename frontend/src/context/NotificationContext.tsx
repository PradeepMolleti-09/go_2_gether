import {
    createContext,
    useContext,
    useState,
    type ReactNode,
    useCallback,
} from "react";
import { playSound, type SoundType } from "../utils/sounds";

export interface Notification {
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    duration?: number;
}

interface NotificationContextValue {
    notifications: Notification[];
    showNotification: (
        message: string,
        type?: "success" | "error" | "info" | "warning",
        duration?: number,
        sound?: SoundType
    ) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
    undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showNotification = useCallback(
        (
            message: string,
            type: "success" | "error" | "info" | "warning" = "info",
            duration = 3000,
            sound?: SoundType
        ) => {
            const id = `${Date.now()}-${Math.random()}`;
            setNotifications((prev) => [...prev, { id, message, type, duration }]);

            // Play sound
            if (sound) {
                playSound(sound);
            } else {
                // Default sound mapping
                if (type === "success") playSound("checkpoint");
                else if (type === "error") playSound("alert");
                else playSound("system");
            }

            if (duration > 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, duration);
            }
        },
        [removeNotification]
    );

    return (
        <NotificationContext.Provider
            value={{ notifications, showNotification, removeNotification }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error("useNotification must be used within NotificationProvider");
    }
    return ctx;
};
