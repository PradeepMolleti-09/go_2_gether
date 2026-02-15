const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "https://go-2-gether-backend.onrender.com";

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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`Fetching: ${API_BASE_URL}${path}`);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let message = "Request failed";
      try {
        const data = await res.json();
        message = data.message ?? message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return res.json() as Promise<T>;
  } catch (err: any) {
    console.error("API Fetch Error:", err);
    if (err.message === "Failed to fetch") {
      throw new Error("Could not connect to the authentication server. Please check your internet or if the server is waking up.");
    }
    throw err;
  }
}

