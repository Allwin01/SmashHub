// backend/control/routes/emailReport.ts

import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

interface EmailReportRequestBody {
  playerName: string;
  coachComment?: string;
  pdfDataUri: string;
}

router.post('/send-report', async (req: Request<{}, {}, EmailReportRequestBody>, res: Response) => {
  const { playerName, coachComment, pdfDataUri } = req.body;

  if (!pdfDataUri || !playerName) {
    return res.status(400).json({ error: 'Missing report data' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const base64Data = pdfDataUri.split(';base64,').pop();

    const mailOptions = {
      from: 'SmashHub Reports <noreply@smashhub.com>',
      to: 'parent@example.com', // TODO: Fetch dynamically from DB
      subject: `📋 Skill Report Card for ${playerName}`,
      text: coachComment || 'Skill report is attached.',
      attachments: [
        {
          filename: `${playerName.replace(/\s/g, '_')}_Skill_Report.pdf`,
          content: Buffer.from(base64Data || '', 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
