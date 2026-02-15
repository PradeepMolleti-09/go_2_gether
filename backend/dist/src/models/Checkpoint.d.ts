import mongoose, { Document, Types } from "mongoose";
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
export declare const Checkpoint: mongoose.Model<ICheckpoint, {}, {}, {}, mongoose.Document<unknown, {}, ICheckpoint, {}, mongoose.DefaultSchemaOptions> & ICheckpoint & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICheckpoint>;
//# sourceMappingURL=Checkpoint.d.ts.map