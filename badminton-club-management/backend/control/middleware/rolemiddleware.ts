// control/middleware/roleMiddleware.ts  - Checks if req.user.role matches the required role

 import { Request, Response, NextFunction } from 'express';
 import { AuthRequest } from '../../types/AuthRequest';
 
 // ✅ Single-role middleware
 export const rolemiddleware = (allowedRole: string) => {
   return (req: AuthRequest, res: Response, next: NextFunction) => {
     const user = req.user;
 
     if (typeof user !== 'object' || user === null || !('role' in user)) {
       return res.status(403).json({ message: 'Access denied: Invalid token payload' });
     }
 
     if (user.role !== allowedRole) {
       return res.status(403).json({ message: 'Access denied: Insufficient role' });
     }
 
     next();
   };
 };
 
 // ✅ Multi-role middleware
 export const rolesAllowed = (allowedRoles: string[]) => {
   return (req: AuthRequest, res: Response, next: NextFunction) => {
     const user = req.user;
 
     if (typeof user !== 'object' || user === null || !('role' in user)) {
       return res.status(403).json({ message: 'Access denied: Invalid token payload' });
     }
 
     const userRole = user.role?.replace(/\s+/g, '');
 
     const matched = allowedRoles.some(role => role.replace(/\s+/g, '') === userRole);
     if (!matched) {
       return res.status(403).json({ message: 'Access denied: Insufficient role' });
     }
 
     next();
   };
 };
 
 // ✅ Named single-role exports
 export const superAdminOnly = rolemiddleware('SuperAdmin');
 export const clubAdminOnly = rolemiddleware('ClubAdmin');
 export const coachOnly = rolemiddleware('IndependentCoach');
 export const tournamentOrganiserOnly = rolemiddleware('TournamentOrganiser');
 export const parentOnly = rolemiddleware('Parents');
 



