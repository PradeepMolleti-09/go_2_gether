import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
export declare const requireLeaderForRoom: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=permissions.d.ts.map