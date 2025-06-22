// control/middleware/roleMiddleware.ts  - Checks if req.user.role matches the required role

import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { AuthRequest } from '../../types/AuthRequest';
/**
 * Middleware factory to allow only specific roles
 */
 export const rolemiddleware = (allowedRole: string) => {
  //return (req: Request, res: Response, next: NextFunction) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = req.user;
    //const user = (req as any).user;

    // ✅ Check if user is an object (JwtPayload) and has 'role'
    if (typeof user !== 'object' || user === null || !('role' in user)) {
      return res.status(403).json({ message: 'Access denied: Invalid token payload' });
    }

    if (user.role !== allowedRole) {
      return res.status(403).json({ message: 'Access denied: Insufficient role' });
    }

    next();
  };
};

export const superAdminOnly = rolemiddleware('Super Admin');
export const clubAdminOnly = rolemiddleware('Club Admin');
export const coachOnly = rolemiddleware('Independent Coach');
export const tournamentOrganiserOnly = rolemiddleware('Tournament Organiser');
export const parentOnly = rolemiddleware('Parents');




