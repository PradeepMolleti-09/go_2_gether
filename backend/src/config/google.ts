import fetch from "node-fetch";
import { env } from "./env";

const GOOGLE_MAPS_BASE = "https://maps.googleapis.com/maps/api";

export const getDirections = async (origin: string, destination: string) => {
  const url = new URL(`${GOOGLE_MAPS_BASE}/directions/json`);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("key", env.googleMapsApiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch directions");
  }
  return res.json();
};

