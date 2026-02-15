import mongoose, { Document, Types } from "mongoose";
export interface IRoom extends Document {
    code: string;
    qrData?: string;
    leader: Types.ObjectId;
    members: Types.ObjectId[];
    activeTrip?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Room: mongoose.Model<IRoom, {}, {}, {}, mongoose.Document<unknown, {}, IRoom, {}, mongoose.DefaultSchemaOptions> & IRoom & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRoom>;
//# sourceMappingURL=Room.d.ts.map