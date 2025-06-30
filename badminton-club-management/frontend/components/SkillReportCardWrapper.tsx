import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SkillProgressVisual from './VisualSkillReport';

interface SkillReportCardWrapperProps {
  player: any;
  onClose: () => void;
}

const SkillReportCardWrapper: React.FC<SkillReportCardWrapperProps> = ({ player, onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>📊 Skill Progress Report</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <SkillProgressVisual player={player} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillReportCardWrapper;

 
 
 {/*
 
 // components/SkillReportCardWrapper.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SkillProgressVisual from './VisualSkillReport';

interface SkillReportCardWrapperProps {
  onClose: () => void;
}

const SkillReportCardWrapper = ({ onClose }: SkillReportCardWrapperProps) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>📊 Skill Progress Report</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <SkillProgressVisual />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillReportCardWrapper;



*/}





