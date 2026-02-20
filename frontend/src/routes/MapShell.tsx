import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { TopSearchBar } from "../components/panels/TopSearchBar";
import { BottomStatusPanel } from "../components/panels/BottomStatusPanel";
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
import { useUI } from "../context/UIContext";
import { TripReportModal } from "../components/TripReportModal";
import { useMapContext } from "../context/MapContext";

import { WebGLShader } from "../components/ui/web-gl-shader";
import { motion, AnimatePresence } from "framer-motion";
import { RoomManager } from "../components/panels/RoomManager";
import { QuickGuide } from "../components/ui/QuickGuide";

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
  const { tripStats, setTripStats } = useMapContext();
  const { isCheckpointsOpen } = useUI();
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

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-20 px-8 flex justify-center">
        <BottomStatusPanel />
      </div>

      <AnimatePresence>
        {isCheckpointsOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute left-20 top-1/2 z-40 h-[300px] w-64 -translate-y-1/2"
          >
            <CheckpointsList />
          </motion.div>
        )}
      </AnimatePresence>

      <CheckpointModal />
      <QuickGuide />
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
