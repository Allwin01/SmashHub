'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SkillEntry {
  skillName: string;
  category: string;
  history: { date: string; value: number }[];
  updatedBy: string;
}

interface SkillReportCardProps {
  playerName: string;
  playerLevel?: string;
  playerPhoto?: string;
  reportDate: string;
  skills: SkillEntry[];
}

const SkillReportCard: React.FC<SkillReportCardProps> = ({ playerName, playerLevel, playerPhoto, reportDate, skills }) => {
  const [coachComment, setCoachComment] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleExportPDF = async (returnAsBase64 = false) => {
    const input = document.getElementById('report-card');
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    if (returnAsBase64) {
      return pdf.output('datauristring');
    } else {
      pdf.save(`${playerName.replace(/\s/g, '_')}_Skill_Report.pdf`);
    }
  };

  const handleSendEmail = async () => {
    setConfirmDialogOpen(false);

    const pdfDataUri = await handleExportPDF(true);

    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          coachComment,
          pdfDataUri
        })
      });

      if (!response.ok) throw new Error('Failed to send email');
      alert('📧 Report sent to registered email address.');
    } catch (err) {
      console.error('❌ Email sending failed:', err);
      alert('❌ Failed to send email.');
    }
  };

  return (
    <>
      <Card id="report-card" className="p-4 w-full bg-white">
        <CardHeader className="flex items-center gap-4">
          {playerPhoto && (
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-600">
              <Image src={playerPhoto} alt="Player Photo" width={80} height={80} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <CardTitle className="text-2xl font-bold">{playerName}</CardTitle>
            <p className="text-sm text-gray-500">Level: {playerLevel}</p>
            <p className="text-sm text-gray-400">Report Date: {reportDate}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {skills.map((skill) => (
            <div key={skill.skillName} className="border p-4 rounded shadow-sm">
              <h4 className="font-semibold mb-1">{skill.category} - {skill.skillName}</h4>
              <p className="text-sm text-gray-600 mb-2">Updated by: {skill.updatedBy}</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={skill.history}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}

          <div className="mt-6">
            <label className="block font-semibold mb-1 text-gray-700">Coach Comments</label>
            <textarea
              value={coachComment}
              onChange={(e) => setCoachComment(e.target.value)}
              className="w-full p-2 border rounded min-h-[100px]"
              placeholder="Enter comments about the player's progress..."
            />
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button onClick={() => handleExportPDF(false)}>Download PDF</Button>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(true)}>Send Report</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Email Send</DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-sm">Are you sure you want to email this report to the registered parent or guardian?</p>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail}>Yes, Send Report</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SkillReportCard;
