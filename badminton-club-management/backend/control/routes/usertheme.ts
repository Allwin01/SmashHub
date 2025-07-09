import express from 'express';

import { authenticateJWT } from '../middleware/authenticateJWT';
import { updateSettings } from  '../../controllers/userController';

const router = express.Router();



router.post('/update-settings', authenticateJWT, updateSettings);

export default router;