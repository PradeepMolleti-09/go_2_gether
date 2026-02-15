import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface Destination {
  lat: number;
  lng: number;
  description: string;
}

interface SearchSuggestion {
  description: string;
  placeId: string;
  lat?: number;
  lng?: number;
}

interface CheckpointMarker {
  _id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
  };
  createdBy: string;
  createdAt: string;
}

interface TripStats {
  startTime: number | null;
  endTime: number | null;
  distanceTraveled: number;
  checkpointsReached: number;
  totalDistance?: number;
}

interface MapContextValue {
  destination: Destination | null;
  setDestination: (dest: Destination | null) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  searchSuggestions: SearchSuggestion[];
  setSearchSuggestions: (suggestions: SearchSuggestion[]) => void;
  mapClickEnabled: boolean;
  setMapClickEnabled: (enabled: boolean) => void;
  checkpointMode: "none" | "create" | "view";
  setCheckpointMode: (mode: "none" | "create" | "view") => void;
  pendingCheckpointLocation: { lat: number; lng: number } | null;
  setPendingCheckpointLocation: (loc: { lat: number; lng: number } | null) => void;
  checkpoints: CheckpointMarker[];
  setCheckpoints: (checkpoints: CheckpointMarker[]) => void;
  focusLocation: { lat: number; lng: number } | null;
  setFocusLocation: (loc: { lat: number; lng: number } | null) => void;
  memberPositions: Record<string, { lat: number; lng: number }>;
  setMemberPositions: (positions: Record<string, { lat: number; lng: number }>) => void;
  tripStats: TripStats;
  setTripStats: (stats: TripStats | ((prev: TripStats) => TripStats)) => void;
  routePath: { lat: number; lng: number }[] | null;
  setRoutePath: (path: { lat: number; lng: number }[] | null) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [destination, setDestinationState] = useState<Destination | null>(null);
  const [userLocation, setUserLocationState] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [mapClickEnabled, setMapClickEnabledState] = useState(() => {
    return window.localStorage.getItem("go2gether_map_click_enabled") === "true";
  });
  const [checkpointMode, setCheckpointMode] = useState<"none" | "create" | "view">("none");
  const [pendingCheckpointLocation, setPendingCheckpointLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointMarker[]>([]);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [memberPositions, setMemberPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const [tripStats, setTripStatsState] = useState<TripStats>({
    startTime: null,
    endTime: null,
    distanceTraveled: 0,
    checkpointsReached: 0,
  });

  const setMapClickEnabled = (enabled: boolean) => {
    setMapClickEnabledState(enabled);
    window.localStorage.setItem("go2gether_map_click_enabled", String(enabled));
  };
  const [routePath, setRoutePathState] = useState<{ lat: number; lng: number }[] | null>(null);

  useEffect(() => {
    const storedDest = window.localStorage.getItem("go2gether_destination");
    if (storedDest) {
      try {
        setDestinationState(JSON.parse(storedDest));
      } catch {
        window.localStorage.removeItem("go2gether_destination");
      }
    }

    const storedPath = window.localStorage.getItem("go2gether_route_path");
    if (storedPath) {
      try {
        setRoutePathState(JSON.parse(storedPath));
      } catch {
        window.localStorage.removeItem("go2gether_route_path");
      }
    }

    const storedStats = window.localStorage.getItem("go2gether_trip_stats");
    if (storedStats) {
      try {
        setTripStatsState(JSON.parse(storedStats));
      } catch {
        window.localStorage.removeItem("go2gether_trip_stats");
      }
    }
  }, []);

  const setTripStats = (stats: TripStats | ((prev: TripStats) => TripStats)) => {
    setTripStatsState((prev) => {
      const next = typeof stats === "function" ? stats(prev) : stats;
      window.localStorage.setItem("go2gether_trip_stats", JSON.stringify(next));
      return next;
    });
  };

  const setRoutePath = (path: { lat: number; lng: number }[] | null) => {
    const nextPath = path && path.length > 0 ? path : null;
    setRoutePathState(nextPath);
    if (nextPath) {
      window.localStorage.setItem("go2gether_route_path", JSON.stringify(nextPath));
    } else {
      window.localStorage.removeItem("go2gether_route_path");
    }
  };

  const setDestination = (dest: Destination | null) => {
    setDestinationState(dest);
    if (dest) {
      window.localStorage.setItem("go2gether_destination", JSON.stringify(dest));
    } else {
      window.localStorage.removeItem("go2gether_destination");
      setRoutePath(null);
      setRoutePathState(null); // Force local state clear
      window.localStorage.removeItem("go2gether_route_path"); // Force storage clear
      // Also clear destination-related stats
      setTripStats((prev) => {
        const { totalDistance, ...rest } = prev as any;
        return { ...rest, distanceTraveled: prev.distanceTraveled } as TripStats;
      });
    }
  };

  const setUserLocation = (loc: { lat: number; lng: number } | null) => {
    setUserLocationState(loc);
  };

  return (
    <MapContext.Provider
      value={{
        destination,
        setDestination,
        userLocation,
        setUserLocation,
        searchSuggestions,
        setSearchSuggestions,
        mapClickEnabled,
        setMapClickEnabled,
        checkpointMode,
        setCheckpointMode,
        pendingCheckpointLocation,
        setPendingCheckpointLocation,
        checkpoints,
        setCheckpoints,
        focusLocation,
        setFocusLocation,
        memberPositions,
        setMemberPositions,
        tripStats,
        setTripStats,
        routePath,
        setRoutePath,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMapContext must be used within MapProvider");
  }
  return ctx;
};

