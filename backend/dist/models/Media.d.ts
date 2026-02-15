import mongoose, { Document, Types } from "mongoose";
export interface IMedia extends Document {
    trip: Types.ObjectId;
    uploadedBy: Types.ObjectId;
    url: string;
    publicId: string;
    caption?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Media: mongoose.Model<IMedia, {}, {}, {}, mongoose.Document<unknown, {}, IMedia, {}, mongoose.DefaultSchemaOptions> & IMedia & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMedia>;
//# sourceMappingURL=Media.d.ts.map