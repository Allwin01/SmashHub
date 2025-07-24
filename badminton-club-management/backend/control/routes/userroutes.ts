// backend/routes/users.routes.ts
import express from 'express';
import { createLogin, updateStatus, savePermissions,getUsersByClubId,getUserByEmail } from '../../controllers/userController';
import { authenticateJWT } from '../middleware/authenticateJWT';

const router = express.Router();

router.post('/create-login', authenticateJWT, createLogin);
router.post('/update-status', authenticateJWT, updateStatus);
router.post('/save-permissions', authenticateJWT, savePermissions);
router.get('/users', authenticateJWT, getUsersByClubId);
router.get('/users', authenticateJWT, getUserByEmail);
export default router;
