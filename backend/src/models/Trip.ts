import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITripLocationPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  speedKmh?: number;
}

export interface ITrip extends Document {
  room: Types.ObjectId;
  destination?: {
    lat: number;
    lng: number;
    address?: string;
  };
  startTime?: Date;
  endTime?: Date;
  status: "idle" | "ongoing" | "completed";
  totalDistanceKm?: number;
  averageSpeedKmh?: number;
  maxSpeedKmh?: number;
  locations: ITripLocationPoint[];
}

const tripSchema = new Schema<ITrip>(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    destination: {
      lat: Number,
      lng: Number,
      address: String,
    },
    startTime: Date,
    endTime: Date,
    status: {
      type: String,
      enum: ["idle", "ongoing", "completed"],
      default: "idle",
    },
    totalDistanceKm: Number,
    averageSpeedKmh: Number,
    maxSpeedKmh: Number,
    locations: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
        speedKmh: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Trip = mongoose.model<ITrip>("Trip", tripSchema);

