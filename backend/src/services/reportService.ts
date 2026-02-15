import PDFDocument from "pdfkit";
import { Trip } from "../models/Trip";
import { Room } from "../models/Room";
import { Media } from "../models/Media";

export const buildTripReportPdf = async (tripId: string): Promise<Buffer> => {
  const trip = await Trip.findById(tripId).populate("room").lean();
  if (!trip) {
    const err = new Error("Trip not found") as any;
    err.status = 404;
    throw err;
  }

  const room = (trip.room as any) as Awaited<ReturnType<typeof Room.findById>>;
  const mediaCount = await Media.countDocuments({ trip: trip._id });

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    doc.fontSize(20).text("Go2Gether Trip Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Room code: ${(room as any)?.code ?? "—"}`);
    doc.text(`Trip ID: ${tripId}`);
    doc.text(`Status: ${trip.status}`);
    doc.text(
      `Start: ${trip.startTime ? new Date(trip.startTime).toISOString() : "—"}`
    );
    doc.text(
      `End: ${trip.endTime ? new Date(trip.endTime).toISOString() : "—"}`
    );
    if (trip.destination) {
      doc.text(
        `Destination: ${trip.destination.address ?? ""} (${trip.destination.lat}, ${trip.destination.lng})`
      );
    }

    doc.moveDown();
    doc.text(`Media items: ${mediaCount}`);

    doc.end();
  });
};

