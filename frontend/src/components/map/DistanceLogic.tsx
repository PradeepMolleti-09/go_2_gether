import { useState, useEffect } from "react";
import { useMapContext } from "../../context/MapContext";
import { useRoom } from "../../context/RoomContext";

export const DistanceLogic = () => {
    const { userLocation, memberPositions } = useMapContext();
    const { room } = useRoom();
    const [alertShown, setAlertShown] = useState<number>(0);

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

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        if (!userLocation || !room || !memberPositions) return;

        // Check distance to all other members
        Object.values(memberPositions).forEach((pos: any) => {
            // Skip self (if memberPositions includes self, usually it does not or we filter)
            // But memberPositions logic in MapContainer includes self as 'self' or userId

            // We want to check if ANY member is > 100m (0.1km) away from US, or if we are the leader, check everyone?
            // "others are out of radius" -> implies if I am in the group, and someone is far away.
            // Let's just check distance from ME to everyone else for now.

            // Actually, memberPositions key is userId.
            // If checking distance between userLocation and pos
            const dist = haversineKm(userLocation, { lat: pos.lat, lng: pos.lng });
            if (dist > 0.5) { // 500 meters
                // Throttling alert
                const now = Date.now();
                if (now - alertShown > 10000) { // Alert every 10 seconds max
                    speak("Warning: A member is out of the safety radius!");
                    setAlertShown(now);
                }
            }
        });

    }, [userLocation, memberPositions, room, alertShown]);

    return null; // Logic only component
};
