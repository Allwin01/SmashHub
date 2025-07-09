import express from 'express';
import { recordMatchHistory,getTopPlayersWithHistory  } from '../../controllers/recordMatchHistory';
const router = express.Router();

router.post('/matchHistory', recordMatchHistory);


router.get('/top-players', getTopPlayersWithHistory);

export default router;
