"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckpoint = exports.setDestination = exports.endTrip = exports.startTrip = void 0;
const mongoose_1 = require("mongoose");
const Trip_1 = require("../models/Trip");
const Room_1 = require("../models/Room");
const Checkpoint_1 = require("../models/Checkpoint");
const startTrip = async (roomId, destination) => {
    const room = await Room_1.Room.findById(roomId);
    if (!room) {
        const err = new Error("Room not found");
        err.status = 404;
        throw err;
    }
    const trip = await Trip_1.Trip.create({
        room: new mongoose_1.Types.ObjectId(roomId),
        destination,
        startTime: new Date(),
        status: "ongoing",
    });
    room.activeTrip = trip._id;
    await room.save();
    return trip;
};
exports.startTrip = startTrip;
const endTrip = async (roomId) => {
    const room = await Room_1.Room.findById(roomId);
    if (!room || !room.activeTrip) {
        const err = new Error("Active trip not found");
        err.status = 404;
        throw err;
    }
    const trip = await Trip_1.Trip.findById(room.activeTrip);
    if (!trip) {
        const err = new Error("Trip not found");
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
exports.endTrip = endTrip;
const setDestination = async (roomId, destination) => {
    const room = await Room_1.Room.findById(roomId);
    if (!room || !room.activeTrip) {
        const err = new Error("Active trip not found");
        err.status = 404;
        throw err;
    }
    const trip = await Trip_1.Trip.findById(room.activeTrip);
    if (!trip) {
        const err = new Error("Trip not found");
        err.status = 404;
        throw err;
    }
    trip.destination = destination;
    await trip.save();
    return trip;
};
exports.setDestination = setDestination;
const createCheckpoint = async (params) => {
    const checkpoint = await Checkpoint_1.Checkpoint.create({
        trip: new mongoose_1.Types.ObjectId(params.tripId),
        title: params.title,
        description: params.description,
        location: { lat: params.lat, lng: params.lng },
        createdBy: new mongoose_1.Types.ObjectId(params.createdByUserId),
    });
    return checkpoint;
};
exports.createCheckpoint = createCheckpoint;
//# sourceMappingURL=tripService.js.map