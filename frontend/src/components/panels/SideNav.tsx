import React, { useState } from "react";
import { useUI } from "../../context/UIContext";
import { useMapContext } from "../../context/MapContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";
import { MembersModal } from "../MembersModal";
import { GalleryModal } from "../media/GalleryModal";
import { RoomInfoModal } from "../RoomInfoModal";

import { uploadPhoto } from "../../services/mediaService";
import { startTripApi, endTripApi } from "../../services/roomService";

interface NavItem {
    id: string;
    label: string;
    icon: string;
    active?: boolean;
    onClick: () => void;
    accent?: boolean;
    disabled?: boolean;
}

export const SideNav = () => {
    const {
        lowBandwidth,
        toggleLowBandwidth,
        isChatOpen,
        toggleChat,
        unreadCount,
        theme,
        setTheme,
        isCheckpointsOpen,
        setIsCheckpointsOpen
    } = useUI();
    const {
        mapClickEnabled,
        setMapClickEnabled,
        checkpointMode,
        setCheckpointMode,
        destination,
        setDestination,
        checkpoints,
        setCheckpoints,
        setTripStats,
    } = useMapContext();
    const { room, role, setRoom } = useRoom();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showNotification } = useNotification();

    const [membersOpen, setMembersOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [tripInfoOpen, setTripInfoOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isLeader = room?.leader?.id === user?.id;
    const isOngoing = !!room?.activeTrip;

    const handleStartTrip = async () => {
        if (!room?._id) return;
        setIsLoading(true);
        try {
            const trip = await startTripApi(room._id);
            if (setRoom) {
                setRoom({ ...room, activeTrip: trip._id }, role);
            }
            setTripStats(prev => ({ ...prev, startTime: Date.now(), distanceTraveled: 0, checkpointsReached: 0 }));
            if (socket) {
                socket.emit("trip:started", { roomId: room._id });
            }
            showNotification("Trip started!", "success");
        } catch (error) {
            console.error("Failed to start trip:", error);
            showNotification("Failed to start trip", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndTrip = async () => {
        if (!room?._id) return;
        setIsLoading(true);
        try {
            await endTripApi(room._id);
            if (setRoom) {
                setRoom({ ...room, activeTrip: undefined }, role);
            }
            setTripStats(prev => ({ ...prev, endTime: Date.now() }));
            if (socket) {
                socket.emit("trip:ended", { roomId: room._id });
            }
            setDestination(null);
            setCheckpoints([]);
            showNotification("Trip ended", "info");
        } catch (error) {
            console.error("Failed to end trip:", error);
            showNotification("Failed to end trip", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const navItems: NavItem[] = [
        {
            id: "sos",
            label: "SOS",
            icon: "🚨",
            accent: true,
            onClick: () => {
                if (socket && room?._id) {
                    socket.emit("trip:sos", { roomId: room._id, reason: "manual" });
                    showNotification("SOS Alert Sent!", "error");
                }
            },
        },
        {
            id: "chat",
            label: "Chat",
            icon: "💬",
            active: isChatOpen,
            onClick: toggleChat,
        },
        {
            id: "checkpoints",
            label: `Checkpoints (${checkpoints?.length ?? 0})`,
            icon: "🚩",
            active: isCheckpointsOpen,
            onClick: () => setIsCheckpointsOpen(!isCheckpointsOpen),
        },
        {
            id: "members",
            label: `Members (${room?.members?.length ?? 0})`,
            icon: "👥",
            onClick: () => setMembersOpen(true),
        },
        {
            id: "gallery",
            label: "Gallery",
            icon: "🖼️",
            onClick: () => setGalleryOpen(true),
        },
        {
            id: "theme",
            label: theme === "dark" ? "Light Mode" : "Dark Mode",
            icon: theme === "dark" ? "☀️" : "🌙",
            onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
        },
        {
            id: "bandwidth",
            label: lowBandwidth ? "High Quality" : "Low Bandwidth",
            icon: lowBandwidth ? "📶" : "📵",
            active: lowBandwidth,
            onClick: toggleLowBandwidth,
        },
        {
            id: "mapMode",
            label: mapClickEnabled ? "Click mode" : "Search mode",
            icon: "📍",
            active: mapClickEnabled,
            onClick: () => setMapClickEnabled(!mapClickEnabled),
        },
    ];

    if (isLeader) {
        navItems.splice(1, 0, {
            id: "trip-toggle",
            label: isOngoing ? "End Trip" : "Start Trip",
            icon: isOngoing ? "🏁" : "🚀",
            onClick: isOngoing ? handleEndTrip : handleStartTrip,
            disabled: isLoading,
        });

        navItems.push({
            id: "checkpoint",
            label: "Checkpoint",
            icon: "🚩",
            active: checkpointMode === "create",
            onClick: () => setCheckpointMode(checkpointMode === "create" ? "none" : "create"),
        });

        if (destination) {
            navItems.push({
                id: "clearDest",
                label: "Clear Destination",
                icon: "✕",
                onClick: () => {
                    setDestination(null);
                    if (socket && room?._id) {
                        socket.emit("trip:destination", { roomId: room._id, destination: null });
                        socket.emit("trip:route", { roomId: room._id, routePath: null });
                    }
                    showNotification("Destination cleared", "info");
                },
            });
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const tripId = room?.activeTrip || room?._id;
        if (!file || !tripId) return;

        try {
            showNotification("Uploading photo...", "info");
            await uploadPhoto(tripId, file);
            showNotification("Photo uploaded successfully!", "success");
        } catch (err) {
            showNotification("Failed to upload photo", "error");
        } finally {
            e.target.value = "";
        }
    };

    if (room?.activeTrip) {
        navItems.push({
            id: "upload",
            label: "Upload Photo",
            icon: "📷",
            onClick: () => document.getElementById("nav-photo-upload")?.click(),
        });
    }

    return (
        <>
            <div className="pointer-events-none absolute left-4 top-40 md:top-1/2 z-30 flex md:-translate-y-1/2 flex-col items-start gap-2 md:gap-3 overflow-y-auto md:overflow-visible no-scrollbar pb-20 md:pb-0">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={`group pointer-events-auto relative flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl border transition-all duration-500 ease-in-out hover:scale-110 active:scale-95 disabled:opacity-50 ${item.active ? "bg-white/20 border-white/20 shadow-white/5" :
                            item.accent ? "bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500" : "bg-black/60 border-white/10 shadow-2xl backdrop-blur-3xl hover:bg-black/80"
                            }`}
                        title={item.label}
                    >
                        <span className={`text-base md:text-lg transition-all duration-500 ${item.accent ? "animate-pulse" : (item.active ? "scale-110 rotate-[360deg]" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100")}`}>
                            {item.icon}
                        </span>

                        {/* Unread Badge for Chat */}
                        {item.id === "chat" && unreadCount > 0 && (
                            <div className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[8px] md:text-[9px] font-black text-white shadow-lg animate-pulse border-2 border-black">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </div>
                        )}

                        {/* Tooltip - Hidden on mobile */}
                        <div className="hidden md:block absolute left-16 scale-0 bg-black/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg border border-white/10 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap shadow-2xl pointer-events-none">
                            {item.label}
                        </div>

                        {/* Selection Dot - Hidden on mobile */}
                        {item.active && (
                            <div className="hidden md:block absolute -left-1 h-6 w-1 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            <input
                id="nav-photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />

            <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)} />
            <GalleryModal
                tripId={room?.activeTrip || room?._id || null}
                open={galleryOpen}
                onClose={() => setGalleryOpen(false)}
            />
            <RoomInfoModal open={tripInfoOpen} onClose={() => setTripInfoOpen(false)} />
        </>
    );
};
