import express from 'express';
import { updateMatchSummary,getMatchSummary } from '../../controllers/matchSummaryController';



const router = express.Router();


// GET summary
router.get('/', getMatchSummary);

// POST update
router.post('/', updateMatchSummary);

export default router;