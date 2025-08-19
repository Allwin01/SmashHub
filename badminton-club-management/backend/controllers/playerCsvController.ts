// controllers/playerCsvController.ts



import { Request, Response } from 'express';
import Player from '../control/models/Player';
import { buildCsvTemplate, parseAndValidateCsv } from '../services/playerCsv.service';

export async function getCsvTemplate(_req: Request, res: Response) {
  const { filename, csv } = buildCsvTemplate();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(csv);
}

export async function uploadCsv(req: Request, res: Response) {
  try {
    const clubId = String(req.body?.clubId || '').trim();
    if (!clubId) return res.status(400).json({ message: 'clubId is required' });

    const file = req.file;
    if (!file?.buffer) return res.status(400).json({ message: 'CSV file is missing' });

    const mode: 'all' | 'partial' =
      String(req.query.mode || 'all').toLowerCase() === 'partial' ? 'partial' : 'all';

    const result = await parseAndValidateCsv(file.buffer, clubId, mode);

    if (result.hasErrors && result.mode !== 'partial') {
      return res.status(400).json({
        message: 'Validation failed. No rows imported.',
        imported: 0,
        failed: result.report.filter(r => r.status === 'error').length,
        report: result.report,
      });
    }

    let inserted = 0;
    if (result.docsToInsert.length) {
      const insertedDocs = await Player.insertMany(result.docsToInsert, { ordered: false });
      inserted = insertedDocs.length;
    }

    return res.status(result.hasErrors ? 207 : 200).json({
      message: result.hasErrors
        ? 'Partial success: some rows failed validation'
        : 'All rows imported successfully',
      imported: inserted,
      failed: result.report.filter(r => r.status === 'error').length,
      report: result.report,
    });
  } catch (err: any) {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'CSV too large (max 2MB)' });
    }
    console.error('CSV upload error:', err);
    return res.status(500).json({ message: 'Server error during CSV upload' });
  }
}
