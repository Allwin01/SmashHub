import express from 'express';
import { getCoachList } from '../../controllers/coachController';
import { authenticateJWT } from '../middleware/authenticateJWT';

const router = express.Router();

router.get('/', authenticateJWT, getCoachList);

export default router;
