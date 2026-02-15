import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("go2gether_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { user: User; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        window.localStorage.removeItem("go2gether_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const setAuth = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem(
      "go2gether_auth",
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem("go2gether_auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

