import { Types } from "mongoose";
export declare const uploadTripPhoto: (params: {
    tripId: string;
    uploadedByUserId: string;
    buffer: Buffer;
    mimetype: string;
    caption?: string;
}) => Promise<never>;
export declare const listTripMedia: (tripId: string) => Promise<(import("../models/Media").IMedia & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=mediaService.d.ts.map