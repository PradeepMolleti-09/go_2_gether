import mongoose, { Document, Types } from "mongoose";
export interface ITripLocationPoint {
    lat: number;
    lng: number;
    timestamp: Date;
    speedKmh?: number;
}
export interface ITrip extends Document {
    room: Types.ObjectId;
    destination?: {
        lat: number;
        lng: number;
        address?: string;
    };
    startTime?: Date;
    endTime?: Date;
    status: "idle" | "ongoing" | "completed";
    totalDistanceKm?: number;
    averageSpeedKmh?: number;
    maxSpeedKmh?: number;
    locations: ITripLocationPoint[];
}
export declare const Trip: mongoose.Model<ITrip, {}, {}, {}, mongoose.Document<unknown, {}, ITrip, {}, mongoose.DefaultSchemaOptions> & ITrip & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITrip>;
//# sourceMappingURL=Trip.d.ts.map