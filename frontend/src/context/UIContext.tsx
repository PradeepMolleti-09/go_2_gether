import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface UIContextValue {
  isChatOpen: boolean;
  toggleChat: () => void;
  lowBandwidth: boolean;
  toggleLowBandwidth: () => void;
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lowBandwidth, setLowBandwidthState] = useState(() => {
    const stored = window.localStorage.getItem("go2gether_low_bandwidth");
    return stored === "true";
  });
  const [unreadCount, setUnreadCountState] = useState(() => {
    const stored = window.localStorage.getItem("go2gether_unread_count");
    return stored ? parseInt(stored, 10) : 0;
  });

  const setUnreadCount = (count: number | ((prev: number) => number)) => {
    setUnreadCountState((prev) => {
      const next = typeof count === "function" ? count(prev) : count;
      window.localStorage.setItem("go2gether_unread_count", String(next));
      return next;
    });
  };

  const toggleChat = () => {
    setIsChatOpen((v) => {
      const next = !v;
      if (next) setUnreadCount(0);
      return next;
    });
  };
  const toggleLowBandwidth = () => setLowBandwidthState((v) => {
    const next = !v;
    window.localStorage.setItem("go2gether_low_bandwidth", String(next));
    return next;
  });

  return (
    <UIContext.Provider
      value={{ isChatOpen, toggleChat, lowBandwidth, toggleLowBandwidth, unreadCount, setUnreadCount }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within UIProvider");
  }
  return ctx;
};

