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
            id: "refresh",
            label: "Refresh",
            icon: "🔄",
            onClick: () => {
                window.location.reload();
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
            id: "trip-info",
            label: "Room Info",
            icon: "ℹ️",
            onClick: () => setTripInfoOpen(true),
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
            label: "Set Checkpoint",
            icon: "📍",
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

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <div
                className={`pointer-events-none absolute left-0 top-0 z-[60] flex h-full flex-col transition-all duration-500 ease-in-out md:left-4 md:top-1/2 md:h-auto md:-translate-y-1/2 md:gap-3
                    ${isExpanded ? "w-64 md:w-56" : "w-0 md:w-16"}
                `}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                {/* Mobile Toggle Button (Visible only on mobile when not expanded) */}
                {!isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="pointer-events-auto absolute left-4 top-24 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 shadow-2xl backdrop-blur-3xl md:hidden"
                    >
                        <span className="text-lg">☰</span>
                    </button>
                )}

                <div className={`pointer-events-auto flex h-full flex-col gap-2 overflow-y-auto overflow-x-hidden bg-black/90 p-4 shadow-2xl backdrop-blur-3xl transition-all duration-500 no-scrollbar md:h-auto md:rounded-3xl md:border md:border-white/10 md:bg-black/60
                    ${isExpanded ? "translate-x-0 opacity-100" : "-translate-x-full md:translate-x-0 md:opacity-100"}
                `}>
                    {/* Header for expanded view */}
                    {isExpanded && (
                        <div className="mb-4 flex items-center justify-between px-2 md:hidden">
                            <span className="text-xs font-black uppercase tracking-widest text-white/40">Menu</span>
                            <button onClick={() => setIsExpanded(false)} className="text-white/60 hover:text-white">✕</button>
                        </div>
                    )}

                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                item.onClick();
                                if (window.innerWidth < 768) setIsExpanded(false);
                            }}
                            disabled={item.disabled}
                            className={`group relative flex h-12 w-full shrink-0 items-center gap-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 
                                ${item.active
                                    ? "bg-indigo-500/20 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                    : item.accent
                                        ? "bg-red-500/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500/30"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                }
                                ${isExpanded ? "px-4" : "justify-center px-0"}
                            `}
                            title={isExpanded ? "" : item.label}
                        >
                            <div className="relative flex min-w-[24px] items-center justify-center">
                                <span className={`text-xl transition-all duration-500 ${item.accent ? "animate-pulse" : (item.active ? "scale-110" : "opacity-70 group-hover:opacity-100")}`}>
                                    {item.icon}
                                </span>

                                {/* Unread Badge for Chat in collapsed mode */}
                                {!isExpanded && item.id === "chat" && unreadCount > 0 && (
                                    <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-lg animate-pulse border border-black">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </div>
                                )}
                            </div>

                            {/* Label - visible when expanded */}
                            <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
                                <span className={`whitespace-nowrap text-sm font-bold tracking-wide ${item.active ? "text-white" : "text-white/80"}`}>
                                    {item.label}
                                </span>
                                {item.id === "chat" && unreadCount > 0 && isExpanded && (
                                    <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>

                            {/* Unread Badge for Chat (Alternative positioning if needed) */}
                            {item.id === "chat" && unreadCount > 0 && isExpanded && (
                                <div className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-lg animate-pulse">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </div>
                            )}

                            {/* Selection Marker */}
                            {item.active && (
                                <div className="absolute -left-1 h-6 w-1 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
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
