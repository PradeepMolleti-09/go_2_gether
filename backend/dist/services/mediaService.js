"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTripMedia = exports.uploadTripPhoto = void 0;
const mongoose_1 = require("mongoose");
const cloudinary_1 = require("../config/cloudinary");
const Media_1 = require("../models/Media");
const uploadTripPhoto = async (params) => {
    const res = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinary.uploader.upload_stream({
            folder: "go2gether/trips",
            resource_type: "image",
        }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
            });
        });
        stream.end(params.buffer);
    });
    const media = await Media_1.Media.create({
        trip: new mongoose_1.Types.ObjectId(params.tripId),
        uploadedBy: new mongoose_1.Types.ObjectId(params.uploadedByUserId),
        url: res.secure_url,
        publicId: res.public_id,
        caption: params.caption,
    });
    return media;
};
exports.uploadTripPhoto = uploadTripPhoto;
const listTripMedia = async (tripId) => {
    return Media_1.Media.find({ trip: new mongoose_1.Types.ObjectId(tripId) })
        .sort({ createdAt: -1 })
        .lean();
};
exports.listTripMedia = listTripMedia;
//# sourceMappingURL=mediaService.js.map