"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirections = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const env_1 = require("./env");
const GOOGLE_MAPS_BASE = "https://maps.googleapis.com/maps/api";
const getDirections = async (origin, destination) => {
    const url = new URL(`${GOOGLE_MAPS_BASE}/directions/json`);
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("key", env_1.env.googleMapsApiKey);
    const res = await (0, node_fetch_1.default)(url.toString());
    if (!res.ok) {
        throw new Error("Failed to fetch directions");
    }
    return res.json();
};
exports.getDirections = getDirections;
//# sourceMappingURL=google.js.map