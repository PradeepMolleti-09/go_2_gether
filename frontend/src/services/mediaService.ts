import { apiFetch } from "./apiClient";

export interface MediaItem {
  _id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export const uploadPhoto = async (tripId: string, file: File, caption?: string) => {
  const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    "http://localhost:4000";

  const getToken = () => {
    try {
      const stored = window.localStorage.getItem("go2gether_auth");
      if (!stored) return null;
      const parsed = JSON.parse(stored) as { token?: string };
      return parsed.token ?? null;
    } catch {
      return null;
    }
  };

  const form = new FormData();
  form.append("tripId", tripId);
  form.append("file", file);
  if (caption) form.append("caption", caption);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/media/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  return res.json();
};

export const getTripMedia = async (tripId: string) => {
  const { media } = await apiFetch<{ media: MediaItem[] }>(`/media/${tripId}`);
  return media;
};

export const deleteMedia = async (mediaId: string) => {
  return apiFetch(`/media/${mediaId}`, { method: "DELETE" });
};

