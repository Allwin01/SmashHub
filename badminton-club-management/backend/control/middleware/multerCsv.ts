// control/middleware/multerCsv.ts
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

export const uploadCsvMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ok =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      /\.csv$/i.test(file.originalname);

    if (ok) cb(null, true);
    else cb(new Error('Only CSV files are allowed'));
  },
});
