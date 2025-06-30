'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SkillExportCard from '@/components/SkillExportCard';

interface SkillExportCardWrapperProps {
  playerName: string;
  playerLevel?: string;
  playerPhoto?: string;
  skillMatrix?: Record<string, any>;
  skillHistory?: any;
  coachName?: string;
  onClose: () => void;
}

const SkillExportCardWrapper = ({
  playerName,
  playerLevel = 'N/A',
  playerPhoto = '',
  skillMatrix = {},
  skillHistory = [],
  coachName = '',
  onClose
}: SkillExportCardWrapperProps) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Skill Export View</DialogTitle>
        </DialogHeader>
        <SkillExportCard
          playerName={playerName}
          playerLevel={playerLevel}
          playerPhoto={playerPhoto}
          skillMatrix={skillMatrix}
          skillHistory={skillHistory}
          coachName={coachName}
        />
        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillExportCardWrapper;
