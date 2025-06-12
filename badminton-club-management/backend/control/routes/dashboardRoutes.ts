// 📁 backend/routes/dashboardRoutes.ts
import express, { Request, Response } from 'express';
// import { authenticateToken } from '../middleware/authMiddleware';
// import { authorizeRoles } from '../middleware/roleMiddleware';
import { verifyToken } from '../middleware/authMiddleware';
import {
  superAdminOnly,
  clubAdminOnly,
  coachOnly,
  tournamentOrganiserOnly,
  parentOnly
} from '../middleware/roleMiddleware';


const router = express.Router();


router.get('/superadmin', verifyToken, superAdminOnly, (req, res) => {
  res.json({ message: 'Super Admin dashboard access granted.' });
});

router.get('/clubadmin', verifyToken, clubAdminOnly, (req, res) => {
  res.json({ message: 'Club Admin dashboard access granted.' });
});

router.get('/coach', verifyToken, coachOnly, (req, res) => {
  res.json({ message: 'Coach dashboard access granted.' });
});

router.get('/tournament-organiser', verifyToken, tournamentOrganiserOnly, (req, res) => {
  res.json({ message: 'Tournament Organiser dashboard access granted.' });
});

router.get('/parents', verifyToken, parentOnly, (req, res) => {
  res.json({ message: 'Parents dashboard access granted.' });
});

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
