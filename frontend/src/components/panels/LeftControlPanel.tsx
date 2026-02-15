import { useMemo } from "react";
import { useMapContext } from "../../context/MapContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";

export const LeftControlPanel = () => {
  const { destination, userLocation, setDestination } = useMapContext();
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

  const tripStats = useMemo(() => {
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

  if (!destination) return null;

  return (
    <div className="pointer-events-auto rounded-[24px] border border-white/10 bg-black/70 p-3 text-xs text-neutral-200 shadow-2xl backdrop-blur-3xl group h-full">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
          Trip Info
        </span>
        {isLeader ? (
          <button
            onClick={handleClearDestination}
            className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-[9px] font-bold text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
          >
            ✕ CLEAR
          </button>
        ) : (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            Live
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">Destination</span>
          <div className="text-[13px] font-semibold text-white truncate leading-tight">
            {destination.description}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-neutral-500 font-bold uppercase">Distance</span>
            <span className="text-[12px] font-medium text-white">
              {tripStats.distanceKm != null
                ? `${tripStats.distanceKm.toFixed(1)} km`
                : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-neutral-500 font-bold uppercase">Arrival</span>
            <span className="text-[12px] font-medium text-white">
              {tripStats.etaMinutes != null
                ? `~ ${Math.round(tripStats.etaMinutes)} min`
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
