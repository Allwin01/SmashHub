
// components/CourtCard.tsx — modal scoring + guest avatars
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { flushSync } from 'react-dom';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Player } from '@/types';

const getGender = (p?: Player | null) => (p as any)?.gender ?? (p as any)?.sex ?? '';
const isGuestPlayer = (p?: Player | null) =>
  Boolean(p && ((p as any).isGuest || (p as any).playerType === 'Guest' || (p as any).tags?.includes?.('guest')));

const DroppableSlot = ({ children, courtNo, index }: { children: React.ReactNode; courtNo: number; index: number }) => {
  const id = `slot-${courtNo}-${index}`;
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 h-full border-white/40 flex items-center justify-center p-2 transition-all duration-300 ${isOver ? 'bg-yellow-200/30 border-2 border-yellow-300 shadow-inner scale-105' : 'border-r'}`}
    >
      {children}
    </div>
  );
};

const DraggablePlayerSlot = ({ player, index, courtNo }: { player: Player | null; index: number; courtNo: number }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: (player as any)?.id ?? (player as any)?._id ?? `empty-${courtNo}-${index}`,
    data: { from: 'court', index, courtNo, player },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 as const } : undefined;

  if (!player) {
    return <div className="bg-white/20 w-full h-full rounded-xl border border-dashed border-white/40 text-white text-xs flex items-center justify-center">Empty</div>;
  }

  const gender = `${getGender(player)}`;
  const isGuest = isGuestPlayer(player);
  const gradient = gender === 'Female' ? 'from-pink-500 to-fuchsia-500' : 'from-blue-500 to-cyan-500';
  const ring = gender === 'Female' ? 'ring-pink-200' : 'ring-blue-200';
  const imgSrc = (player as any).profileImage || (player as any).imageUrl || '';
  const initials = ((player as any).firstName ?? '')?.slice(0, 1)?.toUpperCase() || '👤';

  return (
    <motion.div
      key={`court-${courtNo}-slot-${index}-${(player as any).id ?? (player as any)._id}`}
      layoutId={`court-${courtNo}-slot-${index}-${(player as any).id ?? (player as any)._id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border border-white text-white cursor-move bg-gradient-to-br ${gradient}`}
    >
      <GripVertical className="w-4 h-4 opacity-90" />
      <div className={`relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ring-2 ${ring}`}>
        {imgSrc ? <img src={imgSrc} alt={`${(player as any).firstName}'s avatar`} className="w-full h-full object-cover" draggable={false} /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-white/20">{initials}</div>}
        {isGuest && <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded bg-black/70 text-white">G</span>}
      </div>
      <div className="truncate font-semibold text-sm">{(player as any).firstName}</div>
    </motion.div>
  );
};

interface CourtCardProps {
  courtNo: number;
  assigned: (Player | null)[];
  score: string;
  time: string;
  isRunning: boolean;
  onScoreChange: (value: string) => void;
  onStartStop: () => void;
  onRemoveCourt: () => void;
  onDropPlayer: (slotIndex: number, player: Player, replacedPlayer?: Player | null) => void;
}

export default function CourtCard({ courtNo, assigned, score, time, isRunning, onScoreChange, onStartStop, onRemoveCourt }: CourtCardProps) {
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [teamAScore, setTeamAScore] = useState<string>('');
  const [teamBScore, setTeamBScore] = useState<string>('');

  const teamA = useMemo(() => [assigned[0], assigned[1]].filter(Boolean) as Player[], [assigned]);
  const teamB = useMemo(() => [assigned[2], assigned[3]].filter(Boolean) as Player[], [assigned]);

  const assignedCount = assigned.filter(Boolean).length;
  const courtColor = assignedCount === 0 ? 'bg-green-700' : 'bg-red-700';

  const handleStartStop = () => {
    if (!isRunning) {
      onStartStop();
    } else {
      setTeamAScore('');
      setTeamBScore('');
      setScoreDialogOpen(true);
    }
  };

// Live score validity check for enabling Confirm button
const isScoreValid = (rawA: string, rawB: string) => {
  if (!rawA || !rawB) return false;

  const a = Number.parseInt(rawA, 10);
  const b = Number.parseInt(rawB, 10);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (a < 0 || b < 0) return false;
  if (a > 30 || b > 30) return false;

  // Badminton win rules
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  const diff = Math.abs(a - b);

  if (max < 21) return false;                  // need at least 21
  if (max === 21) return min <= 19 && diff >= 2;   // 21–19 or better
  if (max > 21 && max < 30) return diff >= 2;      // deuce region must lead by 2
  if (max === 30) return min <= 29;                // 30–29 allowed, any 30–X with X≤29

  return false;
};



  const validateAndSaveScore = () => {
    const rawA = teamAScore.trim();
    const rawB = teamBScore.trim();
  
    // Require both values
    if (rawA === '' || rawB === '') {
      toast.warn('Please enter scores for both Team A and Team B.');
      return;
    }
  
    // Parse
    const a = Number.parseInt(rawA, 10);
    const b = Number.parseInt(rawB, 10);
  
    // Numeric + range
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      toast.warn('Please enter valid numbers for both teams.');
      return;
    }
    if (a < 0 || b < 0) {
      toast.warn('Scores cannot be negative.');
      return;
    }
    if (a > 30 || b > 30) {
      toast.warn('⚠️ Game is capped at 30 points per team');
      return;
    }
  
    // Badminton win rules
    const max = Math.max(a, b);
    const min = Math.min(a, b);
    const diff = Math.abs(a - b);
  
    let isValidWin = false;
    if (max === 30) {
      // At 29–29, first to 30 wins (30–29 is valid). Any 30–X with X<=29 is a valid terminal score.
      isValidWin = (min <= 29) && max === 30;
    } else if (max < 21) {
      isValidWin = false; // need at least 21
    } else if (max === 21) {
      // Must lead by 2 at 21 (i.e., opponent ≤ 19)
      isValidWin = (min <= 19) && diff >= 2;
    } else if (max > 21 && max < 30) {
      // Deuce region: must lead by 2
      isValidWin = diff >= 2;
    }
  
    if (!isValidWin) {
      toast.warn('Invalid final score: winner must reach 21 with a 2-point lead, or win 30-29 at deuce.');
      return;
    }
  
    // Zero-pad to NN/NN
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const combined = `${pad2(a)}/${pad2(b)}`;
  
    // Final format check
    if (!/^\d{2}\/\d{2}$/.test(combined)) {
      toast.warn('Invalid score format. Please use NN/NN, e.g., 21/18.');
      return;
    }
  
    // Debug trail
    console.log('📝 Modal Confirm — payload', { courtNo, teamAScore: a, teamBScore: b, combined });
    console.log('➡️ CourtCard.onStartStop invoked with score', { courtNo, score: combined });
  
    // Propagate to parent before stop
    flushSync(() => {
      onScoreChange(combined);
      setScoreDialogOpen(false);
    });
    onStartStop(combined);
  };
  
  return (
    <>
      <motion.div layout initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="min-w-[320px] w-[320px] relative rounded-2xl shadow-2xl border-[3px] border-black bg-gradient-to-br from-blue-600 to-fuchsia-600 overflow-visible group">
        <div className="absolute top-3 right-3 z-20"><button onClick={onRemoveCourt} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-full shadow-lg">✕</button></div>
        <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${courtColor} border-white/20`}>🏸 Court {courtNo} {assignedCount === 4 && <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>}</div>
        <div className="relative h-[440px] overflow-visible" id={`court-${courtNo}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-fuchsia-500/90 pointer-events-none">
            <div className="absolute top-0 bottom-0 left-1/2 w-[4px] bg-white/90 -translate-x-1/2 shadow-sm" />
            <div className="absolute top-[0%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[8%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[40%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[60%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[92%] w-full h-[2px] bg-white/80" />
            <div className="absolute top-[100%] w-full h-[2px] bg-white/80" />
            <div className="absolute left-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]" />
            <div className="absolute right-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]" />
          </div>
          <div className="absolute inset-0 grid grid-rows-2 z-20">
            <div className="flex border-b-2 border-white/40 h-1/2">{[0, 1].map((i) => (<DroppableSlot key={`slot-${courtNo}-${i}`} courtNo={courtNo} index={i}><DraggablePlayerSlot player={assigned[i] || null} index={i} courtNo={courtNo} /></DroppableSlot>))}</div>
            <div className="flex h-1/2">{[2, 3].map((i) => (<DroppableSlot key={`slot-${courtNo}-${i}`} courtNo={courtNo} index={i}><DraggablePlayerSlot player={assigned[i] || null} index={i} courtNo={courtNo} /></DroppableSlot>))}</div>
          </div>
          <div className="absolute bottom-10 right-3 pointer-events-auto z-30">
            <Button onClick={handleStartStop} disabled={!assigned.some((p) => p !== null)} className={`text-white font-semibold text-sm md:text-base px-4 py-2 rounded-lg shadow transition duration-300 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'}`}>{isRunning ? `Stop (${time})` : 'Start'}</Button>
          </div>
        </div>
      </motion.div>
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Enter Final Score — Court {courtNo}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="rounded-lg p-3 bg-blue-50">
              <div className="text-xs font-semibold text-blue-700 mb-1">Team A</div>
              <div className="text-sm text-gray-800">{teamA.length ? teamA.map((p) => [ (p as any).firstName, (p as any).surName ].filter(Boolean).join(' ')).join(' & ') : '—'}</div>
              <input type="number" min={0} max={30} className="mt-3 w-full rounded border px-3 py-2 text-sm" placeholder="Score (e.g., 21)" value={teamAScore} onChange={(e) => setTeamAScore(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} />
            </div>
            <div className="rounded-lg p-3 bg-rose-50">
              <div className="text-xs font-semibold text-rose-700 mb-1">Team B</div>
              <div className="text-sm text-gray-800">{teamB.length ? teamB.map((p) => [ (p as any).firstName, (p as any).surName ].filter(Boolean).join(' ')).join(' & ') : '—'}</div>
              <input type="number" min={0} max={30} className="mt-3 w-full rounded border px-3 py-2 text-sm" placeholder="Score (e.g., 18)" value={teamBScore} onChange={(e) => setTeamBScore(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <Button variant="secondary" onClick={() => setScoreDialogOpen(false)}>Cancel</Button>
            <Button onClick={validateAndSaveScore} disabled={!isScoreValid(teamAScore, teamBScore)}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


{/* // components/CourtCard.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Player } from '@/types';

const DroppableSlot = ({
  children,
  courtNo,
  index,
}: {
  children: React.ReactNode;
  courtNo: number;
  index: number;
}) => {
  const id = `slot-${courtNo}-${index}`;
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 h-full border-white/40 flex items-center justify-center p-2 transition-all duration-300 ${
        isOver ? 'bg-yellow-200/30 border-2 border-yellow-300 shadow-inner scale-105' : 'border-r'
      }`}
    >
      {children}
    </div>
  );
};

const DraggablePlayerSlot = ({
  player,
  index,
  courtNo,
}: {
  player: Player | null;
  index: number;
  courtNo: number;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player?.id ?? player?._id ?? `empty-${courtNo}-${index}`,
    data: { from: 'court', index, courtNo, player },
  });

  const getGender = (p?: Player | null) =>
  (p?.gender ?? (p as any)?.sex ?? '').toString();

const isGuestPlayer = (p?: Player | null) =>
  Boolean(p && ((p as any).isGuest || (p as any).playerType === 'Guest' || (p as any).tags?.includes?.('guest')));


  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;

  useEffect(() => {
    if (player) {
      console.log('🎾 Assigned Player in Slot:', player.firstName ?? (player as any).name, player.surName ?? '');
    }
  }, [player]);

  if (!player) {
    return (
      <div className="bg-white/20 w-full h-full rounded-xl border border-dashed border-white/40 text-white text-xs flex items-center justify-center">
        Empty
      </div>
    );
  }

  const className = `bg-gradient-to-br ${
    player.gender === 'Male' ? 'from-blue-400 to-cyan-400' : 'from-pink-400 to-purple-400'
  } px-3 py-2 rounded-xl shadow-lg text-sm font-bold text-white text-center border border-white cursor-move flex items-center gap-2`;

  const gender = getGender(player);
const isGuest = isGuestPlayer(player);
const gradient =
  gender === 'Female'
    ? 'from-pink-500 to-fuchsia-500'
    : 'from-blue-500 to-cyan-500';

const ring =
  gender === 'Female'
    ? 'ring-pink-200'
    : 'ring-blue-200';

const imgSrc = (player as any).profileImage || (player as any).imageUrl || '';
const initials = (player.firstName ?? '')
  .slice(0, 1)
  .toUpperCase();

  return (
    <motion.div
      key={`court-${courtNo}-slot-${index}-${player.id ?? player._id}`}
      layoutId={`court-${courtNo}-slot-${index}-${player.id ?? player._id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`Player ${player.firstName}${isGuest ? ' (Guest)' : ''}`}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border border-white text-white cursor-move bg-gradient-to-br ${gradient}`}
    >
      <GripVertical className="w-4 h-4 opacity-90" />
  
      {/* Avatar *
      <div className={`relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ring-2 ${ring}`}>
        {imgSrc ? (
          // Using <img> to avoid Next/Image constraints inside draggable
          <img
            src={imgSrc}
            alt={`${player.firstName}'s avatar`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-white/20">
            {initials || '👤'}
          </div>
        )}
        {isGuest && (
          <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded bg-black/70 text-white">
            G
          </span>
        )}
      </div>
  
      {/* Name (first name only) *
      <div className="truncate font-semibold text-sm">
        {player.firstName}
      </div>
    </motion.div>
  );






interface CourtCardProps {
  courtNo: number;
  assigned: (Player | null)[];
  score: string;
  time: string;
  isRunning: boolean;
  onScoreChange: (value: string) => void;
  onStartStop: () => void; // start or finalize (stop)
  onRemoveCourt: () => void;
  onDropPlayer: (slotIndex: number, player: Player, replacedPlayer?: Player | null) => void; // kept for API parity
}

export default function CourtCard({
  courtNo,
  assigned,
  score,
  time,
  isRunning,
  onScoreChange,
  onStartStop,
  onRemoveCourt,
}: CourtCardProps) {
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [teamAScore, setTeamAScore] = useState<string>('');
  const [teamBScore, setTeamBScore] = useState<string>('');

  useEffect(() => {
    console.log(`📦 CourtCard Rendered: Court ${courtNo}, Score="${score}"`);
  }, [courtNo, score]);

  // Compute team labels
  const teamA = useMemo(() => [assigned[0], assigned[1]].filter(Boolean) as Player[], [assigned]);
  const teamB = useMemo(() => [assigned[2], assigned[3]].filter(Boolean) as Player[], [assigned]);

  const assignedCount = assigned.filter(Boolean).length;
  const courtColor = assignedCount === 0 ? 'bg-green-700' : 'bg-red-700';

  // Start: behave as before. Stop: open dialog instead of inline input.
  const handleStartStop = () => {
    if (!isRunning) {
      // START
      onStartStop();
    } else {
      // STOP → open dialog to capture final scores
      setTeamAScore('');
      setTeamBScore('');
      setScoreDialogOpen(true);
    }
  };

  const validateAndSaveScore = () => {
    // basic numeric validation + cap at 30
    const a = teamAScore.trim() === '' ? NaN : parseInt(teamAScore, 10);
    const b = teamBScore.trim() === '' ? NaN : parseInt(teamBScore, 10);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      toast.warn('Please enter valid numbers for both teams.');
      return;
    }
    if (a > 30 || b > 30) {
      toast.warn('⚠️ Game is capped at 30 points per team');
      return;
    }

    const combined = `${a}/${b}`;
    onScoreChange(combined);   // set final score string for the parent
    setScoreDialogOpen(false);
    onStartStop();             // now finalize/stop so matchUtils can run winner logic
  };



  return (
    <>
      <motion.div
        layout
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="min-w-[320px] w-[320px] relative rounded-2xl shadow-2xl border-[3px] border-black bg-gradient-to-br from-blue-600 to-fuchsia-600 overflow-visible group"
      >
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={onRemoveCourt}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-full shadow-lg"
          >
            ✕
          </button>
        </div>

        <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${courtColor} border-white/20`}>
          🏸 Court {courtNo}{' '}
          {assignedCount === 4 && <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>}
        </div>

        <div className="relative h-[440px] overflow-visible" id={`court-${courtNo}`}>
          {/* Court lines *
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-fuchsia-500/90 pointer-events-none">
            <div className="absolute top-0 bottom-0 left-1/2 w-[4px] bg-white/90 -translate-x-1/2 shadow-sm" />
            <div className="absolute top-[0%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[8%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[40%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[60%] w-full h-[3px] bg-white/90" />
            <div className="absolute top-[92%] w-full h-[2px] bg-white/80" />
            <div className="absolute top-[100%] w-full h-[2px] bg-white/80" />
            <div className="absolute left-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]" />
            <div className="absolute right-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]" />
          </div>

          {/* Slots *
          <div className="absolute inset-0 grid grid-rows-2 z-20">
            <div className="flex border-b-2 border-white/40 h-1/2">
              {[0, 1].map((i) => (
                <DroppableSlot key={`slot-${courtNo}-${i}`} courtNo={courtNo} index={i}>
                  <DraggablePlayerSlot player={assigned[i] || null} index={i} courtNo={courtNo} />
                </DroppableSlot>
              ))}
            </div>
            <div className="flex h-1/2">
              {[2, 3].map((i) => (
                <DroppableSlot key={`slot-${courtNo}-${i}`} courtNo={courtNo} index={i}>
                  <DraggablePlayerSlot player={assigned[i] || null} index={i} courtNo={courtNo} />
                </DroppableSlot>
              ))}
            </div>
          </div>

          {/* Start / Stop *
          <div className="absolute bottom-10 right-3 pointer-events-auto z-30">
            <Button
              onClick={handleStartStop}
              disabled={!assigned.some((p) => p !== null)}
              className={`text-white font-semibold text-sm md:text-base px-4 py-2 rounded-lg shadow transition duration-300 ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
              }`}
            >
              {isRunning ? `Stop (${time})` : 'Start'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Score dialog shown only on STOP *
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Enter Final Score — Court {courtNo}</DialogTitle>
          </DialogHeader>

          {/* Teams side-by-side *
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="rounded-lg p-3 bg-blue-50">
              <div className="text-xs font-semibold text-blue-700 mb-1">Team A</div>
              <div className="text-sm text-gray-800">
                {teamA.length ? teamA.map(p => `${p.firstName} ${p.surName ?? ''}`).join(' & ') : '—'}
              </div>
              <input
                type="number"
                min={0}
                max={30}
                className="mt-3 w-full rounded border px-3 py-2 text-sm"
                placeholder="Score (e.g., 21)"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
              />
            </div>

            <div className="rounded-lg p-3 bg-rose-50">
              <div className="text-xs font-semibold text-rose-700 mb-1">Team B</div>
              <div className="text-sm text-gray-800">
                {teamB.length ? teamB.map(p => `${p.firstName} ${p.surName ?? ''}`).join(' & ') : '—'}
              </div>
              <input
                type="number"
                min={0}
                max={30}
                className="mt-3 w-full rounded border px-3 py-2 text-sm"
                placeholder="Score (e.g., 18)"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <Button variant="secondary" onClick={() => setScoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={validateAndSaveScore}>Confirm &amp; Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


*/}