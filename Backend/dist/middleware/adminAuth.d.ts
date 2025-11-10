import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
export interface DecodedToken extends JwtPayload {
    role: string;
}
declare const adminAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default adminAuth;
//# sourceMappingURL=adminAuth.d.ts.map