import express from 'express';
//import { recordMatchHistory,getTopPlayersWithHistory,getMatchHistoryByPlayerId  } from '../../controllers/recordMatchHistory';
import { recordMatchHistory, getTopPlayersWithHistory, getMatchHistoryByPlayerId } from '../../controllers/MatchAnalyticscontroller';

  
const router = express.Router();

router.post('/matchHistory', recordMatchHistory);
router.get('/top-players', getTopPlayersWithHistory);
router.get('/matchs/:id', getMatchHistoryByPlayerId);


export default router;
