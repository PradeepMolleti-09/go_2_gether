import { useRef, useEffect } from "react";
import { useMapContext } from "../../context/MapContext";

const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any pending speech
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

// Calculate bearing between two points
const getBearing = (startLat: number, startLng: number, destLat: number, destLng: number) => {
    const startLatRad = startLat * (Math.PI / 180);
    const startLngRad = startLng * (Math.PI / 180);
    const destLatRad = destLat * (Math.PI / 180);
    const destLngRad = destLng * (Math.PI / 180);

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
    const brng = Math.atan2(y, x);
    return (brng * 180 / Math.PI + 360) % 360; // 0-360 degrees
};

// Get turn direction based on current bearing and next bearing
const getTurnInstruction = (currentBearing: number, nextBearing: number) => {
    let diff = nextBearing - currentBearing;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;

    if (diff > 45 && diff < 135) return "Turn right";
    if (diff < -45 && diff > -135) return "Turn left";
    if (diff > 10 && diff <= 45) return "Slight right";
    if (diff < -10 && diff >= -45) return "Slight left";
    return null; // Go straight
};

export const NavigationLogic = ({ onArrival }: { onArrival?: () => void }) => {
    const { userLocation, routePath, destination } = useMapContext();
    const lastInstruction = useRef<string | null>(null);
    const lastSpokenIndex = useRef<number>(-1);

    useEffect(() => {
        if (!userLocation || !routePath || routePath.length < 2) return;

        // Find nearest point on route to determine current progress (simple proximity)
        // In a real app we'd project to the polyline, but finding closest vertex is okay for MVP
        let closestIndex = -1;
        let minDistance = Infinity;

        routePath.forEach((pt, idx) => {
            const dist = haversineKm(userLocation, pt);
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = idx;
            }
        });

        // If we are near the end
        if (destination && haversineKm(userLocation, destination) < 0.015) { // 15 meters
            if (lastInstruction.current !== "arrived") {
                speak("You have arrived at your destination");
                lastInstruction.current = "arrived";
                if (onArrival) onArrival();
            }
            return;
        }

        if (closestIndex === -1 || closestIndex >= routePath.length - 1) return;

        // Lookhead for turns (e.g. next 50-100 meters)
        // Let's just look at the next segment change for generic turn detection
        // Current segment vector
        const currentPt = routePath[closestIndex];
        const nextPt = routePath[closestIndex + 1];

        // Check if we advanced significantly since last instruction
        if (closestIndex <= lastSpokenIndex.current) return;

        const distanceToNext = haversineKm(userLocation, nextPt);

        // If approaching a vertex (turn)
        if (distanceToNext < 0.05 && closestIndex + 2 < routePath.length) { // 50 meters
            const nextSegmentPt = routePath[closestIndex + 2];

            const bearing1 = getBearing(currentPt.lat, currentPt.lng, nextPt.lat, nextPt.lng);
            const bearing2 = getBearing(nextPt.lat, nextPt.lng, nextSegmentPt.lat, nextSegmentPt.lng);

            const turn = getTurnInstruction(bearing1, bearing2);
            if (turn) {
                const instruction = `In 50 meters, ${turn}`;
                if (lastInstruction.current !== instruction) {
                    // speak(instruction); // Disabled as per user request
                    lastInstruction.current = instruction;
                    lastSpokenIndex.current = closestIndex;
                }
            }
        }

    }, [userLocation, routePath, destination, onArrival]);

    return null;
};
