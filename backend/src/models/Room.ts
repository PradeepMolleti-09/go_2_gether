import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRoom extends Document {
  code: string;
  qrData?: string;
  leader: Types.ObjectId;
  members: Types.ObjectId[];
  activeTrip?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true },
    qrData: { type: String },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    activeTrip: { type: Schema.Types.ObjectId, ref: "Trip" },
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>("Room", roomSchema);

