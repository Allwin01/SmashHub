'use client';

import { Player } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';

/**
 * AllClubSelector — fixed for CourtCard assigned[] structure
 *
 * ✅ Behaviour
 * - If a player is on a court (from CourtCard.assigned[]), their button shows **In Play** (disabled).
 * - If a player is in the Player Pool, their button shows **Remove**.
 * - If neither, their button shows **Add**.
 *
 * ✅ Attendance caching (improved)
 * - First add per day posts "Present" once, then caches it in-memory **and** localStorage
 *   per (clubId, date) so the green tick appears instantly and survives reloads.
 * - Avoids duplicate POSTs and unnecessary network calls.
 *
 * - Robust ID normalization: supports `_id`, `id`, or `playerId` (string/ObjectId).
 */

interface AllClubSelectorProps {
  allPlayers: Player[];
  playerPool: Player[];                 // current pool state
  courtPlayers: (Player | null)[];      // flattened from all courts' assigned[]
  setPlayerPool: React.Dispatch<React.SetStateAction<Player[]>>;
  open: boolean;
  setOpen: (val: boolean) => void;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>; // legacy pool setter
  setJustAddedPlayerId: (id: string) => void;                 // legacy helper
  onClose?: () => void;
}

// --- helpers ---------------------------------------------------------------
const toId = (p: any): string => {
  if (!p) return '';
  const raw = p._id ?? p.id ?? p.playerId ?? p;
  try { return typeof raw === 'string' ? raw : String(raw); } catch { return ''; }
};

// session-level cache for this tab
const presentCache = new Set<string>();

// localStorage helpers (persist per clubId + date)
const storageKey = (clubId: string, date: string) => `present:${clubId}:${date}`;
const loadPresent = (clubId: string, date: string): Set<string> => {
  try {
    const raw = localStorage.getItem(storageKey(clubId, date));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set((Array.isArray(arr) ? arr : []).map((x) => String(x)));
  } catch {
    return new Set();
  }
};
const savePresent = (clubId: string, date: string, set: Set<string>) => {
  try {
    localStorage.setItem(storageKey(clubId, date), JSON.stringify(Array.from(set)));
  } catch {}
};

export default function AllClubSelector({
  allPlayers,
  playerPool,
  courtPlayers,
  setPlayerPool,
  open,
  setOpen,
  setPlayers,
  setJustAddedPlayerId,
  onClose,
}: AllClubSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());

  const loadedForDayRef = useRef<string>('');

  // Build fast-lookup sets
  const poolSet = useMemo(() => new Set(playerPool.map(toId)), [playerPool]);
  const courtSet = useMemo(() => new Set((courtPlayers ?? []).map(toId)), [courtPlayers]);
  const engagedSet = useMemo(() => new Set([ ...Array.from(poolSet), ...Array.from(courtSet) ]), [poolSet, courtSet]);

  const filteredPlayers = useMemo(
    () => (allPlayers ?? []).filter(p => `${p.firstName} ${p.surName}`.toLowerCase().includes(searchTerm.toLowerCase())),
    [allPlayers, searchTerm]
  );

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) onClose?.();
  };

  const markAttendanceIfNeeded = async (player: Player) => {
    const pid = toId(player);
    if (!pid) return;

    const today = new Date().toISOString().slice(0, 10);
    const clubId = localStorage.getItem('clubId') || '';

    // skip if this player already marked present (tab or localStorage)
    if (presentCache.has(pid) || loadPresent(clubId, today).has(pid)) return;

    try {
      const weekday = format(new Date(today), 'EEEE');
      const token = localStorage.getItem('token') || '';
      if (!token || !clubId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/players/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attendance: [{ playerId: pid, date: today, day: weekday, status: 'Present' }], clubId }),
      });
      if (!res.ok) return;

      // update caches → instant green tick + persist for reload
      presentCache.add(pid);
      setPresentIds(prev => {
        const next = new Set(prev).add(pid);
        savePresent(clubId, today, next);
        return next;
      });
    } catch {}
  };

  const handleAddToPool = async (player: Player) => {
    const pid = toId(player);
    if (!pid) return;

    // Do not add if already in pool or in play
    if (engagedSet.has(pid)) return;

    setPlayers(prev => (prev.some(p => toId(p) === pid) ? prev : [...prev, player]));
    setJustAddedPlayerId(pid);
    await markAttendanceIfNeeded(player);
  };

  const handleRemoveFromPool = (playerId: string) => {
    setPlayerPool(prev => prev.filter(p => toId(p) !== playerId));
  };

  // Preload today's attendance ticks (merge: localStorage → API → caches)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const clubId = localStorage.getItem('clubId') || '';
    const token = localStorage.getItem('token') || '';

    if (!clubId) return;
    if (loadedForDayRef.current === `${clubId}:${today}`) return; // avoid reloading
    loadedForDayRef.current = `${clubId}:${today}`;

    // 1) load from localStorage first for instant UI
    const initial = loadPresent(clubId, today);
    if (initial.size > 0) {
      setPresentIds(new Set(initial));
      presentCache.clear();
      initial.forEach((id) => presentCache.add(id));
    }

    // 2) merge with server truth (if we have a token)
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/players/attendance?date=${today}&clubId=${clubId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then((rows: any[]) => {
        const next = new Set<string>(presentCache);
        rows?.forEach(r => { if (r?.status === 'Present' && r?.playerId) next.add(String(r.playerId)); });
        setPresentIds(next);
        presentCache.clear();
        next.forEach(id => presentCache.add(id));
        savePresent(clubId, today, next);
      })
      .catch(() => {});
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-3 pb-2">
          <DialogTitle className="w-full text-center text-2xl md:text-3xl font-extrabold tracking-tight">Club Players</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Search player..."
            className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="px-4 py-2 h-[60vh]">
          <div className="space-y-2">
            {filteredPlayers.map((player) => {
              const id = toId(player);
              const inPool = poolSet.has(id);
              const onCourt = courtSet.has(id);
              const present = presentIds.has(id);

              const isFemale = String((player as any).gender ?? (player as any).sex ?? '').toLowerCase() === 'female';

              const gradient = isFemale
                ? 'bg-gradient-to-r from-pink-500 to-blue-500'
                : 'bg-gradient-to-r from-blue-500 to-pink-500';

              let label = 'Add';
              let disabled = false;
              let btnClass = 'bg-white text-green-600';

              if (onCourt) {
                label = 'In Play';
                disabled = true;
                btnClass = 'bg-white text-gray-400 cursor-not-allowed';
              } else if (inPool) {
                label = 'Remove';
                btnClass = 'bg-white text-red-500';
              }

              return (
                <div key={id} className={`flex justify-between items-center p-2 rounded-lg mb-2 ${gradient}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {(player as any).profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(player as any).profileImage} alt={`${(player as any).firstName} ${(player as any).surName}`} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-sm font-bold text-gray-800">
                          {`${(player as any).firstName?.[0] ?? ''}${(player as any).surName?.[0] ?? ''}`}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold text-base flex items-center gap-1">
                      {(player as any).firstName} {(player as any).surName}
                      {present && <CheckCircle size={20} className="text-green-400" title="Present" />}
                    </div>
                  </div>

                  <button
                    disabled={disabled}
                    onClick={() => (inPool ? handleRemoveFromPool(id) : handleAddToPool(player))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md transition ${btnClass}`}
                  >
                    {label}
                  </button>
                </div>
              );
            })}

            {filteredPlayers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No players found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}



{/*}
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle } from 'lucide-react';
import type { Player } from '@/types';

/**
 * ✅ What this refactor fixes
 * - Button state now respects players who are either in the Pool OR currently on a Court
 *   via `engagedPlayerIds` (recommended) or falls back to `playerPool` if not provided.
 * - Avoids double-adds (disables Add while the player is in play).
 * - Attendance is marked only the first time a player is added for the day.
 * - Defensive ID handling (supports _id | id consistently).
 * - Smaller, cleaner props surface; backwards compatible with your existing `setPlayers` & `setJustAddedPlayerId`.
 *

// --- Utils ------------------------------------------------------------------
const getId = (p: Player | { _id?: string; id?: string } | null | undefined) =>
  (p && (p as any)._id) || (p as any)?.id || '';

// Cache of players marked present for today (session-level)
const presentCache = new Set<string>();

// --- Props ------------------------------------------------------------------
interface AllClubSelectorProps {
  open: boolean;
  setOpen: (v: boolean) => void;

  /** All club members to render in the modal *
  allPlayers: Player[];

  /** Current Player Pool (used as a fallback if engagedPlayerIds is not provided) *
  playerPool: Player[];

  /** IDs of players who are either in the Pool OR currently on a Court. *
  engagedPlayerIds?: string[] | Set<string>;

  /**
   * Handlers (preferred). If not provided, component will fall back to legacy
   * `setPlayers` / `setJustAddedPlayerId` behaviour
   *
  onAddToPool?: (player: Player) => Promise<void> | void;
  onRemoveFromPool?: (playerId: string) => void;

  /** Legacy (back-compat) *
  setPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  setJustAddedPlayerId?: (id: string) => void;
}

export default function AllClubSelector(props: AllClubSelectorProps) {
  const {
    open,
    setOpen,
    allPlayers,
    playerPool,
    engagedPlayerIds,
    onAddToPool,
    onRemoveFromPool,
    setPlayers, // legacy
    setJustAddedPlayerId, // legacy
  } = props;

  const [search, setSearch] = useState('');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const todayKeyRef = useRef<string>('');

  // Compose engaged set: prefer explicit prop, else infer from the pool
  const engagedSet: Set<string> = useMemo(() => {
    if (engagedPlayerIds) {
      return new Set(Array.isArray(engagedPlayerIds) ? engagedPlayerIds : [...engagedPlayerIds]);
    }
    return new Set(playerPool.map(getId));
  }, [engagedPlayerIds, playerPool]);

  // Preload today's attendance into presentIds (and presentCache for session)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (todayKeyRef.current === today) return; // already loaded for today

    const clubId = typeof window !== 'undefined' ? localStorage.getItem('clubId') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!clubId || !token) return;

    todayKeyRef.current = today;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/players/attendance?date=${today}&clubId=${clubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const records = await res.json();
        const next = new Set<string>(presentCache);
        for (const r of records || []) {
          if (r?.status === 'Present' && r?.playerId) next.add(r.playerId);
        }
        // sync both state and cache
        setPresentIds(next);
        presentCache.clear();
        next.forEach((id) => presentCache.add(id));
      } catch (_) {
        // fail silently; attendance is a nice-to-have for UI only
      }
    })();
  }, []);

  const markAttendanceIfNeeded = async (player: Player) => {
    const pid = getId(player);
    if (!pid || presentCache.has(pid)) return; // already marked this session

    try {
      const today = new Date().toISOString().slice(0, 10);
      const weekday = format(new Date(today), 'EEEE');

      const token = localStorage.getItem('token') || '';
      const clubId = localStorage.getItem('clubId') || '';
      if (!token || !clubId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/players/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attendance: [{ playerId: pid, date: today, day: weekday, status: 'Present' }],
          clubId,
        }),
      });
      if (!res.ok) return;

      // Update caches so the green tick appears immediately
      presentCache.add(pid);
      setPresentIds((prev) => new Set(prev).add(pid));
    } catch (_) {
      // ignore; UI should not break if attendance API fails
    }
  };

  const handleAdd = async (player: Player) => {
    const pid = getId(player);
    if (!pid) return;

    // Guard: if already engaged (pool or court), we do nothing
    if (engagedSet.has(pid)) return;

    if (onAddToPool) {
      await onAddToPool(player);
    } else if (setPlayers) {
      // legacy behaviour: push to pool via setPlayers
      setPlayers((prev) => {
        if (prev.some((p) => getId(p) === pid)) return prev; // already in pool
        return [...prev, player];
      });
      setJustAddedPlayerId?.(pid);
    }

    await markAttendanceIfNeeded(player);
  };

  const handleRemove = (playerId: string) => {
    if (!playerId) return;
    if (onRemoveFromPool) onRemoveFromPool(playerId);
    else if (setPlayers) {
      // legacy: remove from pool list
      setPlayers((prev) => prev.filter((p) => getId(p) !== playerId));
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPlayers || [];
    return (allPlayers || []).filter((p) => `${p.firstName || ''} ${p.surName || ''}`.toLowerCase().includes(q));
  }, [allPlayers, search]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Club Players</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Search player..."
            className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="px-4 py-2 h-[60vh]">
          <div className="space-y-2">
            {filtered.map((player) => {
              const id = getId(player);
              const engaged = engagedSet.has(id); // in pool or currently on a court
              const inPool = new Set(playerPool.map(getId)).has(id);
              const present = presentIds.has(id);

              const gradient = player.gender === 'Female'
                ? 'bg-gradient-to-r from-pink-400 to-blue-500'
                : 'bg-gradient-to-r from-blue-400 to-pink-500';

              // Button label & state
              let label = 'Add';
              let disabled = false;
              let buttonClass = 'bg-white text-green-600';

              if (engaged) {
                if (inPool) {
                  label = 'Remove';
                  buttonClass = 'bg-white text-red-500';
                } else {
                  // occupied on a court -> do not allow adding duplicates
                  label = 'In Play';
                  disabled = true;
                  buttonClass = 'bg-white text-gray-400 cursor-not-allowed';
                }
              }

              return (
                <div key={id} className={`flex justify-between items-center p-2 rounded-lg mb-2 ${gradient}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {player.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.profileImage} alt={`${player.firstName} ${player.surName}`} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-sm font-bold text-gray-800">
                          {(player.firstName?.[0] || '') + (player.surName?.[0] || '')}
                        </span>
                      )}
                    </div>

                    <div className="text-white font-semibold text-base flex items-center gap-1">
                      {player.firstName} {player.surName}
                      {present && <CheckCircle size={20} className="text-green-400 drop-shadow-sm" title="Present" />}
                    </div>
                  </div>

                  <button
                    disabled={disabled}
                    onClick={() => (engaged ? handleRemove(id) : handleAdd(player))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md transition ${buttonClass}`}
                  >
                    {label}
                  </button>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No players found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

*/}


{/*}
'use client';

import { Player } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface AllClubSelectorProps {
  allPlayers: Player[];
  playerPool: Player[];
  setPlayerPool: React.Dispatch<React.SetStateAction<Player[]>>;
  open: boolean;
  setOpen: (val: boolean) => void;
  clubPlayers: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setJustAddedPlayerId: (id: string) => void;
  onClose: () => void;
}

const attendedSet = new Set<string>();

export default function AllClubSelector({
  allPlayers,
  playerPool,
  setPlayerPool,
  open,
  setOpen,
  clubPlayers,
  setPlayers,
  setJustAddedPlayerId,
  onClose
}: AllClubSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddToPool = async (player: Player) => {
    const alreadyInPool = playerPool.some(p => (p._id || p.id) === (player._id || player.id));
    if (alreadyInPool) return;

    setPlayers(prev => [...prev, player]);
    setJustAddedPlayerId(player._id || player.id);

    if (!attendedSet.has(player._id || player.id)) {
      await markAttendance(player);
      attendedSet.add(player._id || player.id);
    }
  };

  const handleRemoveFromPool = (playerId: string) => {
    setPlayerPool(prev => prev.filter(p => (p._id || p.id) !== playerId));
  };

  const isInPool = (playerId: string) => {
    return playerPool.some(p => (p._id || p.id) === playerId);
  };

  const filteredPlayers = (allPlayers ?? []).filter(player =>
    `${player.firstName} ${player.surName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markAttendance = async (player: Player) => {
    const today = new Date().toISOString().slice(0, 10);
    const weekday = format(new Date(today), 'EEEE');

    const record = {
      playerId: player._id || player.id,
      date: today,
      day: weekday,
      status: 'Present',
    };

    try {
      const res = await fetch('http://localhost:5050/api/players/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          attendance: [record],
          clubId: localStorage.getItem('clubId'),
        }),
      });

      if (!res.ok) throw new Error('Failed to save attendance');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const clubId = localStorage.getItem('clubId');
    const token = localStorage.getItem('token');

    if (!clubId || !token) return;

    fetch(`http://localhost:5050/api/players/attendance?date=${today}&clubId=${clubId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        data.forEach((record: any) => {
          if (record.status === 'Present') attendedSet.add(record.playerId);
        });
      })
      .catch(console.error);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Club Players</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Search player..."
            className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="px-4 py-2 h-[60vh]">
          <div className="space-y-2">
            {filteredPlayers.map((player) => {
              const inPool = isInPool(player._id);
              const gradient = player.gender === 'Female'
                ? 'bg-gradient-to-r from-pink-400 to-blue-500'
                : 'bg-gradient-to-r from-blue-400 to-pink-500';

              const hasBeenMarkedPresent = attendedSet.has(player._id || player.id);

              return (
                <div
                  key={player._id}
                  className={`flex justify-between items-center p-2 rounded-lg mb-2 ${gradient}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {player.profileImage ? (
                        <img
                          src={player.profileImage}
                          alt={`${player.firstName} ${player.surName}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-800">
                          {(player.firstName?.[0] || '') + (player.surName?.[0] || '')}
                        </span>
                      )}
                    </div>

                    <div className="text-white font-semibold text-base flex items-center gap-1">
                      {player.firstName} {player.surName}
                      {hasBeenMarkedPresent && (
                        <CheckCircle size={20} className="text-green-400 drop-shadow-sm" title="Present" />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      inPool ? handleRemoveFromPool(player._id) : handleAddToPool(player)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md transition ${
                      inPool ? 'bg-white text-red-500' : 'bg-white text-green-600'
                    }`}
                  >
                    {inPool ? 'Remove' : 'Add'}
                  </button>
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No players found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

*/}
