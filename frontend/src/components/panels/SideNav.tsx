import React, { useState, useEffect } from "react";
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
    const { room, role, setRoom, clearRoom } = useRoom();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showNotification } = useNotification();

    const [membersOpen, setMembersOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [tripInfoOpen, setTripInfoOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const isLeader = room?.leader?.id === user?.id;
    const isOngoing = !!room?.activeTrip;

    // Listen for being kicked
    useEffect(() => {
        if (!socket || !user) return;
        const handleKicked = (payload: { userId: string }) => {
            if (payload.userId === user.id) {
                showNotification("You have been removed from the room.", "error");
                clearRoom();
            }
        };
        socket.on("room:member-removed", handleKicked);
        return () => { socket.off("room:member-removed", handleKicked); };
    }, [socket, user, clearRoom, showNotification]);

    const handleStartTrip = async () => {
        if (!room?._id) return;
        setIsLoading(true);
        try {
            const trip = await startTripApi(room._id);
            if (setRoom) setRoom({ ...room, activeTrip: trip._id }, role);
            setTripStats(prev => ({ ...prev, startTime: Date.now(), distanceTraveled: 0, checkpointsReached: 0 }));
            if (socket) socket.emit("trip:started", { roomId: room._id });
            showNotification("Trip started!", "success");
        } catch {
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
            if (setRoom) setRoom({ ...room, activeTrip: undefined }, role);
            setTripStats(prev => ({ ...prev, endTime: Date.now() }));
            if (socket) socket.emit("trip:ended", { roomId: room._id });
            setDestination(null);
            setCheckpoints([]);
            showNotification("Trip ended", "info");
        } catch {
            showNotification("Failed to end trip", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const navItems: NavItem[] = [
        {
            id: "chat",
            label: "Chat",
            icon: "💬",
            active: isChatOpen,
            onClick: toggleChat,
        },
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
            onClick: () => window.location.reload(),
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
        {
            id: "leave",
            label: "Leave Room",
            icon: "🚪",
            accent: false,
            onClick: () => {
                if (window.confirm("Leave this room?")) {
                    clearRoom();
                    showNotification("You left the room", "info");
                }
            },
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
            showNotification("Photo uploaded!", "success");
        } catch {
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

    const close = () => { setMobileOpen(false); };

    return (
        <>
            {/* ═══════════════════════════════════════════════════
                DESKTOP — vertical pill sidebar (hover to expand)
            ═══════════════════════════════════════════════════ */}
            <div
                className="hidden md:flex pointer-events-none absolute left-6 top-1/2 z-50 -translate-y-1/2 flex-col items-center"
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
                                ${item.id === "leave" ? "hover:bg-red-500/10" : item.active ? "bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "hover:bg-white/5"}
                                ${isExpanded ? "px-5 gap-4" : "justify-center"}
                            `}
                        >
                            <span className={`text-xl leading-none transition-all duration-300
                                ${item.accent ? "drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                                    : item.id === "leave" ? "opacity-50 group-hover:opacity-100"
                                        : item.active ? "scale-110 opacity-100"
                                            : "opacity-55 group-hover:opacity-100 group-hover:scale-110"
                                }`}>
                                {item.icon}
                            </span>

                            <span className={`whitespace-nowrap text-[10px] font-black uppercase tracking-[0.18em] text-white/70 transition-all duration-500
                                ${item.id === "leave" ? "text-red-400/70 group-hover:text-red-400" : ""}
                                ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 absolute pointer-events-none"}
                            `}>
                                {item.label}
                            </span>

                            {item.id === "chat" && unreadCount > 0 && (
                                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-lg animate-pulse border border-black">
                                    {unreadCount}
                                </div>
                            )}

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

            {/* ═══════════════════════════════════════════════════
                MOBILE — floating buttons top-left + slide panel
            ═══════════════════════════════════════════════════ */}
            <div className="md:hidden pointer-events-none fixed left-3 top-3 z-50 flex flex-col gap-2">
                {/* Menu toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/70 shadow-2xl backdrop-blur-xl transition-all active:scale-90"
                >
                    <span className="text-base text-white">{mobileOpen ? "✕" : "☰"}</span>
                </button>

                {/* Chat button */}
                <button
                    onClick={toggleChat}
                    className={`pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-2xl border bg-black/70 shadow-2xl backdrop-blur-xl transition-all active:scale-90 ${isChatOpen ? "bg-indigo-500/25 border-indigo-500/50" : "border-white/10"}`}
                >
                    <span className="text-xl">💬</span>
                    {unreadCount > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-pulse border-2 border-black">
                            {unreadCount}
                        </div>
                    )}
                </button>
            </div>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[59] bg-black/50 backdrop-blur-sm"
                    onClick={close}
                />
            )}

            {/* Mobile slide-in side panel */}
            <div className={`md:hidden fixed left-0 top-0 bottom-0 z-[60] w-72 flex flex-col bg-black/95 border-r border-white/10 backdrop-blur-3xl shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 pt-safe">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Navigation</p>
                        <h3 className="text-base font-black text-white">Menu</h3>
                    </div>
                    <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50">✕</button>
                </div>

                {/* Room code */}
                {room && (
                    <div className="border-b border-white/5 px-5 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Room Code</p>
                        <p className="text-2xl font-black tracking-widest text-white">{room.code}</p>
                    </div>
                )}

                {/* Nav items list */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            disabled={item.disabled}
                            onClick={() => { item.onClick(); close(); }}
                            className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-95
                                ${item.id === "leave" ? "hover:bg-red-500/10" : item.active ? "bg-white/10" : "hover:bg-white/5"}
                                disabled:opacity-40`}
                        >
                            <span className={`text-2xl leading-none shrink-0
                                ${item.accent ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" : ""}
                            `}>{item.icon}</span>
                            <span className={`text-sm font-black uppercase tracking-widest
                                ${item.id === "leave" ? "text-red-400" : item.active ? "text-white" : "text-white/70"}
                            `}>{item.label}</span>

                            {item.id === "chat" && unreadCount > 0 && (
                                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-pulse">
                                    {unreadCount}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Bottom: profile info */}
                {user && (
                    <div className="border-t border-white/5 px-5 py-4 flex items-center gap-3">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-black text-white">
                                {user.name?.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-black text-white leading-none">{user.name}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{role}</p>
                        </div>
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
