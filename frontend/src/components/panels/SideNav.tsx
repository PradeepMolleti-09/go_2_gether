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
            {/* Desktop SideNav - Vertical Pill Style from Image */}
            <div
                className={`hidden md:flex pointer-events-none absolute left-6 top-1/2 z-50 -translate-y-1/2 flex-col items-center`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className={`pointer-events-auto flex flex-col items-center gap-2 overflow-hidden rounded-[44px] border border-white/5 bg-black/85 py-3 px-2 shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${isExpanded ? "w-52" : "w-[64px]"}
                `}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`group relative flex h-[50px] w-full shrink-0 items-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 disabled:opacity-50 rounded-[28px]
                                ${item.active ? "bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "hover:bg-white/5"}
                                ${isExpanded ? "px-5 gap-4" : "justify-center"}
                            `}
                        >
                            <span className={`text-xl leading-none transition-all duration-300
                                ${item.accent
                                    ? "drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                                    : item.active
                                        ? "scale-110 opacity-100"
                                        : "opacity-55 group-hover:opacity-100 group-hover:scale-110"
                                }`}>
                                {item.icon}
                            </span>

                            <span className={`whitespace-nowrap text-[10px] font-black uppercase tracking-[0.18em] text-white/70 transition-all duration-500
                                ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 absolute pointer-events-none"}
                            `}>
                                {item.label}
                            </span>

                            {item.id === "chat" && unreadCount > 0 && (
                                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-lg animate-pulse border border-black">
                                    {unreadCount}
                                </div>
                            )}

                            {/* Tooltip shown only when collapsed */}
                            {!isExpanded && (
                                <div className="pointer-events-none absolute left-[72px] z-50 scale-0 rounded-xl border border-white/10 bg-black/95 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all duration-200 group-hover:scale-100">
                                    {item.label}
                                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 h-2 w-2 rotate-45 border-l border-b border-white/10 bg-black/95" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile UI Controls */}
            <div className="md:hidden pointer-events-none fixed left-4 top-24 z-50 flex flex-col gap-2">
                {/* Menu Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-black/70 shadow-2xl backdrop-blur-3xl transition-all active:scale-90"
                >
                    <span className="text-lg text-white">{isExpanded ? "✕" : "☰"}</span>
                </button>

                {/* Mobile Chat Button - Below Menu */}
                <button
                    onClick={toggleChat}
                    className={`pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-[18px] border bg-black/70 shadow-2xl backdrop-blur-3xl transition-all active:scale-90 ${isChatOpen ? "bg-indigo-500/20 border-indigo-500/40" : "border-white/10"}`}
                >
                    <span className="text-xl">💬</span>
                    {unreadCount > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg animate-pulse border-2 border-black">
                            {unreadCount}
                        </div>
                    )}
                </button>

                {/* Expanded Mobile Menu */}
                {isExpanded && (
                    <div className="pointer-events-auto flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/90 p-2 shadow-2xl backdrop-blur-3xl">
                        {navItems.filter(i => i.id !== 'chat').map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { item.onClick(); setIsExpanded(false); }}
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-all active:scale-90"
                            >
                                <span className="text-xl">{item.icon}</span>
                            </button>
                        ))}
                    </div>
                )}
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
