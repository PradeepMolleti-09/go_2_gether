import { apiFetch } from "./apiClient";

export interface RoomMemberDto {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface RoomDto {
  _id: string;
  code: string;
  leader: RoomMemberDto;
  members: RoomMemberDto[];
  activeTrip?: string;
}

export const createRoomApi = async () => {
  const { room } = await apiFetch<{ room: RoomDto }>("/rooms", {
    method: "POST",
  });
  return room;
};

export const joinRoomApi = async (code: string) => {
  const { room } = await apiFetch<{ room: RoomDto }>("/rooms/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return room;
};

export const startTripApi = async (roomId: string, destination?: { lat: number; lng: number; address?: string }) => {
  const { trip } = await apiFetch<{ trip: any }>(`/trips/rooms/${roomId}/start`, {
    method: "POST",
    body: JSON.stringify({ destination }),
  });
  return trip;
};

export const endTripApi = async (roomId: string) => {
  const { trip } = await apiFetch<{ trip: any }>(`/trips/rooms/${roomId}/end`, {
    method: "POST",
  });
  return trip;
};

export const transferLeadershipApi = async (roomId: string, newLeaderId: string) => {
  const { room } = await apiFetch<{ room: RoomDto }>(`/rooms/${roomId}/transfer-leader`, {
    method: "POST",
    body: JSON.stringify({ newLeaderId }),
  });
  return room;
};

