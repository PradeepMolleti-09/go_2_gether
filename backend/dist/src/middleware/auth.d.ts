import { Request, Response, NextFunction } from "express";
export interface AuthUser {
    id: string;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map