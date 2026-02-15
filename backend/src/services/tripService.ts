import { Types } from "mongoose";
import { Trip } from "../models/Trip";
import { Room } from "../models/Room";
import { Checkpoint } from "../models/Checkpoint";

export const startTrip = async (roomId: string, destination?: {
  lat: number;
  lng: number;
  address?: string;
}) => {
  const room = await Room.findById(roomId);
  if (!room) {
    const err = new Error("Room not found") as any;
    err.status = 404;
    throw err;
  }

  const trip = await Trip.create({
    room: new Types.ObjectId(roomId),
    destination,
    startTime: new Date(),
    status: "ongoing",
  });

  room.activeTrip = trip._id;
  await room.save();

  return trip;
};

export const endTrip = async (roomId: string) => {
  const room = await Room.findById(roomId);
  if (!room || !room.activeTrip) {
    const err = new Error("Active trip not found") as any;
    err.status = 404;
    throw err;
  }

  const trip = await Trip.findById(room.activeTrip);
  if (!trip) {
    const err = new Error("Trip not found") as any;
    err.status = 404;
    throw err;
  }

  trip.status = "completed";
  trip.endTime = new Date();
  await trip.save();

  room.activeTrip = undefined;
  await room.save();

  return trip;
};

export const setDestination = async (
  roomId: string,
  destination: { lat: number; lng: number; address?: string }
) => {
  const room = await Room.findById(roomId);
  if (!room || !room.activeTrip) {
    const err = new Error("Active trip not found") as any;
    err.status = 404;
    throw err;
  }
  const trip = await Trip.findById(room.activeTrip);
  if (!trip) {
    const err = new Error("Trip not found") as any;
    err.status = 404;
    throw err;
  }
  trip.destination = destination;
  await trip.save();
  return trip;
};

export const createCheckpoint = async (params: {
  tripId: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  createdByUserId: string;
}) => {
  const checkpoint = await Checkpoint.create({
    trip: new Types.ObjectId(params.tripId),
    title: params.title,
    description: params.description,
    location: { lat: params.lat, lng: params.lng },
    createdBy: new Types.ObjectId(params.createdByUserId),
  });
  return checkpoint;
};

export const getCheckpoints = async (tripId: string) => {
  const checkpoints = await Checkpoint.find({ trip: new Types.ObjectId(tripId) }).populate("createdBy", "name avatarUrl");
  return checkpoints;
};

export const deleteCheckpoint = async (checkpointId: string) => {
  const checkpoint = await Checkpoint.findByIdAndDelete(checkpointId);
  if (!checkpoint) {
    const err = new Error("Checkpoint not found") as any;
    err.status = 404;
    throw err;
  }
  return checkpoint;
};

