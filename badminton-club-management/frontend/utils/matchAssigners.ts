import { Player } from '@/types';
import { toast } from 'react-toastify';

export const fetchTopPlayersWithHistory = async (
  clubId: string,
  limit = 15
): Promise<Player[]> => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5050/api/matchHistory/top-players?clubId=${clubId}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    return data.players || [];
  } catch (err) {
    console.error('❌ Error fetching top players with history:', err);
    toast.error('Failed to load top players');
    return [];
  }
};

export const handleSmartAssign = async (
  clubId: string,
  category: string,
  level: 'High' | 'Medium' | 'Low',
  courts: any[],
  setCourts: any,
  setPlayers: any,
  toggleTimer: any
) => {
  const court = courts.find(c => c.assigned.filter(Boolean).length === 0);
  if (!court) return toast.warn('No free court available');

  const players = await fetchTopPlayersWithHistory(clubId);
  if (!players || players.length < 4) {
    toast.error('Not enough historical data to perform Smart assignment');
    return;
  }

  let eligible = players.map(p => {
    const recent = p.matchHistory?.slice(-10) || [];
    const avgScore = Math.round(recent.reduce((sum, m) => sum + m.points, 0) / (recent.length || 1));
    return { ...p, avgScore };
  });

  if (['MS', 'MD'].includes(category)) eligible = eligible.filter(p => p.gender === 'Male');
  if (['WS', 'WD'].includes(category)) eligible = eligible.filter(p => p.gender === 'Female');

  const high = eligible.filter(p => p.avgScore >= 70);
  const medium = eligible.filter(p => p.avgScore >= 40 && p.avgScore < 70);
  const low = eligible.filter(p => p.avgScore < 40);

  let selected = level === 'High' ? [...high, ...medium, ...low] :
                 level === 'Medium' ? [...medium, ...high, ...low] :
                 [...low, ...medium, ...high];

  selected = selected.slice(0, 4);
  if (selected.length < 4) return toast.error('Not enough qualified players for this level');

  setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
  setPlayers((prev: Player[]) => prev.filter(p => !selected.find(s => s.id === p.id)));
  toggleTimer(court.courtNo);
};

export const handleAutoAssign = (
  category: string,
  courts: any[],
  players: Player[],
  setCourts: any,
  setPlayers: any,
  toggleTimer: any,
  suggestedPlayers: Player[] = [],
  setSuggestedPlayers?: (players: Player[]) => void,
  previewOnly: boolean = false
) => {
  const court = courts.find(c => c.assigned.filter(Boolean).length === 0);
  if (!court) return toast.warn('No available court found');

  let eligiblePlayers: Player[] = [];
  switch (category) {
    case 'MS':
    case 'MD':
      eligiblePlayers = players.filter(p => p.gender === 'Male' && !p.id.startsWith('guest'));
      break;
    case 'WS':
    case 'WD':
      eligiblePlayers = players.filter(p => p.gender === 'Female' && !p.id.startsWith('guest'));
      break;
    case 'XD':
      const males = players.filter(p => p.gender === 'Male' && !p.id.startsWith('guest'));
      const females = players.filter(p => p.gender === 'Female' && !p.id.startsWith('guest'));
      if (males.length < 2 || females.length < 2) {
        toast.error('Not enough male and female players for Mixed Doubles');
        return;
      }
      const xdSelected = [males[0], females[0], males[1], females[1]];
      if (previewOnly) {
        if (setSuggestedPlayers) setSuggestedPlayers(xdSelected);
        return;
      }
      setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: xdSelected } : c));
      setPlayers(prev => prev.filter(p => !xdSelected.includes(p)));
      toggleTimer(court.courtNo);
      if (setSuggestedPlayers) setSuggestedPlayers(xdSelected);
      return;
  }

  if (eligiblePlayers.length < 4) {
    toast.error('Not enough eligible players');
    return;
  }

  const fixed = players[0]; // ✅ Always first in full pool
  const rest = eligiblePlayers.filter(p => p.id !== fixed.id);
  const shuffled = [...rest].sort(() => 0.5 - Math.random());
  const selected = [fixed, ...shuffled.slice(0, 3)];

  if (previewOnly) {
    if (setSuggestedPlayers) setSuggestedPlayers(selected);
    return;
  }

  setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
  setPlayers(prev => prev.filter(p => !selected.includes(p)));
  toggleTimer(court.courtNo);
  if (setSuggestedPlayers) setSuggestedPlayers(selected);
};
