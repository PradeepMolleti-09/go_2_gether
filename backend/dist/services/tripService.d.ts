import { Types } from "mongoose";
export declare const startTrip: (roomId: string, destination?: {
    lat: number;
    lng: number;
    address?: string;
}) => Promise<never>;
export declare const endTrip: (roomId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Trip").ITrip, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Trip").ITrip & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const setDestination: (roomId: string, destination: {
    lat: number;
    lng: number;
    address?: string;
}) => Promise<import("mongoose").Document<unknown, {}, import("../models/Trip").ITrip, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Trip").ITrip & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const createCheckpoint: (params: {
    tripId: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    createdByUserId: string;
}) => Promise<never>;
//# sourceMappingURL=tripService.d.ts.map