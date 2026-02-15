import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { RoomDto, RoomMemberDto } from "../services/roomService";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

type Role = "leader" | "member" | null;

interface RoomContextValue {
  room: RoomDto | null;
  role: Role;
  setRoom: (room: RoomDto, role: Role) => void;
  addMember: (member: RoomMemberDto) => void;
  clearRoom: () => void;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [room, setRoomState] = useState<RoomDto | null>(null);
  const [role, setRole] = useState<Role>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Socket listener for leader updates
  useEffect(() => {
    if (!socket) return;

    const handler = (payload: { roomId: string, newLeaderId: string, room: RoomDto }) => {
      // If we are in this room, update our room state
      if (room && room._id === payload.roomId) {
        setRoomState(payload.room);
        setRole(payload.newLeaderId === user?.id ? "leader" : "member");
      }
    };

    socket.on("leader:updated", handler);
    return () => {
      socket.off("leader:updated", handler);
    };
  }, [socket, room, user]);

  // Hydrate from sessionStorage on first mount
  useEffect(() => {
    const stored = window.sessionStorage.getItem("go2gether_room");
    if (!stored) return;
    try {
      const parsed = JSON.parse(
        stored
      ) as { room: RoomDto; role: Role };
      setRoomState(parsed.room);
      setRole(parsed.role);
    } catch {
      window.sessionStorage.removeItem("go2gether_room");
    }
  }, []);

  const setRoom = (nextRoom: RoomDto, nextRole: Role) => {
    setRoomState(nextRoom);
    setRole(nextRole);
    window.sessionStorage.setItem(
      "go2gether_room",
      JSON.stringify({ room: nextRoom, role: nextRole })
    );
  };

  const addMember = (member: RoomMemberDto) => {
    if (!room || !room.members) return;
    // check if member exists
    if (room.members.some((m) => m.id === member.id)) return;

    const nextRoom = { ...room, members: [...room.members, member] };
    setRoomState(nextRoom);
    window.sessionStorage.setItem(
      "go2gether_room",
      JSON.stringify({ room: nextRoom, role })
    );
  };

  const clearRoom = () => {
    setRoomState(null);
    setRole(null);
    window.sessionStorage.removeItem("go2gether_room");
  };

  return (
    <RoomContext.Provider value={{ room, role, setRoom, addMember, clearRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error("useRoom must be used within RoomProvider");
  }
  return ctx;
};
