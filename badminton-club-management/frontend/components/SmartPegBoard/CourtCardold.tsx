'use client';

// components/CourtCard.tsx — modal scoring + guest avatars
// Persist court state (assigned players, running timer, score) per day & club in localStorage.
// Parent can optionally implement onRestoreFromStorage to hydrate state on reload.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { flushSync } from 'react-dom';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Player } from '@/types';

// --------------------------- helpers ---------------------------------------
const getGender = (p?: Player | null) => (p as any)?.gender ?? (p as any)?.sex ?? '';
const isGuestPlayer = (p?: Player | null) =>
  Boolean(p && ((p as any).isGuest || (p as any).playerType === 'Guest' || (p as any).tags?.includes?.('guest')));

const toId = (p: any): string => {
  const raw = p?._id ?? p?.id ?? p?.playerId ?? p;
  try { return typeof raw === 'string' ? raw : String(raw); } catch { return ''; }
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const courtStorageKey = (clubId: string, date: string, courtNo: number) => `court:${clubId}:${date}:#${courtNo}`;

// Save minimal, display-safe player snapshot (avoids breaking if models evolve)
const toSnapshot = (p: Player | null) =>
  p ? ({
    _id: (p as any)._id ?? (p as any).id,
    id: (p as any).id ?? (p as any)._id,
    firstName: (p as any).firstName ?? '',
    surName: (p as any).surName ?? '',
    gender: getGender(p) ?? '',
    profileImage: (p as any).profileImage ?? (p as any).imageUrl ?? '',
    isGuest: isGuestPlayer(p),
  }) : null;

const fromSnapshot = (s: any): Player | null => s ? ({
  ...(s as any),
}) as Player : null;

const parseTimeToMs = (t?: string) => {
  if (!t) return 0;
  // expected format like "MM:SS" or "M:SS"
  const m = /^([0-9]{1,2}):([0-9]{2})$/.exec(t.trim());
  if (!m) return 0;
  const minutes = Number(m[1]);
  const seconds = Number(m[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
  return (minutes * 60 + seconds) * 1000;
};

// --------------------------- DnD subcomponents -----------------------------
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
    return (
      <div className="bg-white/20 w-full h-full rounded-xl border border-dashed border-white/40 text-white text-xs flex items-center justify-center">
        Empty
      </div>
    );
  }

  const gender = `${getGender(player)}`;
  const isGuest = isGuestPlayer(player);
  // Color rules:
  // - Club Male: gradient blue ➜ pink
  // - Club Female: gradient pink ➜ blue
  // - Guest Male: solid blue
  // - Guest Female: solid pink
  const cardBg = isGuest
    ? (gender === 'Female' ? 'bg-pink-600' : 'bg-blue-600')
    : (gender === 'Female'
        ? 'bg-gradient-to-br from-pink-700 via-pink-500 to-blue-200'
        : 'bg-gradient-to-br from-blue-700 via-blue-500 to-pink-200');
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
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border border-white text-white cursor-move ${cardBg}`}
    >
      <GripVertical className="w-4 h-4 opacity-90" />
      <div className={`relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ring-2 ${ring}`}>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={`${(player as any).firstName}'s avatar`} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-white/20">{initials}</div>
        )}
        {isGuest && <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded bg-black/70 text-white">G</span>}
      </div>
      <div className="truncate font-semibold text-sm">{(player as any).firstName}</div>
    </motion.div>
  );
};

// --------------------------- types & props ---------------------------------
interface CourtCardProps {
  courtNo: number;
  assigned: (Player | null)[]; // length 4 suggested
  score: string;
  time: string; // MM:SS displayed in button
  isRunning: boolean;
  onScoreChange: (value: string) => void;
  onStartStop: (finalScore?: string) => void; // start or finalize (stop). Accepts optional final score.
  onRemoveCourt: () => void;
  // Optional: parent can use this to hydrate from storage on mount
  onRestoreFromStorage?: (payload: {
    assigned: (Player | null)[];
    isRunning: boolean;
    resumeFromMs: number; // if running, how much elapsed
    startedAt?: number;
    score?: string;
  }) => void;
}

// --------------------------- component -------------------------------------
export default function CourtCard({
  courtNo,
  assigned,
  score,
  time,
  isRunning,
  onScoreChange,
  onStartStop,
  onRemoveCourt,
  onRestoreFromStorage,
}: CourtCardProps) {
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [teamAScore, setTeamAScore] = useState<string>('');
  const [teamBScore, setTeamBScore] = useState<string>('');

  // a11y: refs for focusing fields and inline error
  const aRef = useRef<HTMLInputElement | null>(null);
  const bRef = useRef<HTMLInputElement | null>(null);
  const [scoreError, setScoreError] = useState<string>('');

  useEffect(() => {
    if (scoreDialogOpen) {
      // slight delay to ensure dialog is mounted
      setTimeout(() => aRef.current?.focus(), 50);
    }
  }, [scoreDialogOpen]);

  // cache latest startedAt (derived) so persistence is stable
  const startedAtRef = useRef<number | undefined>(undefined);
  const prevRunningRef = useRef<boolean>(false);

  // derive teams for dialog
  const teamA = useMemo(() => [assigned[0], assigned[1]].filter(Boolean) as Player[], [assigned]);
  const teamB = useMemo(() => [assigned[2], assigned[3]].filter(Boolean) as Player[], [assigned]);

  const assignedCount = assigned.filter(Boolean).length;
  const courtColor = assignedCount === 0 ? 'bg-green-700' : 'bg-red-700';

  // ------------------ persistence: save ------------------------------------
  useEffect(() => {
    const clubId = typeof window !== 'undefined' ? localStorage.getItem('clubId') || '' : '';
    if (!clubId) return;
    const date = todayKey();

    // keep a stable startedAt: infer from current time string when entering running state
    const nowRunning = !!isRunning;
    const prevRunning = prevRunningRef.current;
    const elapsedMs = parseTimeToMs(time);

    if (nowRunning && !prevRunning) {
      startedAtRef.current = Date.now() - elapsedMs; // if resuming mid-way, time won't be 00:00
    }
    prevRunningRef.current = nowRunning;

    const payload = {
      courtNo,
      assigned: (assigned ?? []).map(toSnapshot),
      isRunning: nowRunning,
      startedAt: startedAtRef.current,
      lastElapsedMs: elapsedMs,
      score: score || '',
    };

    try {
      localStorage.setItem(courtStorageKey(clubId, date, courtNo), JSON.stringify(payload));
    } catch {}

    // cleanup: if court is empty and not running, remove persisted
    if (!nowRunning && assigned.filter(Boolean).length === 0) {
      try { localStorage.removeItem(courtStorageKey(clubId, date, courtNo)); } catch {}
    }
  }, [assigned, isRunning, time, score, courtNo]);

  // ------------------ persistence: restore on mount ------------------------
  useEffect(() => {
    const clubId = typeof window !== 'undefined' ? localStorage.getItem('clubId') || '' : '';
    if (!clubId) return;
    const date = todayKey();
    try {
      const raw = localStorage.getItem(courtStorageKey(clubId, date, courtNo));
      if (!raw) return;
      const saved = JSON.parse(raw || '{}');
      const restoredAssigned = (saved.assigned ?? []).map(fromSnapshot) as (Player | null)[];
      const resumeFromMs = Number(saved?.lastElapsedMs ?? 0);
      const startedAt = typeof saved?.startedAt === 'number' ? saved.startedAt : undefined;
      const running = !!saved?.isRunning;
      const savedScore = String(saved?.score || '');

      startedAtRef.current = startedAt;

      onRestoreFromStorage?.({
        assigned: restoredAssigned,
        isRunning: running,
        resumeFromMs,
        startedAt,
        score: savedScore,
      });
    } catch {}
  // run once per mount per court
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------ start/stop handling ----------------------------------
  const handleStartStop = () => {
    if (!isRunning) {
      // starting — record the baseline
      startedAtRef.current = Date.now() - parseTimeToMs(time);
      onStartStop();
    } else {
      // stopping — ask for final score
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

    if (max < 21) return false; // need at least 21
    if (max === 21) return min <= 19 && diff >= 2; // 21–19 or better
    if (max > 21 && max < 30) return diff === 2; // deuce region must lead by 2
    if (max === 30) return (min === 28 || min === 29); // 30–29 allowed, any 30–X with X≤29

    return false;
  };

  const validateAndSaveScore = () => {
    setScoreError('');
    const rawA = teamAScore.trim();
    const rawB = teamBScore.trim();

    // Require both values
    if (rawA === '' || rawB === '') {
      setScoreError('Please enter scores for both Team A and Team B.');
      toast.warn('Please enter scores for both Team A and Team B.');
      return;
    }

    // Parse
    const a = Number.parseInt(rawA, 10);
    const b = Number.parseInt(rawB, 10);

    // Numeric + range
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setScoreError('Please enter valid numbers for both teams.');
      toast.warn('Please enter valid numbers for both teams.');
      return;
    }
    if (a < 0 || b < 0) {
      setScoreError('Scores cannot be negative.');
      toast.warn('Scores cannot be negative.');
      return;
    }
    if (a > 30 || b > 30) {
      setScoreError('Game is capped at 30 points per team.');
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
      isValidWin = (min === 28 || min === 29);
    } else if (max < 21) {
      isValidWin = false; // need at least 21
    } else if (max === 21) {
      // Must lead by 2 at 21 (i.e., opponent ≤ 19)
      isValidWin = min <= 19 && diff >= 2;
    } else if (max > 21 && max < 30) {
      // Deuce region: must lead by exactly 2
      isValidWin = diff === 2;
    }

    if (!isValidWin) {
      setScoreError('Invalid final score: winner must reach 21 with a 2-point lead; from 22–29 lead must be exactly 2; or finish 30–28 / 30–29.');
      toast.warn('Invalid final score: winner must reach 21 with a 2-point lead; from 22–29 lead must be exactly 2; or finish 30–28 / 30–29.');
      return;
    }

    // Zero-pad to NN/NN
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const combined = `${pad2(a)}/${pad2(b)}`;

    // Final format check
    if (!/^\d{2}\/\d{2}$/.test(combined)) {
      setScoreError('Invalid score format. Please use NN/NN, e.g., 21/18.');
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

  // ------------------ render -----------------------------------------------
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
          <button onClick={onRemoveCourt} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-full shadow-lg">✕</button>
        </div>
        <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${courtColor} border-white/20`}>
          🏸 Court {courtNo} {assignedCount === 4 && <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>}
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
          <div className="absolute bottom-10 right-3 pointer-events-auto z-30">
            <Button
              onClick={handleStartStop}
              disabled={!assigned.some((p) => p !== null)}
              className={`text-white font-semibold text-sm md:text-base px-4 py-2 rounded-lg shadow transition duration-300 ${
                isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
              }`}
            >
              {isRunning ? `Stop (${time})` : 'Start'}
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl">Enter Final Score — Court {courtNo}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="rounded-2xl p-4 md:p-5 bg-blue-50">
              <div className="text-lg md:text-xl font-bold text-blue-700 mb-2">Team A</div>
              <div className="text-base md:text-lg text-gray-800">
                {teamA.length ? teamA.map((p) => [ (p as any).firstName, (p as any).surName ].filter(Boolean).join(' ')).join(' & ') : '—'}
              </div>
              <input
                ref={aRef}
                type="number"
                inputMode="numeric"
                min={0}
                max={30}
                step={1}
                className="mt-4 w-full rounded-lg border px-4 py-3 text-lg md:text-xl"
                placeholder="Score (e.g., 21)"
                value={teamAScore}
                onChange={(e) => { setTeamAScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setScoreError(''); }}
                aria-label="Team A final score"
                onKeyDown={(e) => { if (e.key === 'Enter') validateAndSaveScore(); }}
              />
            </div>
            <div className="rounded-2xl p-4 md:p-5 bg-rose-50">
              <div className="text-lg md:text-xl font-bold text-rose-700 mb-2">Team B</div>
              <div className="text-base md:text-lg text-gray-800">
                {teamB.length ? teamB.map((p) => [ (p as any).firstName, (p as any).surName ].filter(Boolean).join(' ')).join(' & ') : '—'}
              </div>
              <input
                ref={bRef}
                type="number"
                inputMode="numeric"
                min={0}
                max={30}
                step={1}
                className="mt-4 w-full rounded-lg border px-4 py-3 text-lg md:text-xl"
                placeholder="Score (e.g., 18)"
                value={teamBScore}
                onChange={(e) => { setTeamBScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setScoreError(''); }}
                aria-label="Team B final score"
                onKeyDown={(e) => { if (e.key === 'Enter') validateAndSaveScore(); }}
              />
            </div>
          </div>
          <div className="mt-3 min-h-[1.5rem]">{scoreError && (<p className="text-sm md:text-base text-rose-700" role="alert">{scoreError}</p>)}</div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <Button variant="secondary" onClick={() => setScoreDialogOpen(false)} className="text-base md:text-lg px-4 py-2">Cancel</Button>
            <Button onClick={validateAndSaveScore} disabled={!isScoreValid(teamAScore, teamBScore)} className="text-base md:text-lg px-5 py-2">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
