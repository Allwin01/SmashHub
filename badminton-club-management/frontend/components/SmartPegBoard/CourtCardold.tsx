// components/CourtCard.tsx
'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
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
    data: {
      from: 'court',
      index,
      courtNo,
      player,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  useEffect(() => {
    if (player) {
      console.log(
        '🎾 Assigned Player in Slot:',
        player.firstName ?? (player as any).name,
        player.surName ?? ''
      );
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

  return (
    <motion.div
      key={`court-${courtNo}-slot-${index}-${player.id ?? player._id}`}
      layoutId={`court-${courtNo}-slot-${index}-${player.id ?? player._id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={className}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="text-white w-4 h-4" />
      {player.firstName} {player.surName ?? ''}
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
  useEffect(() => {
    console.log(`📦 CourtCard Rendered: Court ${courtNo}, Score="${score}"`);
  }, [courtNo, score]);

  const assignedCount = assigned.filter(Boolean).length;
  const courtColor = assignedCount === 0 ? 'bg-green-700' : 'bg-red-700';

  return (
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
        {/* Court lines */}
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

        {/* Slots */}
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

        {/* Score input */}
        <div className="absolute bottom-10 left-3 pointer-events-auto z-30">
          {isRunning && (
            <input
              type="text"
              inputMode="numeric"
              className="rounded px-2 py-1 text-sm border border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={score}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d/]/g, '');
                if (/^\d{2}$/.test(val)) val = `${val}/`;
                const match = val.match(/^(\d{1,2})(?:\/(\d{0,2}))?$/);
                if (match) {
                  const [, a, b] = match;
                  const scoreA = parseInt(a, 10);
                  const scoreB = b ? parseInt(b, 10) : null;
                  if ((Number.isFinite(scoreA) && scoreA > 30) || (Number.isFinite(scoreB as number) && (scoreB as number) > 30)) {
                    toast.warn('⚠️ Game is capped at 30 points per team');
                    return;
                  }
                  onScoreChange(val);
                } else if (val === '') {
                  onScoreChange('');
                }
              }}
              placeholder="Enter Score (e.g., 21/18)"
              autoFocus
            />
          )}
        </div>

        {/* Start/Stop */}
        <div className="absolute bottom-10 right-3 pointer-events-auto z-30">
          <Button
            onClick={onStartStop}
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
  );
}


          {/*
// components/CourtCard.tsx
import React, { useEffect } from 'react';
import { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';

const DroppableSlot = ({ children, courtNo, index }: { children: React.ReactNode; courtNo: number; index: number }) => {
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

const DraggablePlayerSlot = ({ player, index }: { player: Player | null; index: number }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player?.id ?? `empty-${index}`,
    data: {
      from: 'court',
      index,
      player,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  useEffect(() => {
    if (player) {
      console.log("🎾 Assigned Player in Slot:", player.firstName ?? player.name, player.surName ?? '');
    }
  }, [player]);

  if (!player) return <div className="bg-white/20 w-full h-full rounded-xl border border-dashed border-white/40 text-white text-xs flex items-center justify-center">Empty</div>;

  const className = `bg-gradient-to-br ${
    player.gender === 'Male' ? 'from-blue-400 to-cyan-400' : 'from-pink-400 to-purple-400'
  } px-4 py-3 rounded-xl shadow-lg text-base font-bold text-white text-center border border-white cursor-move flex items-center gap-2`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={className}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="text-white w-4 h-4" />
      {player.firstName ?? player.name} {player.surName ?? ''}
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

export default function CourtCard({
  courtNo,
  assigned,
  score,
  time,
  isRunning,
  onScoreChange,
  onStartStop,
  onRemoveCourt,
  onDropPlayer
}: CourtCardProps) {

  useEffect(() => {
    console.log(`📦 CourtCard Rendered: Court ${courtNo}, Score="${score}"`);
  }, [courtNo, score]);

  return (
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

      <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${
        assigned.filter(Boolean).length === 0 ? 'bg-green-700' : 'bg-red-700'
      } border-white/20`}>
        🏸 Court {courtNo}{' '}
        {assigned.filter(Boolean).length === 4 && (
          <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>
        )}
      </div>

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
          <div className="flex border-b-2 border-white/40 h-1/2">
            {[0, 1].map((i) => (
              <DroppableSlot key={i} courtNo={courtNo} index={i}>
                <DraggablePlayerSlot player={assigned[i] || null} index={i} />
              </DroppableSlot>
            ))}
          </div>
          <div className="flex h-1/2">
            {[2, 3].map((i) => (
              <DroppableSlot key={i} courtNo={courtNo} index={i}>
                <DraggablePlayerSlot player={assigned[i] || null} index={i} />
              </DroppableSlot>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-3 pointer-events-auto z-30">
          {isRunning && (
            <input
              type="text"
              inputMode="numeric"
              className="rounded px-2 py-1 text-sm border border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={score}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d/]/g, '');
                if (/^\d{2}$/.test(val)) {
                  val = `${val}/`;
                }
                const match = val.match(/^(\d{1,2})\/?(\d{0,2})$/);
                if (match) {
                  const [_, a, b] = match;
                  const scoreA = parseInt(a, 10);
                  const scoreB = b ? parseInt(b, 10) : null;
                  if ((scoreA && scoreA > 30) || (scoreB && scoreB > 30)) {
                    toast.warn('⚠️ Game is capped at 30 points per team');
                    return;
                  }
                  onScoreChange(val);
                } else if (val === '') {
                  onScoreChange('');
                }
              }}
              placeholder="Enter Score (e.g., 21/18)"
              autoFocus
            />
          )}
        </div>

        <div className="absolute bottom-10 right-3 pointer-events-auto z-30">
          <Button
            onClick={onStartStop}
            disabled={!assigned.some(p => p !== null)}
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
  );
}


*/}
