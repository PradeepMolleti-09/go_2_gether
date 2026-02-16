import { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { playSound } from "../../utils/sounds";

type Alert =
  | { id: string; type: "offline"; userId: string; at: number }
  | { id: string; type: "idle"; userId: string; at: number }
  | { id: string; type: "sos"; userId: string; at: number; reason?: string };

export const AlertsToast = () => {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleManual = (payload: { userId: string; reason?: string; at: number }) => {
      playSound("alert");
      setAlerts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-sos`,
          type: "sos",
          userId: payload.userId,
          at: payload.at,
          reason: payload.reason,
        },
      ]);
    };

    const handleAuto = (payload: { userId: string; type: "offline"; at: number }) => {
      playSound("alert");
      setAlerts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-offline`,
          type: "offline",
          userId: payload.userId,
          at: payload.at,
        },
      ]);
    };

    const handleIdle = (payload: { userId: string; type: "idle"; at: number }) => {
      playSound("alert");
      setAlerts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-idle`,
          type: "idle",
          userId: payload.userId,
          at: payload.at,
        },
      ]);
    };

    socket.on("trip:sos", handleManual);
    socket.on("trip:sos:auto", handleAuto);
    socket.on("trip:alert", handleIdle);

    return () => {
      socket.off("trip:sos", handleManual);
      socket.off("trip:sos:auto", handleAuto);
      socket.off("trip:alert", handleIdle);
    };
  }, [socket]);

  useEffect(() => {
    if (!alerts.length) return;
    const timer = setTimeout(() => {
      setAlerts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [alerts]);

  if (!alerts.length) return null;

  const top = alerts[alerts.length - 1];

  const label =
    top.type === "sos"
      ? "Manual SOS triggered"
      : top.type === "offline"
        ? "Auto SOS: user offline"
        : "Idle alert: no movement";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-red-600 px-4 py-3 text-xs font-medium text-white shadow-2xl">
        <span className="h-2 w-2 rounded-full bg-white" />
        <div className="flex-1">
          <div className="uppercase tracking-[0.18em] text-[10px] opacity-80">
            Safety
          </div>
          <div>{label}</div>
        </div>
      </div>
    </div>
  );
};

