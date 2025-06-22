import express from 'express';
import { clubAdminOnly } from '../middleware/rolemiddleware';
import { authenticateJWT } from '../middleware/authenticateJWT';
import {
  getPlayers,
  getPlayerById,
  addPlayer,
  updatePlayer,
  deletePlayer,
  updateSkillMatrix,
  checkDuplicatePlayer,getPlayersByClub,markAttendance
} from '../../controllers/playercontrollers';

const router = express.Router();
router.get('/by-club', authenticateJWT, getPlayersByClub);  // GET players mapped to user's club
router.get('/check-duplicate', authenticateJWT,checkDuplicatePlayer);
router.get('/', authenticateJWT, clubAdminOnly, getPlayers); // ✅ Get all players
router.get('/:id', authenticateJWT, clubAdminOnly, getPlayerById); // ✅ Get player by ID




// other routes
router.post('/', authenticateJWT, clubAdminOnly, addPlayer);
router.put('/:id', authenticateJWT, clubAdminOnly, updatePlayer);
router.delete('/:id', authenticateJWT, clubAdminOnly, deletePlayer);
router.put('/:id/skills', authenticateJWT,updateSkillMatrix);
router.post('/attendance', authenticateJWT, markAttendance); // POST attendance marking


  

export default router;
