import { Types } from "mongoose";
import { cloudinary } from "../config/cloudinary";
import { Media } from "../models/Media";

export const uploadTripPhoto = async (params: {
  tripId: string;
  uploadedByUserId: string;
  buffer: Buffer;
  mimetype: string;
  caption?: string;
}) => {
  const res = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "go2gether/trips",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    stream.end(params.buffer);
  });

  const media = await Media.create({
    trip: new Types.ObjectId(params.tripId),
    uploadedBy: new Types.ObjectId(params.uploadedByUserId),
    url: res.secure_url,
    publicId: res.public_id,
    caption: params.caption,
  });

  return media;
};

export const listTripMedia = async (tripId: string) => {
  return Media.find({ trip: new Types.ObjectId(tripId) })
    .sort({ createdAt: -1 })
    .lean();
};

export const deleteTripMedia = async (mediaId: string, userId: string) => {
  const media = await Media.findById(mediaId);
  if (!media) {
    throw new Error("Media not found");
  }

  // Check if user is the one who uploaded it
  if (media.uploadedBy.toString() !== userId) {
    throw new Error("Unauthorized to delete this media");
  }

  // Delete from Cloudinary
  if (media.publicId) {
    await cloudinary.uploader.destroy(media.publicId);
  }

  // Delete from DB
  await Media.findByIdAndDelete(mediaId);
  return media;
};

