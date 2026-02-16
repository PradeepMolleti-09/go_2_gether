import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { TopSearchBar } from "../components/panels/TopSearchBar";
import { LeftControlPanel } from "../components/panels/LeftControlPanel";
import { RightChatPanel } from "../components/panels/RightChatPanel";
import { SideNav } from "../components/panels/SideNav";
import { MapContainer } from "../components/map/MapContainer";
import { AlertsToast } from "../components/safety/AlertsToast";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { CheckpointModal } from "../components/CheckpointModal";
import { CheckpointsList } from "../components/CheckpointsList";
import { MapProvider } from "../context/MapContext";
import { useAuth } from "../context/AuthContext";
import { useRoom } from "../context/RoomContext";
import { TripReportModal } from "../components/TripReportModal";
import { useMapContext } from "../context/MapContext";

import { WebGLShader } from "../components/ui/web-gl-shader";
import { motion } from "framer-motion";
import { RoomManager } from "../components/panels/RoomManager";

export const MapShell = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="relative flex h-[100dvh] w-full items-center justify-center bg-black overflow-hidden">
        <WebGLShader />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Initializing Neural Map</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <MapProvider>
      <MapShellInner />
    </MapProvider>
  );
};

const MapShellInner = () => {
  const { tripStats, setTripStats, destination } = useMapContext();
  const { room } = useRoom();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <MapContainer />
      <AlertsToast />
      <ProfileAvatar />
      {room?.leader?.id === user?.id && <TopSearchBar />}
      <SideNav />
      <RightChatPanel />

      {/* Room Selection Overlay */}
      {!room && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <RoomManager />
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-20 px-4 md:px-12 flex flex-row items-end justify-end md:justify-between gap-2 md:gap-8 overflow-hidden">

        {/* Trip Info Wrapper - Push to right on mobile with ml-14 to clear sidebar */}
        {destination && (
          <div className="pointer-events-auto flex-1 md:flex-none max-w-[155px] md:w-60 lg:w-72 min-h-[110px] ml-14 md:ml-16">
            <LeftControlPanel />
          </div>
        )}

        {/* Checkpoints List Wrapper */}
        <div className={`pointer-events-auto flex-1 md:flex-none max-w-[155px] md:w-60 lg:w-72 min-h-[110px] ${!destination ? 'ml-14 md:ml-16' : ''}`}>
          <CheckpointsList />
        </div>
      </div>

      <CheckpointModal />
      <TripReportModal
        open={tripStats.endTime !== null}
        onClose={() => {
          setTripStats({
            startTime: null,
            endTime: null,
            distanceTraveled: 0,
            checkpointsReached: 0,
          });
          navigate("/", { replace: true });
        }}
      />
    </div>
  );
};
