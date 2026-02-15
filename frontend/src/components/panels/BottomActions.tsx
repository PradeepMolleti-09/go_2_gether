import { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import { useMapContext } from "../../context/MapContext";
import { startTripApi, endTripApi } from "../../services/roomService";

export const BottomActions = () => {
  const { socket } = useSocket();
  const { room, role, setRoom } = useRoom();
  const { setDestination, setCheckpoints, setTripStats } = useMapContext();
  const [isLoading, setIsLoading] = useState(false);

  if (!room) return null;

  const isOngoing = !!room.activeTrip;

  const actions = !isOngoing
    ? [{ label: "SOS", accent: true, onClick: "sos" as const }, { label: "Start", onClick: "start" as const }]
    : [{ label: "SOS", accent: true, onClick: "sos" as const }, { label: "End", onClick: "end" as const }];

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
    } catch (error) {
      console.error("Failed to start trip:", error);
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

      // Clear map data
      setDestination(null);
      setCheckpoints([]);
    } catch (error) {
      console.error("Failed to end trip:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          disabled={isLoading || (role !== "leader" && (action.onClick === "start" || action.onClick === "end"))}
          className={`group relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl border transition-all duration-300 active:scale-95 disabled:opacity-50 ${action.accent
            ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500 hover:text-white"
            : "border-white/10 bg-black/60 text-neutral-100 hover:bg-white/20 backdrop-blur-3xl shadow-2xl"
            }`}
          onClick={() => {
            if (!room?._id) return;
            if (action.onClick === "sos" && socket) {
              socket.emit("trip:sos", {
                roomId: room._id,
                reason: "manual",
              });
            } else if (action.onClick === "start") {
              handleStartTrip();
            } else if (action.onClick === "end") {
              handleEndTrip();
            }
          }}
          title={action.label}
        >
          <span className="text-[10px] font-black uppercase tracking-tighter">
            {action.label}
          </span>
          {/* Tooltip for desktop */}
          <div className="hidden md:block absolute left-16 scale-0 bg-black/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg border border-white/10 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap shadow-2xl pointer-events-none z-50">
            {action.label === "SOS" ? "Emergency SOS" : `${action.label} Trip`}
          </div>
        </button>
      ))}
    </div>
  );
};
