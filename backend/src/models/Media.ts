import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMedia extends Document {
  trip: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  url: string;
  publicId: string;
  caption?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: String,
  },
  { timestamps: true }
);

export const Media = mongoose.model<IMedia>("Media", mediaSchema);

