// 📁 control/middleware/roleMiddleware.ts
import { Request, Response, NextFunction } from 'express';

const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};

export const superAdminOnly = checkRole(['Super Admin']);
export const clubAdminOnly = checkRole(['Club Admin']);
export const coachOnly = checkRole(['Independent Coach']);
export const parentOnly = checkRole(['Parents']);
export const tournamentOrganiserOnly = checkRole(['Tournament Organiser']);
