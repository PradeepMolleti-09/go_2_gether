import { Types } from "mongoose";
export declare const uploadTripPhoto: (params: {
    tripId: string;
    uploadedByUserId: string;
    buffer: Buffer;
    mimetype: string;
    caption?: string;
}) => Promise<import("mongoose").Document<unknown, {}, import("../models/Media").IMedia, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Media").IMedia & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const listTripMedia: (tripId: string) => Promise<(import("../models/Media").IMedia & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare const deleteTripMedia: (mediaId: string, userId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Media").IMedia, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Media").IMedia & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=mediaService.d.ts.map