import { Route, Routes, Navigate } from "react-router-dom";
import { Landing } from "./routes/Landing";
import { MapShell } from "./routes/MapShell";
import { JoinRoom } from "./routes/JoinRoom";
import { Home } from "./routes/Home";
import { AuthProvider } from "./context/AuthContext";
import { RoomProvider } from "./context/RoomContext";
import { SocketProvider } from "./context/SocketContext";
import { UIProvider } from "./context/UIContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationToast } from "./components/NotificationToast";

export const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <RoomProvider>
          <UIProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Landing />} />
                <Route path="/trip" element={<MapShell />} />
                <Route path="/join/:code" element={<JoinRoom />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <NotificationToast />
            </NotificationProvider>
          </UIProvider>
        </RoomProvider>
      </SocketProvider>
    </AuthProvider>
  );
};
