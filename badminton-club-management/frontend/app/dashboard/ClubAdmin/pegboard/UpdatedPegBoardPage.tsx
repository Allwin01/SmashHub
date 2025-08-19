'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusCircle, Users, Wand2, X, Maximize2, UserCircle } from 'lucide-react';
import WinnerBoard from '@/components/SmartPegBoard/WinnerBoard';
import SmartAssignModal from '@/components/SmartPegBoard/SmartAssignModal';
import CourtCard from '@/components/SmartPegBoard/CourtCard';
import PlayerPool from '@/components/SmartPegBoard/PlayerPool';
import { handleStartStopMatch } from '@/utils/matchUtils';
import { handleAutoAssign, getAllSuggestedTeams } from '@/utils/matchAssigners';
import AllClubSelector from '@/components/AllClubSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Player } from '@/types';

// -------------------------------- UI bits ---------------------------------
const FloatingActions = ({ onSmartSelect, onAddCourt, onAddGuest, onShowAllClub }: any) => {
  const buttons = [
    { icon: <Wand2 className="w-5 h-5 text-white" />, label: 'Smart Select', onClick: onSmartSelect, color: 'from-green-400 to-green-600' },
    { icon: <PlusCircle className="w-5 h-5 text-white" />, label: 'Add Court', onClick: onAddCourt, color: 'from-blue-400 to-blue-600' },
    { icon: <Users className="w-5 h-5 text-white" />, label: 'Add Guest', onClick: onAddGuest, color: 'from-pink-400 to-pink-600' },
    { icon: <UserCircle className="w-5 h-5 text-white" />, label: 'All Club', onClick: onShowAllClub, color: 'from-purple-400 to-purple-600' }
  ];
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
      {buttons.map(({ icon, label, onClick, color }, idx) => (
        <motion.button
          key={idx}
          onClick={onClick}
          title={label}
          className={`w-14 h-14 rounded-full shadow-xl bg-gradient-to-br ${color} flex items-center justify-center relative group`}
          whileHover={{ scale: 1.1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          {icon}
          <span className="absolute right-16 top-1/2 -translate-y-1/2 text-xs px-3 py-1 bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

// Tiny overlay component so the DragOverlay compiles even if unused
const SortablePoolPlayer = ({ player }: { player: any }) => (
  <div className="px-3 py-2 rounded-lg shadow bg-white text-gray-800 border">
    {player?.firstName ?? player?.name ?? 'Player'}
  </div>
);

// --------- storage bootstrap so first render has restored courts ----------
function loadCourtsFromStorage(): { courtNo: number; assigned: (any | null)[] }[] {
  if (typeof window === 'undefined') return [{ courtNo: 1, assigned: [null, null, null, null] }];
  try {
    const clubId = localStorage.getItem('clubId') || '';
    const date = new Date().toISOString().slice(0, 10);
    const prefix = `court:${clubId}:${date}:#`;
    const list: { courtNo: number; assigned: (any | null)[] }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!key.startsWith(prefix)) continue;
      const courtNo = Number(key.slice(prefix.length));
      if (!Number.isFinite(courtNo)) continue;
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      const assigned = (saved.assigned ?? []).map((snap: any) => (snap ? { ...snap } : null));
      list.push({ courtNo, assigned });
    }
    list.sort((a, b) => a.courtNo - b.courtNo);
    return list.length ? list : [{ courtNo: 1, assigned: [null, null, null, null] }];
  } catch {
    return [{ courtNo: 1, assigned: [null, null, null, null] }];
  }
}

// ------------------------------ PegBoard -----------------------------------
export default function PegBoard() {
  type Court = { courtNo: number; assigned: (Player | null)[] };
  type IntervalHandle = ReturnType<typeof setInterval>;

  // Courts (seeded from localStorage synchronously to avoid first-render wipe)
  const [courts, setCourts] = useState<Court[]>(() => loadCourtsFromStorage());

  // Player Pool (persisted per day)
  const getInitialPlayers = (): Player[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('playerPool');
      const lastUpdated = localStorage.getItem('playerPoolDate');
      const today = new Date().toISOString().slice(0, 10);
      if (saved && lastUpdated === today) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('⚠️ Failed to load saved player pool:', err);
    }
    return [];
  };
  const [players, setPlayers] = useState<Player[]>(() => getInitialPlayers());
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('playerPool', JSON.stringify(players));
    localStorage.setItem('playerPoolDate', today);
  }, [players]);

  // Timers, scores, intervals
  const [timer, setTimer] = useState<Record<number, number>>({}); // seconds elapsed per court
  const [intervals, setIntervals] = useState<Record<number, IntervalHandle | undefined>>({});
  const [scores, setScores] = useState<Record<number, string>>({});
  // Storage readiness gate (prevents child from overwriting saved running state on first mount)
  const [storageReady, setStorageReady] = useState(false);

  // Assorted UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSmartAssignModal, setShowSmartAssignModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [suggestedPlayers, setSuggestedPlayers] = useState<Player[]>([] as any);
  const [fixedPlayerWarning, setFixedPlayerWarning] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [winningTeam, setWinningTeam] = useState<Player[] | null>(null);
  const [winningCourt, setWinningCourt] = useState<number | null>(null);
  const [refreshWinnerKey, setRefreshWinnerKey] = useState(Date.now());
  const [clubPlayers, setAllClubPlayers] = useState<Player[]>([]);
  const [justAddedPlayerId, setJustAddedPlayerId] = useState<string | null>(null);
  const [showAllClubModal, setShowAllClubModal] = useState(false);

  // Guest modal
  const [guestGender, setGuestGender] = useState<'Male' | 'Female' | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const guestCounters = useRef({ Male: 1, Female: 1 });

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  // Flatten court players for AllClub dialog to detect “In Play”
  const courtPlayers = useMemo(
    () => (courts ?? []).flatMap(c => (c.assigned ?? []).filter(Boolean)) as Player[],
    [courts]
  );

  // ------------------------ Helpers: fullscreen + fetch ----------------------
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(`❌ Fullscreen failed: ${err.message}`));
    } else {
      document.exitFullscreen();
    }
  };

  // Club players list
  const toastShownRef = useRef(false);
  useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const clubId = localStorage.getItem('clubId');
        const res = await fetch(`http://localhost:5050/api/players?clubId=${clubId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setAllClubPlayers(data);
      } catch (err) {
        if (!toastShownRef.current) {
          toast.error('Failed to load club players');
          toastShownRef.current = true;
        }
      }
    };
    fetchAllPlayers();
  }, []);

  // -------------------------- Timer controls --------------------------------
  const toggleTimer = useCallback((courtNo: number) => {
    setIntervals(prev => {
      const handle = prev[courtNo];
      if (handle) {
        clearInterval(handle);
        const { [courtNo]: _omit, ...rest } = prev;
        return rest;
      } else {
        const newHandle: IntervalHandle = setInterval(() => {
          setTimer(t => ({ ...t, [courtNo]: (t[courtNo] || 0) + 1 }));
        }, 1000);
        return { ...prev, [courtNo]: newHandle };
      }
    });
  }, []);

  useEffect(() => () => { // cleanup all timers on unmount
    Object.values(intervals).forEach(h => h && clearInterval(h));
  }, [intervals]);

  const handleScoreChange = (courtNo: number, value: string) => {
    setScores(prev => ({ ...prev, [courtNo]: value }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ---------------------------- Guests --------------------------------------
  const handleGuestSubmit = (sex: 'Male' | 'Female') => {
    const raw = guestNameInput.trim();
    if (!raw) {
      toast.warn('Please enter the guest first name.');
      return;
    }
    const idx = guestCounters.current[sex]++;
    const id = `guest_${sex.toLowerCase()}_${idx}`;
    const firstName = raw.replace(/\s+/g, ' ');
    const newGuest: any = {
      id,
      _id: undefined,
      isGuest: true,
      playerType: 'Guest',
      firstName,
      surName: '',
      gender: sex,
      sex,
      name: firstName,
      profileImage: '',
    };
    setPlayers(prev => [...prev, newGuest]);
    setGuestNameInput('');
    setGuestGender(null);
    setShowGuestDialog(false);
    toast.success(`Guest added: ${firstName} (${sex})`);
  };

  // --------------------------- DnD handlers ---------------------------------
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = (active as any).data?.current;
    if (!activeData || !over) return;

    const player: Player = activeData.player;
    const from = activeData.from;
    const overId = String((over as any).id);

    // 1) Player Pool → Court
    if (from === 'pool' && overId.startsWith('slot-')) {
      const [, courtStr, slotStr] = overId.split('-');
      const courtNo = parseInt(courtStr, 10);
      const slotIndex = parseInt(slotStr, 10);
      if (Number.isNaN(courtNo) || Number.isNaN(slotIndex)) return;

      const courtIndex = courts.findIndex(c => c.courtNo === courtNo);
      if (courtIndex === -1) return;

      const replacedPlayer = courts[courtIndex].assigned[slotIndex];
      const newCourts = [...courts];
      newCourts[courtIndex] = {
        ...newCourts[courtIndex],
        assigned: newCourts[courtIndex].assigned.map((p, i) => (i === slotIndex ? player : p)),
      };

      const playerId = (player as any).id || (player as any)._id;
      const newPlayers = players.filter(p => ((p as any).id || (p as any)._id) !== playerId);
      if (replacedPlayer && !newPlayers.some(p => ((p as any).id || (p as any)._id) === ((replacedPlayer as any).id || (replacedPlayer as any)._id))) {
        newPlayers.unshift(replacedPlayer as any);
      }

      setCourts(newCourts);
      setPlayers(newPlayers);
      return;
    }

    // 2) Court → Player Pool
    if (from === 'court' && overId === 'player-pool') {
      const playerId = (player as any).id || (player as any)._id;
      setCourts(prev => prev.map(c => ({ ...c, assigned: c.assigned.map(p => (((p as any)?.id || (p as any)?._id) === playerId ? null : p)) })));
      setPlayers(prev => (prev.some(p => ((p as any).id || (p as any)._id) === playerId) ? prev : [...prev, player]));
      return;
    }

    // 3) Court ⇄ Court swap
    if (from === 'court' && overId.startsWith('slot-')) {
      const [, courtStr, toIndexStr] = overId.split('-');
      const courtNo = parseInt(courtStr, 10);
      const toIndex = parseInt(toIndexStr, 10);
      const fromIndex = activeData.index;
      if ([courtNo, toIndex, fromIndex].some(n => Number.isNaN(n))) return;

      setCourts(prev => prev.map(c => {
        if (c.courtNo !== courtNo) return c;
        const updated = [...c.assigned];
        const tmp = updated[toIndex];
        updated[toIndex] = updated[fromIndex];
        updated[fromIndex] = tmp;
        return { ...c, assigned: updated };
      }));
      return;
    }
  };

  // ----------------------- Courts persistence (PARENT) ----------------------
  const storageKeyForCourt = (clubId: string, date: string, courtNo: number) => `court:${clubId}:${date}:#${courtNo}`;
  const hydratedRef = useRef(false);

  // ---- Storage housekeeping ----
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const purgeOldCourtStorage = (clubId: string, keepDate: string) => {
    if (!clubId) return;
    const prefixBase = `court:${clubId}:`;
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith(prefixBase)) continue;
      // key format: court:<clubId>:<YYYY-MM-DD>:#<courtNo>
      const parts = k.split(':');
      const datePart = parts[2];
      if (datePart && datePart !== keepDate) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
  };

  const clearTodayCourts = () => {
    const clubId = localStorage.getItem('clubId') || '';
    if (!clubId) return;
    const date = todayStr();
    const prefix = `court:${clubId}:${date}:#`;
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(prefix)) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    // reset UI state
    Object.values(intervals).forEach(h => h && clearInterval(h));
    setIntervals({});
    setTimer({});
    setScores({});
    setCourts([{ courtNo: 1, assigned: [null, null, null, null] }]);
    toast.info("🧹 Cleared today's saved courts from localStorage");
  };

  const resumeTimerFromSec = useCallback((courtNo: number, seconds: number) => {
    setTimer(prev => ({ ...prev, [courtNo]: seconds }));
    if (!intervals[courtNo]) {
      toggleTimer(courtNo); // will continue from baseline seconds already set
    }
  }, [intervals, toggleTimer]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const clubId = localStorage.getItem('clubId') || '';
    if (!clubId) { setStorageReady(true); return; }
    const date = new Date().toISOString().slice(0, 10);

    const restoredCourts: Court[] = [];
    const restoredScores: Record<number, string> = {};
    const restoredTimersSec: Record<number, number> = {};
    const runningCourts: number[] = [];

    const prefix = `court:${clubId}:${date}:#`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!key.startsWith(prefix)) continue;
      const courtNo = Number(key.slice(prefix.length));
      if (!Number.isFinite(courtNo)) continue;
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '{}');
        const assigned = (saved.assigned ?? []).map((snap: any) => (snap ? ({ ...snap } as Player) : null));
        const elapsedMs = Number(saved.lastElapsedMs || 0);
        const running = !!saved.isRunning;
        const score = String(saved.score || '');
        restoredCourts.push({ courtNo, assigned });
        restoredTimersSec[courtNo] = Math.floor(elapsedMs / 1000); // 🔁 convert ms → seconds
        if (score) restoredScores[courtNo] = score;
        if (running) runningCourts.push(courtNo);
      } catch {}
    }

    if (restoredCourts.length === 0) { setStorageReady(true); return; }

    // Replace with the restored set (authoritative from storage)
    setCourts(restoredCourts);

    // Remove players already on courts from the pool to avoid duplicates
    const onCourtIds = new Set<string>();
    restoredCourts.forEach(c => c.assigned.forEach(p => p && onCourtIds.add(String((p as any)._id ?? (p as any).id))));
    setPlayers(prev => prev.filter(p => !onCourtIds.has(String((p as any)._id ?? (p as any).id))));

    // Scores & timers
    Object.entries(restoredScores).forEach(([cNo, val]) => handleScoreChange(Number(cNo), val));
    setTimer(prev => ({ ...prev, ...restoredTimersSec }));
    runningCourts.forEach(cNo => resumeTimerFromSec(cNo, restoredTimersSec[cNo] || 0));
    // mark storage ready after hydration completes
    setStorageReady(true);
  }, [resumeTimerFromSec]);

  // Schedule a midday housekeeping run to purge any previous-day court keys
  useEffect(() => {
    const clubId = localStorage.getItem('clubId') || '';
    if (!clubId) return;
    const now = new Date();
    const target = new Date();
    target.setHours(12, 5, 0, 0); // 12:05 local time
    let delay = target.getTime() - now.getTime();
    if (delay < 0) delay = 0; // if past midday, run at next tick
    const tid = window.setTimeout(() => purgeOldCourtStorage(clubId, todayStr()), delay);
    return () => clearTimeout(tid);
  }, []);

  // --------------------------- Court add/remove -----------------------------
  const nextCourtNo = () => (courts.length ? Math.max(...courts.map(c => c.courtNo)) + 1 : 1);
  const addCourt = () => setCourts(prev => [...prev, { courtNo: nextCourtNo(), assigned: [null, null, null, null] }]);
  const removeCourt = (index: number) => {
    const courtNo = courts[index].courtNo;
    setCourts(prev => prev.filter((_, i) => i !== index));
    const handle = intervals[courtNo];
    if (handle) clearInterval(handle);
    setIntervals(prev => { const { [courtNo]: _omit, ...rest } = prev; return rest; });
    setTimer(prev => { const { [courtNo]: _t, ...rest } = prev; return rest; });
    // optional: delete storage for this court
    try {
      const clubId = localStorage.getItem('clubId') || '';
      const date = new Date().toISOString().slice(0, 10);
      if (clubId) localStorage.removeItem(storageKeyForCourt(clubId, date, courtNo));
    } catch {}
  };

  // ------------------------------- JSX -------------------------------------
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={`min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6 relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-y-auto' : ''}`}>
        <ToastContainer />

        <AnimatePresence>
          {isFullscreen ? (
            <motion.button key="exit" onClick={toggleFullscreen} className="fixed top-4 right-4 z-50 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 p-3 rounded-full shadow-xl" title="Exit Fullscreen">
              <X className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button key="enter" onClick={toggleFullscreen} className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow hover:scale-105" title="Enter Fullscreen">
              <Maximize2 className="w-5 h-5 text-indigo-600" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Banner */}
        <div className="relative w-full h-[180px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-b-[60px] flex flex-col justify-center items-center shadow-lg">
          <h1 className="text-5xl font-extrabold text-white drop-shadow">SmashHub</h1>
          <h2 className="text-2xl text-white/90 font-medium">Smart Peg Board</h2>
        </div>

        {/* Winner board */}
        <WinnerBoard refreshKey={refreshWinnerKey} />

        <FloatingActions
          onSmartSelect={() => setShowSmartAssignModal(true)}
          onAddCourt={addCourt}
          onAddGuest={() => { setGuestGender(null); setGuestNameInput(''); setShowGuestDialog(true); }}
          onShowAllClub={() => setShowAllClubModal(true)}
        />

        {/* 🧹 Debug: Clear Today's Saved Courts */}
        <button
          onClick={clearTodayCourts}
          className="fixed bottom-6 left-6 z-50 bg-white/90 hover:bg-white text-red-600 border border-red-300 px-3 py-2 rounded-lg shadow"
          title="Clear today's saved court state (debug)"
        >
          🧹 Clear today’s courts
        </button>

        {/* All Club Modal */}
        {showAllClubModal && (
          <AllClubSelector
            open={showAllClubModal}
            setOpen={setShowAllClubModal}
            onClose={() => setShowAllClubModal(false)}
            allPlayers={clubPlayers}
            playerPool={players}
            setPlayerPool={setPlayers}
            setPlayers={setPlayers}
            setJustAddedPlayerId={setJustAddedPlayerId}
            courtPlayers={courtPlayers}
          />
        )}

        {/* Guest Modal */}
        <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
          <DialogContent className="max-w-sm bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-indigo-700">Add Guest Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="text" placeholder="Enter guest first name" value={guestNameInput} onChange={(e) => setGuestNameInput(e.target.value)} className="text-sm" />
              <p className="text-xs text-gray-500">First name is required. Choose the gender to add the guest.</p>
              <div className="flex justify-between gap-4 mt-2">
                <Button type="button" onClick={() => handleGuestSubmit('Male')} disabled={guestNameInput.trim() === ''} className={`w-full font-semibold text-white transition-all duration-200 ${guestNameInput.trim() === '' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Male</Button>
                <Button type="button" onClick={() => handleGuestSubmit('Female')} disabled={guestNameInput.trim() === ''} className={`w-full font-semibold text-white transition-all duration-200 ${guestNameInput.trim() === '' ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}>Female</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Smart Assign modal */}
        <SmartAssignModal
          show={showSmartAssignModal}
          players={players}
          courts={courts}
          suggestedPlayers={suggestedPlayers as any}
          setSuggestedPlayers={setSuggestedPlayers as any}
          onClose={() => setShowSmartAssignModal(false)}
          onRedoAuto={() => {
            const court = courts.find(c => c.assigned.every(p => !p));
            if (!court) return toast.error('No free court');
            // quick preview: keep the first as fixed, shuffle the rest
            const fixed = players[0];
            const rest = players.slice(1).sort(() => 0.5 - Math.random());
            const reordered = [fixed, ...rest];
            handleAutoAssign('MS', courts, reordered, setCourts, setPlayers, toggleTimer, [], setSuggestedPlayers as any, true);
          }}
          onConfirm={(selectedPlayers: Player[]) => {
            const court = courts.find(c => c.assigned.every(p => !p));
            if (!court) return toast.error('No free court');
            setCourts(prev => prev.map(c => (c.courtNo === court.courtNo ? { ...c, assigned: selectedPlayers } : c)));
            setPlayers(prev => prev.filter(p => !selectedPlayers.some(sp => ((sp as any).id ?? (sp as any)._id) === ((p as any).id ?? (p as any)._id))));
            setShowSmartAssignModal(false);
          }}
          warning={fixedPlayerWarning || undefined}
        />

        {/* Category dialog */}
        {showCategoryDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-80 space-y-4">
              <h2 className="text-xl font-bold text-center">Select Match Category</h2>
              <div className="grid grid-cols-3 gap-3">
                {['MS', 'WS', 'MD', 'WD', 'XD'].map(cat => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setShowCategoryDialog(false); }} className="py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600">{cat}</button>
                ))}
              </div>
              <button onClick={() => setShowCategoryDialog(false)} className="text-sm text-gray-500 hover:underline text-center w-full">Cancel</button>
            </div>
          </div>
        )}

        {/* Layout: Pool (left) + Courts (right) */}
        <div className="flex flex-col gap-6 mt-6 lg:flex-row lg:items-start">
          {/* Player Pool */}
          <div className="w-full lg:w-[25%]">
            <PlayerPool
              players={players}
              setPlayers={setPlayers}
              justAddedPlayerId={justAddedPlayerId as any}
              onReorder={(from: number, to: number) => {
                setPlayers(prev => {
                  const updated = [...prev];
                  const [moved] = updated.splice(from, 1);
                  updated.splice(to, 0, moved);
                  return updated;
                });
              }}
              onDropFromCourt={(player: Player, index: number) => {
                setPlayers(prev => {
                  const without = prev.filter(p => ((p as any).id ?? (p as any)._id) !== ((player as any).id ?? (player as any)._id));
                  const updated = [...without];
                  updated.splice(index, 0, player);
                  return updated;
                });
                setCourts(prev => prev.map(c => ({ ...c, assigned: c.assigned.map(p => ((((p as any).id ?? (p as any)?._id) === ((player as any).id ?? (player as any)._id)) ? null : p)) })));
              }}
            />
          </div>

          {/* Courts */}
          <div className="w-full lg:flex-1 overflow-x-auto">
            <div className="flex flex-wrap justify-center gap-6">
              {storageReady && courts.map(({ courtNo, assigned }, index) => (
                <CourtCard
                  key={courtNo}
                  courtNo={courtNo}
                  assigned={assigned}
                  score={scores[courtNo] || ''}
                  onScoreChange={(value: string) => handleScoreChange(courtNo, value)}
                  onStartStop={(overrideScore?: string) => {
                    if (!intervals[courtNo]) {
                      // START
                      toggleTimer(courtNo);
                      toast.info(`🕒 Match started on Court ${courtNo}`, { position: 'bottom-center' });
                    } else {
                      // STOP (use modal score if provided)
                      handleStartStopMatch({
                        courtNo,
                        courts,
                        scores,
                        timer,
                        setPlayers,
                        setCourts,
                        toggleTimer,
                        setRefreshWinnerKey,
                        onWin: (team: Player[]) => { setWinningTeam(team); setWinningCourt(courtNo); },
                        onScoreChange: (val: string) => handleScoreChange(courtNo, val),
                        overrideScore,
                      });
                    }
                  }}
                  isRunning={!!intervals[courtNo]}
                  time={formatTime(timer[courtNo] || 0)}
                  onRemoveCourt={() => removeCourt(index)}
                  onDropPlayer={(slotIndex: number, player: Player) => {
                    setCourts(prev => prev.map(c => {
                      if (c.courtNo !== courtNo) return c;
                      const updated = [...c.assigned];
                      updated[slotIndex] = player;
                      return { ...c, assigned: updated };
                    }));
                    setPlayers(prev => prev.filter(p => ((p as any).id ?? (p as any)._id) !== ((player as any).id ?? (player as any)._id)));
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150 }}>
        {activePlayerId ? (
          <SortablePoolPlayer player={players.find(p => `pool-${((p as any)._id ?? (p as any).id)}` === activePlayerId)!} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
