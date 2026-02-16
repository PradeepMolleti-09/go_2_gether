import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { useMapContext } from "../../context/MapContext";
import { useNotification } from "../../context/NotificationContext";

import { checkpointService } from "../../services/checkpointService";
import { DistanceLogic } from "./DistanceLogic";
import { NavigationLogic } from "./NavigationLogic";
import { triggerCelebration, playCelebrationSound } from "../../utils/celebration";
import { playSound } from "../../utils/sounds";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050505" }] },
];

const defaultCenter = { lat: 37.7749, lng: -122.4194 };
const avatarIconCache = new Map<string, google.maps.Icon | google.maps.Symbol>();

const createFallbackIcon = (): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: "#d4d4d4",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeOpacity: 1,
  strokeWeight: 3,
  scale: 8,
});

const getMemberColor = (id: string) => {
  const colors = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
    "#F97316", "#84CC16", "#06B6D4", "#D946EF"
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const createAvatarIconWithBorder = (avatarUrl: string, borderColor: string): Promise<google.maps.Icon | google.maps.Symbol> => {
  const cacheKey = `${avatarUrl}-${borderColor}`;
  return new Promise((resolve) => {
    if (avatarIconCache.has(cacheKey)) {
      resolve(avatarIconCache.get(cacheKey)!);
      return;
    }

    const canvas = document.createElement("canvas");
    const size = 60;
    const height = 70; // Increase height to create gap
    canvas.width = size;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(createFallbackIcon());
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      try {
        const avatarSize = 50;
        const offset = (size - avatarSize) / 2;

        // Draw border circle background (for border color)
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (avatarSize / 2) + 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw white background for avatar
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, offset, offset, avatarSize, avatarSize);
        ctx.restore();

        // Draw smaller dot at bottom with gap
        ctx.beginPath();
        ctx.arc(size / 2, height - 6, 4, 0, Math.PI * 2);
        ctx.fillStyle = borderColor;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const icon: google.maps.Icon = {
          url: canvas.toDataURL(),
          scaledSize: new google.maps.Size(60, 70),
          anchor: new google.maps.Point(30, 35),
        };

        avatarIconCache.set(cacheKey, icon);
        resolve(icon);
      } catch (error) {
        resolve(createFallbackIcon());
      }
    };

    img.onerror = () => resolve(createFallbackIcon());
    img.src = avatarUrl;
  });
};

const createFlagIcon = (): google.maps.Icon => {
  const size = 50;
  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${size / 2 - 1}" y="10" width="2" height="${size - 15}" fill="#1f2937"/>
      <path d="M ${size / 2 + 1} 12 L ${size - 8} 20 L ${size - 8} 32 Q ${size / 2 + 1} 40 ${size / 2 + 1} 32 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
    </svg>
  `.trim();
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
    scaledSize: new google.maps.Size(50, 50),
    anchor: new google.maps.Point(25, 50),
  };
};

const createAvatarSVG = (initials: string, borderColor: string): google.maps.Icon => {
  const size = 60;
  const height = 70;
  const avatarSize = 50;
  const color = "#4F46E5";

  const svgString = `
    <svg width="${size}" height="${height}" viewBox="0 0 ${size} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Border Circle -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${(avatarSize / 2) + 1.5}" fill="${borderColor}"/>
      
      <!-- Avatar Background -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${avatarSize / 2}" fill="white"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${avatarSize / 2 - 2}" fill="${color}"/>
      
      <!-- Text -->
      <text x="${size / 2}" y="${size / 2 + 8}" font-size="18" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">${initials}</text>
      
      <!-- Status Dot -->
      <circle cx="${size / 2}" cy="${height - 6}" r="4" fill="${borderColor}" stroke="white" stroke-width="1.5"/>
    </svg>
  `.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
    scaledSize: new google.maps.Size(60, 70),
    anchor: new google.maps.Point(30, 35),
  };
};

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng));
  return R * c;
};

export const MapContainer = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { socket } = useSocket();
  const { room, addMember, clearRoom } = useRoom();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const {
    destination, setDestination, userLocation, setUserLocation,
    mapClickEnabled,
    setMapClickEnabled, checkpointMode, setCheckpointMode,
    setPendingCheckpointLocation,
    checkpoints, setCheckpoints, focusLocation,
    setMemberPositions, tripStats, setTripStats,
    routePath, setRoutePath,
  } = useMapContext();

  const [positions, setPositions] = useState<Record<string, any>>({});
  const [loadedAvatarIcons, setLoadedAvatarIcons] = useState<Map<string, google.maps.Icon | google.maps.Symbol>>(new Map());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "go2gether-map",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places"],
  });

  useEffect(() => {
    const simplified = Object.entries(positions).reduce((acc, [id, pos]: [string, any]) => {
      acc[id] = { lat: pos.lat, lng: pos.lng };
      return acc;
    }, {} as Record<string, { lat: number; lng: number }>);
    setMemberPositions(simplified);
  }, [positions, setMemberPositions]);

  useEffect(() => {
    if (map && focusLocation) {
      map.panTo(focusLocation);
      map.setZoom(16);
    }
  }, [map, focusLocation]);

  useEffect(() => {
    if (!tripStats.startTime || tripStats.endTime) {
      setElapsedMinutes(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - tripStats.startTime!) / 60000));
    }, 10000); // Check every 10s
    setElapsedMinutes(Math.floor((Date.now() - tripStats.startTime!) / 60000));
    return () => clearInterval(interval);
  }, [tripStats.startTime, tripStats.endTime]);

  useEffect(() => { lastLocationRef.current = userLocation; }, [userLocation]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    mapInstance.setOptions({ styles: mapStyles, disableDefaultUI: true, zoomControl: false, gestureHandling: 'greedy' });
    setMap(mapInstance);
    if (userLocation) {
      mapInstance.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      mapInstance.setZoom(14);
    }
  }, [userLocation]);

  const onUnmount = useCallback(() => { setMap(null); }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        if (map) map.panTo(coords);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [map, setUserLocation]);

  useEffect(() => {
    if (!map || !destination) return;
    map.panTo({ lat: destination.lat, lng: destination.lng });
    map.setZoom(14);
  }, [map, destination]);

  useEffect(() => {
    let active = true;
    if (!destination) {
      setRoutePath(null);
      setTripStats((prev: any) => {
        const { totalDistance, ...rest } = prev;
        return rest;
      });
      if (socket && room?._id && room.leader?.id === user?.id) {
        socket.emit("trip:route", { roomId: room._id, routePath: null });
      }
      return;
    }

    if (!userLocation || !isLoaded || !window.google?.maps) {
      return;
    }
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (!active) return;
        if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.overview_path) {
          const path = result.routes[0].overview_path.map((p: google.maps.LatLng) => ({ lat: p.lat(), lng: p.lng() }));
          setRoutePath(path);

          // Calculate total distance explicitly from legs
          const totalDistMeters = result.routes[0].legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
          setTripStats((prev: any) => ({ ...prev, totalDistance: totalDistMeters / 1000 })); // in km

          if (socket && room?._id) socket.emit("trip:route", { roomId: room._id, routePath: path });
        } else {
          setRoutePath(null);
        }
      }
    );
    return () => { active = false; };
  }, [userLocation, destination, isLoaded, socket, room?._id]);

  useEffect(() => {
    if (socket && room?._id) socket.emit("join-room", room._id);
  }, [socket, room?._id]);

  useEffect(() => {
    if (!socket || !room?._id || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        socket.emit("location:update", { roomId: room._id, lat: coords.lat, lng: coords.lng });
        setPositions(prev => ({ ...prev, [user?.id ?? "self"]: { ...coords, lastUpdated: Date.now(), isSelf: true } }));
        if (lastLocationRef.current) {
          const dist = haversineKm(lastLocationRef.current, coords);
          if (dist > 0.001) setTripStats((prev: any) => ({ ...prev, distanceTraveled: prev.distanceTraveled + dist }));
        }
        checkpoints.forEach(cp => {
          if (haversineKm(coords, cp.location) < 0.03 && socket && room?._id) { // 30 meters
            socket.emit("checkpoint:reached", { roomId: room._id, checkpointId: cp._id });
            setTripStats((prev: any) => ({ ...prev, checkpointsReached: prev.checkpointsReached + 1 }));
            showNotification(`Reached checkpoint: ${cp.title}`, "success");
          }
        });
        if (destination && haversineKm(coords, destination) < 0.015 && socket && room?._id) { // 15 meters
          socket.emit("trip:destination-reached", { roomId: room._id });
          showNotification("You have reached your destination!", "success");
          setDestination(null); // Clear destination after reaching
        }
      },
      () => { },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, room?._id, user?.id, checkpoints, setTripStats, showNotification]);

  useEffect(() => {
    if (!socket) return;
    const locationHandler = (p: any) => setPositions(prev => ({ ...prev, [p.userId]: { lat: p.lat, lng: p.lng, lastUpdated: Date.now(), isSelf: false } }));
    const userJoinedHandler = (p: any) => {
      if (p.user && addMember) addMember(p.user);
      if (lastLocationRef.current && room?._id) socket.emit("location:update", { roomId: room._id, ...lastLocationRef.current });
    };
    const destHandler = (p: any) => {
      if (room?._id && p.roomId === room._id) {
        setDestination(p.destination);
        showNotification(p.destination ? "Destination updated" : "Destination cleared", "info");
      }
    };
    const cpHandler = (p: any) => {
      if (room?._id && p.roomId === room._id) {
        // @ts-ignore
        setCheckpoints((prev: any[]) => [...prev, p.checkpoint]);
        showNotification(`Checkpoint "${p.checkpoint.title}" created`, "success");
        playSound("checkpoint");
      }
    };
    const cpDelHandler = (p: any) => {
      if (room?._id && p.roomId === room._id) {
        // @ts-ignore
        setCheckpoints((prev: any[]) => prev.filter(c => String(c._id) !== String(p.checkpointId)));
      }
    };
    const userLeftHandler = (p: any) => setPositions(prev => { const next = { ...prev }; delete next[p.userId]; return next; });
    const routeHandler = (p: any) => {
      if (room?._id && p.roomId === room._id) {
        setRoutePath(p.routePath || null);
      }
    };
    const startHandler = (p: any) => {
      if (room?._id && p.roomId === room._id) {
        showNotification("The trip has started!", "success", 5000, "system");
        setTripStats((prev: any) => ({ ...prev, startTime: Date.now(), distanceTraveled: 0, checkpointsReached: 0 }));
        speak("Trip started! Have a safe journey.");
      }
    };
    const endHandler = (p: any) => {
      if (room?._id && p.roomId === room._id) {
        setTripStats((prev: any) => ({ ...prev, endTime: Date.now() }));
        showNotification("The trip has ended.", "info");
        setRoutePath(null); setDestination(null); setCheckpoints([]);
        setTimeout(() => clearRoom(), 2000);
      }
    };

    socket.on("location:update", locationHandler);
    socket.on("user-joined", userJoinedHandler);
    socket.on("trip:destination", destHandler);
    socket.on("trip:route", routeHandler);
    socket.on("checkpoint:created", cpHandler);
    socket.on("checkpoint:deleted", cpDelHandler);
    socket.on("user-left", userLeftHandler);
    socket.on("trip:started", startHandler);
    socket.on("trip:ended", endHandler);
    return () => {
      socket.off("location:update", locationHandler);
      socket.off("user-joined", userJoinedHandler);
      socket.off("trip:destination", destHandler);
      socket.off("trip:route", routeHandler);
      socket.off("checkpoint:created", cpHandler);
      socket.off("checkpoint:deleted", cpDelHandler);
      socket.off("user-left", userLeftHandler);
      socket.off("trip:started", startHandler);
      socket.off("trip:ended", endHandler);
    };
  }, [socket, room, setDestination, setCheckpoints, setTripStats, showNotification, addMember, clearRoom]);

  useEffect(() => {
    // If room.activeTrip exists (could be string ID or object depending on population)
    // We expect it to be an ID string for getCheckpoints, or if it's an object, we need ._id
    const tripId = room?.activeTrip && typeof room.activeTrip === 'object' ? (room.activeTrip as any)._id : room?.activeTrip;

    if (tripId) {
      // @ts-ignore
      checkpointService.getCheckpoints(tripId).then(setCheckpoints).catch(console.error);
    } else {
      setCheckpoints([]);
    }
  }, [room?.activeTrip, setCheckpoints]);

  useEffect(() => {
    const members = [user, ...(room?.members || []), room?.leader].filter(m => !!m);
    const loadAvatars = async () => {
      const currentIcons = new Map(loadedAvatarIcons);
      let updated = false;
      for (const m of members) {
        const color = getMemberColor(m.id);
        if (m?.avatarUrl && !currentIcons.has(m.id)) {
          currentIcons.set(m.id, await createAvatarIconWithBorder(m.avatarUrl, color));
          updated = true;
        }
      }
      if (updated) setLoadedAvatarIcons(currentIcons);
    };
    loadAvatars();
  }, [room?.members, room?.leader, user, loadedAvatarIcons]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !window.google?.maps) return;
    const { lat, lng } = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    if (checkpointMode === "create") {
      setPendingCheckpointLocation({ lat, lng });
      setCheckpointMode("view");
      return;
    }
    if (!mapClickEnabled) return;
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (res, status) => {
      if (status === "OK" && res?.[0]) {
        const dest = { lat, lng, description: res[0].formatted_address };
        setDestination(dest);
        if (socket && room?._id) socket.emit("trip:destination", { roomId: room._id, destination: dest });
        setMapClickEnabled(false);
      }
    });
  }, [checkpointMode, mapClickEnabled, socket, room?._id, setDestination, setMapClickEnabled, setPendingCheckpointLocation, setCheckpointMode]);

  if (!isLoaded) return <div className="h-full w-full bg-black" />;

  return (
    <div className="absolute inset-0">
      {room?.activeTrip && (
        <div className="absolute top-[80px] md:top-24 left-4 z-10 w-[calc(100%-2rem)] md:w-auto bg-black/80 p-4 rounded-2xl text-white backdrop-blur-xl border border-white/10 shadow-2xl transition-all animate-in fade-in slide-in-from-left-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Voyage Protocol</div>
          </div>

          <div className="grid grid-cols-2 md:flex md:flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Elapsed Time</p>
              <p className="text-lg font-black tracking-tight">{elapsedMinutes < 1 ? '< 1m' : `${elapsedMinutes}m`}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Distance Covered</p>
              <p className="text-lg font-black tracking-tight">{tripStats.distanceTraveled.toFixed(2)} <span className="text-[10px] text-neutral-500">KM</span></p>
            </div>

            {(tripStats as any).totalDistance ? (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Remaining</p>
                  <p className="text-lg font-black tracking-tight text-indigo-400">
                    {Math.max(0, (tripStats as any).totalDistance - tripStats.distanceTraveled).toFixed(2)} <span className="text-[10px] opacity-50">KM</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">ETA</p>
                  <p className="text-lg font-black tracking-tight text-emerald-400">
                    {Math.max(1, Math.ceil(((tripStats as any).totalDistance - tripStats.distanceTraveled) / 50 * 60))} <span className="text-[10px] opacity-50">MIN</span>
                  </p>
                </div>
              </>
            ) : null}

            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Checkpoints</p>
              <p className="text-lg font-black tracking-tight">{tripStats.checkpointsReached}</p>
            </div>
          </div>
        </div>
      )}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={userLocation ? 14 : 13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{ draggableCursor: mapClickEnabled || checkpointMode === "create" ? "crosshair" : "grab" }}
      >
        {Object.entries(positions).map(([id, pos]) => {
          const m = id === user?.id ? user : room?.members?.find(mem => mem.id === id) || (room?.leader?.id === id ? room.leader : null);
          const initials = m?.name ? m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
          const icon = m?.avatarUrl && loadedAvatarIcons.has(m.id)
            ? loadedAvatarIcons.get(m.id)!
            : createAvatarSVG(initials, m?.id ? getMemberColor(m.id) : "#4F46E5");
          return (
            <Marker
              key={id}
              position={{ lat: pos.lat, lng: pos.lng }}
              icon={icon}
              title={m?.name || "Member"}
              onClick={() => map?.panTo({ lat: pos.lat, lng: pos.lng })}
            />
          );
        })}
        {destination && (
          <Marker
            position={{ lat: destination.lat, lng: destination.lng }}
            icon={{ path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#000000", strokeWeight: 2, scale: 6 }}
          />
        )}
        {checkpoints.map(cp => (
          <Marker
            key={cp._id}
            position={{ lat: cp.location.lat, lng: cp.location.lng }}
            icon={createFlagIcon()}
            title={cp.title}
            onClick={() => map?.panTo({ lat: cp.location.lat, lng: cp.location.lng })}
          />
        ))}
        {destination && routePath && (
          <Polyline
            key={`route-${destination.lat}-${destination.lng}`}
            path={routePath}
            options={{ strokeColor: "#22c55e", strokeOpacity: 0.9, strokeWeight: 4 }}
          />
        )}
      </GoogleMap>
      <DistanceLogic />
      <NavigationLogic onArrival={() => {
        playCelebrationSound();
        triggerCelebration();
        // Clear route locally for now, backend event usually handles full end but this is client feedback
        setRoutePath(null);
        showNotification("You have arrived!", "success", 5000, "system");
      }} />
    </div>
  );
};
