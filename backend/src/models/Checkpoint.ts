import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICheckpoint extends Document {
  trip: Types.ObjectId;
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const checkpointSchema = new Schema<ICheckpoint>(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    title: { type: String, required: true },
    description: String,
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Checkpoint = mongoose.model<ICheckpoint>(
  "Checkpoint",
  checkpointSchema
);

