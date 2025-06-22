// control/middleware/authMiddleware.ts
// Middleware: Authenticates JWT and sets req.user for downstream access

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthPayload } from '../../types/AuthRequest';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  console.log('Decoded user:', req.user);


  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      userId: decoded.userId,
      email: decoded.email,
      clubId: decoded.clubId,
      clubName: decoded.clubName,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
