import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

// Define a type for your decoded JWT payload for better type safety
export interface DecodedToken extends JwtPayload {
  role: string;
}

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed token.' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;

    if (decoded.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Admin access required.' });
    }

    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export default adminAuth;
