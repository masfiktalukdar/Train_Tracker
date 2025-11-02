// By creating a file with a .d.ts extension, we can extend existing types.
// This file adds the `user` property to the Express Request interface.

import type { JwtPayload } from 'jsonwebtoken';
import type { DecodedToken } from './adminAuth';

declare global {
  namespace Express {
    export interface Request {
      user?: DecodedToken;
    }
  }
}