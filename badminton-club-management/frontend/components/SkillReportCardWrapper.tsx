  

// 🧾 Extended Player Profile with Skill Report Card Dialog
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SkillReportCard from '@/components/SkillReportCard';

interface SkillEntry {
  skillName: string;
  category: string;
  history: { date: string; value: number }[];
  updatedBy: string;
}

interface SkillReportCardWrapperProps {
  playerName: string;
  playerLevel?: string;
  playerPhoto?: string;
  skillMatrix?: Record<string, number>;
  skillHistory?: any;
  coachName?: string;
  onClose: () => void;
}

const SkillReportCardWrapper = ({
  playerName,
  playerLevel = 'N/A',
  playerPhoto = '',
  skillMatrix = {},
  skillHistory = [],
  coachName = '',
  onClose
}: SkillReportCardWrapperProps) => {
  // Transform skill history into SkillEntry[] structure
  const combinedSkills: SkillEntry[] = Object.entries(skillMatrix).map(([skill, value]) => {
    const historyPoints = skillHistory.flatMap((entry: any) => {
      const result: { date: string; value: number }[] = [];

      if (entry.skills && typeof entry.skills === 'object') {
        for (const [category, skillsMap] of Object.entries(entry.skills)) {
          for (const [skillName, score] of Object.entries(skillsMap)) {
            if (skillName === skill) {
              result.push({ date: entry.date, value: score });
            }
          }
        }
      }

      return result;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Add current value if not in history
    if (!historyPoints.some(h => h.value === value)) {
      historyPoints.push({ date: new Date().toISOString().split('T')[0], value });
    }

    return {
      skillName: skill,
      category: 'Skill Matrix',
      history: historyPoints,
      updatedBy: coachName || 'Coach'
    };
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Skill Report Preview</DialogTitle>
        </DialogHeader>
        <SkillReportCard
          playerName={playerName}
          playerLevel={playerLevel}
          playerPhoto={playerPhoto}
          reportDate={new Date().toLocaleDateString('en-GB')}
          skills={combinedSkills}
        />
        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillReportCardWrapper;
