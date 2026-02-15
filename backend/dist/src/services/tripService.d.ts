import { Types } from "mongoose";
export declare const startTrip: (roomId: string, destination?: {
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
}) => Promise<import("mongoose").Document<unknown, {}, import("../models/Checkpoint").ICheckpoint, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Checkpoint").ICheckpoint & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getCheckpoints: (tripId: string) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Checkpoint").ICheckpoint, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Checkpoint").ICheckpoint & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
})[]>;
export declare const deleteCheckpoint: (checkpointId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Checkpoint").ICheckpoint, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Checkpoint").ICheckpoint & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=tripService.d.ts.map