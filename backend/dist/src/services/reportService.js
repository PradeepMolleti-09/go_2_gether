"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTripReportPdf = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const Trip_1 = require("../models/Trip");
const Media_1 = require("../models/Media");
const buildTripReportPdf = async (tripId) => {
    const trip = await Trip_1.Trip.findById(tripId).populate("room").lean();
    if (!trip) {
        const err = new Error("Trip not found");
        err.status = 404;
        throw err;
    }
    const room = trip.room;
    const mediaCount = await Media_1.Media.countDocuments({ trip: trip._id });
    const doc = new pdfkit_1.default({ margin: 50 });
    const chunks = [];
    return await new Promise((resolve, reject) => {
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));
        doc.fontSize(20).text("Go2Gether Trip Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Room code: ${room?.code ?? "—"}`);
        doc.text(`Trip ID: ${tripId}`);
        doc.text(`Status: ${trip.status}`);
        doc.text(`Start: ${trip.startTime ? new Date(trip.startTime).toISOString() : "—"}`);
        doc.text(`End: ${trip.endTime ? new Date(trip.endTime).toISOString() : "—"}`);
        if (trip.destination) {
            doc.text(`Destination: ${trip.destination.address ?? ""} (${trip.destination.lat}, ${trip.destination.lng})`);
        }
        doc.moveDown();
        doc.text(`Media items: ${mediaCount}`);
        doc.end();
    });
};
exports.buildTripReportPdf = buildTripReportPdf;
//# sourceMappingURL=reportService.js.map