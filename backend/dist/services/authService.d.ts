export declare const verifyGoogleToken: (idToken: string) => Promise<{
    user: import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    token: string;
}>;
//# sourceMappingURL=authService.d.ts.map