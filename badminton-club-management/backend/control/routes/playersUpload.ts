import { Router } from 'express';
import { getCsvTemplate, uploadCsv } from '../../controllers/playerCsvController';
import { authenticateJWT } from '../middleware/authenticateJWT';
import { uploadCsvMulter } from '../middleware/multerCsv';

const router = Router();

// GET /api/players/csv-template
router.get('/csv-template', getCsvTemplate);

// POST /api/players/upload
router.post(
  '/upload',
  authenticateJWT,
  uploadCsvMulter.single('file'),
  uploadCsv
);

export default router;
