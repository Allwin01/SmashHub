import express from 'express';
import { getClubAttendanceStatsDaily } from '../../controllers/attendancecontroller';

const router = express.Router();

router.get('/stats-daily', getClubAttendanceStatsDaily);

export default router;
