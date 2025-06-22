// 📁 backend/routes/dashboardRoutes.ts - Route file that uses above middleware to restrict access to controllers


import express from 'express';
import { authenticateJWT } from '../middleware/authenticateJWT';
import {
  superAdminOnly,
  clubAdminOnly,
  coachOnly,
  tournamentOrganiserOnly,
  parentOnly
} from '../middleware/rolemiddleware';

import {
  getSuperAdminDashboard,
  getClubAdminDashboard,
  getCoachDashboard,
  getTournamentOrganiserDashboard,
  getParentsDashboard
} from '../../controllers/dashboardController';

const router = express.Router();

router.get('/superadmin', authenticateJWT, superAdminOnly, getSuperAdminDashboard);
router.get('/clubadmin', authenticateJWT, clubAdminOnly, getClubAdminDashboard);
router.get('/coach', authenticateJWT, coachOnly, getCoachDashboard);
router.get('/tournamentorganiser', authenticateJWT, tournamentOrganiserOnly, getTournamentOrganiserDashboard);
router.get('/parents', authenticateJWT, parentOnly, getParentsDashboard);

export default router;



/**
 * 🧑‍💼 SuperAdmin Dashboard Route
 * Access: SuperAdmin only
 */
//router.get('/superadmin', authenticateToken, authorizeRoles('SuperAdmin'), (req: Request, res: Response) => {
//  res.json({ message: 'Welcome to SuperAdmin Dashboard!' });
//});

/**
 * 🧑‍🏫 Club Admin Dashboard Route
 * Access: Club Admin only
 */
//router.get('/clubadmin', authenticateToken, authorizeRoles('Club Admin'), (req: Request, res: Response) => {
 // res.json({ message: 'Welcome to Club Admin Dashboard!' });
//});

/**
 * 👨‍👩‍👧 Parents Dashboard Route
 * Access: Parents only
 */
//router.get('/parents', authenticateToken, authorizeRoles('Parents'), (req: Request, res: Response) => {
//  res.json({ message: 'Welcome to Parents Dashboard!' });
//});

/**
 * 🧑‍🏸 Independent Coach Dashboard Route
 * Access: Independent Coach only
 */
//router.get('/coach', authenticateToken, authorizeRoles('Independent Coach'), (req: Request, res: Response) => {
//  res.json({ message: 'Welcome to Independent Coach Dashboard!' });
//});

/**
 * 🏆 Tournament Organiser Dashboard Route
 * Access: Tournament Organiser only
 */
//router.get('/tournament-organiser', authenticateToken, authorizeRoles('Tournament Organiser'), (req: Request, res: Response) => {
//  res.json({ message: 'Welcome to Tournament Organiser Dashboard!' });
//});

//export default router;   
