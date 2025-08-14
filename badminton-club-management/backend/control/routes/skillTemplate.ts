// routes/skillTemplate.routes.ts
import express from 'express';
import { authenticateJWT } from '../middleware/authenticateJWT';
import {
  getSkillTemplate,            // list (system + club)
  updateSkillTemplate,         // create/update
  prepareSyncPreview,          // preview
  syncTemplateToPlayers,       // apply + set default
  getActiveTemplateForClub  // active template for a club
} from '../../controllers/skillTemplatecontroller';

const router = express.Router();

// control/routes/skillTemplate.ts
router.get('/active', authenticateJWT, getActiveTemplateForClub); // <- active via query ?clubId=
router.get('/:clubId', authenticateJWT, getSkillTemplate);
// Create or update a template (this is the one your Manager should call)
//router.put('/:clubId', authenticateJWT, saveSkillTemplate);
router.put('/:clubId', authenticateJWT, updateSkillTemplate);
router.post('/sync-preview', authenticateJWT, prepareSyncPreview);
router.post('/sync-players', authenticateJWT, syncTemplateToPlayers);




export default router;
