import { apiFetch } from "./apiClient";

interface LoginResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  token: string;
}

export const loginWithGoogle = async (idToken: string) => {
  const res = await apiFetch<LoginResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  return res;
};

