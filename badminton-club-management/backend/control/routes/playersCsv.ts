// routes/playersCsv.ts
import { Router } from 'express';
import { getCsvTemplate, uploadCsv } from '../../controllers/playerCsvController';
import { uploadCsvMulter } from '../middleware/multerCsv';
import { authenticateJWT } from '../middleware/authenticateJWT';


const router = Router();





// PUBLIC
router.get('/template', getCsvTemplate);

// PROTECTED
router.post('/upload', authenticateJWT, uploadCsvMulter.single('file'), uploadCsv);

export default router;
