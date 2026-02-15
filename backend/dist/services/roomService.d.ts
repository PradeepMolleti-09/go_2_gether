import { Types } from "mongoose";
export declare const createRoom: (leaderId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Room").IRoom, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Room").IRoom & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const joinRoom: (userId: string, code: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Room").IRoom, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Room").IRoom & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=roomService.d.ts.map