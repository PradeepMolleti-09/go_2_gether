import { useMemo } from "react";
import { useMapContext } from "../../context/MapContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

export const BottomStatusPanel = () => {
    const { destination, userLocation, setDestination, tripStats } = useMapContext();
    const { room } = useRoom();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showNotification } = useNotification();

    const isLeader = room?.leader?.id === user?.id;

    const haversineKm = (
        a: { lat: number; lng: number },
        b: { lat: number; lng: number }
    ) => {
        const R = 6371; // km
        const dLat = ((b.lat - a.lat) * Math.PI) / 180;
        const dLng = ((b.lng - a.lng) * Math.PI) / 180;
        const lat1 = (a.lat * Math.PI) / 180;
        const lat2 = (b.lat * Math.PI) / 180;
        const sinDLat = Math.sin(dLat / 2);
        const sinDLng = Math.sin(dLng / 2);
        const c =
            2 *
            Math.asin(
                Math.sqrt(
                    sinDLat * sinDLat +
                    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
                )
            );
        return R * c;
    };

    const calculatedStats = useMemo(() => {
        if (!destination || !userLocation) {
            return { distanceKm: null as number | null, etaMinutes: null as number | null };
        }
        const distanceKm = haversineKm(userLocation, destination);
        // Assume 40 km/h average speed for ETA.
        const etaMinutes = (distanceKm / 40) * 60;
        return { distanceKm, etaMinutes };
    }, [destination, userLocation]);

    const handleClearDestination = () => {
        if (!isLeader) return;
        setDestination(null);
        if (socket && room?._id) {
            socket.emit("trip:destination", { roomId: room._id, destination: null });
            socket.emit("trip:route", { roomId: room._id, routePath: null });
        }
        showNotification("Destination cleared", "info");
    };

    const isTripActive = room?.activeTrip;

    return (
        <AnimatePresence>
            {(destination || isTripActive) && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="pointer-events-auto flex items-center gap-6 rounded-[32px] border border-white/10 bg-black/80 px-8 py-4 text-white shadow-2xl backdrop-blur-3xl transition-all"
                >
                    {/* BEFORE TRIP STARTS: Show destination info */}
                    {destination && !isTripActive && (
                        <>
                            {/* Destination Info */}
                            <div className="flex border-r border-white/10 pr-6 mr-6 flex-col gap-1 min-w-[150px]">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Target</span>
                                    {isLeader && (
                                        <button
                                            onClick={handleClearDestination}
                                            className="text-[9px] font-bold text-red-500 hover:text-red-400 transition-colors"
                                        >
                                            CLEAR
                                        </button>
                                    )}
                                </div>
                                <div className="text-[13px] font-bold tracking-tight truncate max-w-[200px]">
                                    {destination.description}
                                </div>
                            </div>

                            {/* Distance & ETA */}
                            <div className="flex items-center gap-10">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Distance</span>
                                    <div className="text-lg font-black tracking-tight">
                                        {calculatedStats.distanceKm !== null
                                            ? `${calculatedStats.distanceKm.toFixed(1)} km`
                                            : "—"}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">ETA</span>
                                    <div className="text-lg font-black tracking-tight text-emerald-400">
                                        {calculatedStats.etaMinutes !== null
                                            ? `~${Math.round(calculatedStats.etaMinutes)} min`
                                            : "—"}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* AFTER TRIP STARTS: Show traveled distance, remaining distance, and ETA */}
                    {isTripActive && (
                        <div className="flex items-center gap-10">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Traveled</span>
                                <div className="text-lg font-black tracking-tight text-indigo-400">
                                    {tripStats.distanceTraveled.toFixed(2)} km
                                </div>
                            </div>
                            {destination && calculatedStats.distanceKm !== null && (
                                <>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Remaining</span>
                                        <div className="text-lg font-black tracking-tight">
                                            {calculatedStats.distanceKm.toFixed(1)} km
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">ETA</span>
                                        <div className="text-lg font-black tracking-tight text-emerald-400">
                                            ~{Math.round(calculatedStats.etaMinutes!)} min
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
