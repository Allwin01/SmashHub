import express from 'express';
import { clubAdminOnly } from '../middleware/rolemiddleware';
import { authenticateJWT } from '../middleware/authenticateJWT';
import {
  getPlayers,
  getPlayerById,
  addPlayer,
  updatePlayer,
  deletePlayerPost,
  updateSkillMatrix,
  checkDuplicatePlayer,getPlayersByClub,markAttendance,getPlayersWithAttendance,updateCoachComment,getCoachComment
} from '../../controllers/playercontrollers';

  // player.routes.ts
const router = express.Router();

router.get('/attendances', authenticateJWT, getPlayersWithAttendance);  // ⬅️ keep before `/:id`
router.get('/by-club', authenticateJWT, getPlayersByClub);
router.get('/check-duplicate', authenticateJWT, checkDuplicatePlayer); // for Add player
router.get('/:id/comment', authenticateJWT, getCoachComment);

router.get('/', authenticateJWT, getPlayers);  // ✅ Get all players - for player card

// CRUD Routes (POST, PUT, DELETE)
router.post('/attendance', authenticateJWT, markAttendance);
router.post('/', authenticateJWT, clubAdminOnly, addPlayer);
router.put('/:id/skills', authenticateJWT, updateSkillMatrix);
router.put('/:id', authenticateJWT, clubAdminOnly, updatePlayer);
router.put('/:id/comments', authenticateJWT, updateCoachComment);
router.delete('/:id', authenticateJWT, clubAdminOnly, deletePlayerPost);

// ❗ Always keep this last to prevent route collision
router.get('/:id', authenticateJWT, getPlayerById);  // ✅ Get player by ID for profile page


export default router;
  