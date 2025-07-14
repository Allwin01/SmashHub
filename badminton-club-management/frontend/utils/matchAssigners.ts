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


export const handleAutoAssign = (
  category: string,
  courts: any[],
  players: Player[],
  setCourts: any,
  setPlayers: any,
  toggleTimer: any,
  suggestedPlayers: Player[] = [],
  setSuggestedPlayers?: (players: Player[]) => void,
  previewOnly: boolean = false,
  allowFullPool: boolean = false
) => {
  const court = courts.find(c => c.assigned.filter(Boolean).length === 0);
  if (!court) return toast.warn('No available court found');

  const fixedPlayer = players[0];
  if (!fixedPlayer) return toast.error('No players available to assign');

  let eligiblePlayers = players.slice(1, 8);
  if (allowFullPool) eligiblePlayers = players.slice(1);

  switch (category) {
    case 'MS':
    case 'MD':
      eligiblePlayers = eligiblePlayers.filter(p => p.gender === 'Male');
      break;
    case 'WS':
    case 'WD':
      eligiblePlayers = eligiblePlayers.filter(p => p.gender === 'Female');
      break;
    case 'XD': {
      const males = eligiblePlayers.filter(p => p.gender === 'Male');
      const females = eligiblePlayers.filter(p => p.gender === 'Female');
      if (males.length < 2 || females.length < 2) {
        if (!previewOnly) toast.error('Not enough eligible players for Mixed Doubles');
        return;
      }
      const selected = [fixedPlayer, males[0], females[0], females[1]].filter(
        (p, i, self) => self.findIndex(x => x.id === p.id) === i
      );
      if (selected.length < 4) {
        if (!previewOnly) toast.error('Duplicate players in XD combination');
        return;
      }
      if (previewOnly && setSuggestedPlayers) return 
       
        setSuggestedPlayers(selected);
      
          
      
      setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
      setPlayers(prev => prev.filter(p => !selected.some(s => s.id === p.id)));
      toggleTimer(court.courtNo);
      return;
    }
  }

  if (eligiblePlayers.length < 3) {
    if (!previewOnly) toast.error('Not enough eligible players');
    return;
  }

  const rest = eligiblePlayers.filter(p => p.id !== fixedPlayer.id);
  const shuffled = [...rest].sort(() => 0.5 - Math.random());
  const selected = [fixedPlayer, ...shuffled.slice(0, 3)].filter(
    (p, i, self) => self.findIndex(x => x.id === p.id) === i
  );

  if (selected.length < 4) {
    if (!previewOnly) toast.error('Not enough unique players for this assignment');
    return;
  }

  if (previewOnly && setSuggestedPlayers) {
    setSuggestedPlayers(selected);
    return;
  }

  setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
  setPlayers(prev => prev.filter(p => !selected.some(s => s.id === p.id)));
  toggleTimer(court.courtNo);
};


export const handleSmartAssign = async (
    clubId: string,
    category: string,
    level: 'High' | 'Medium' | 'Low' | 'Wildcard',
    courts: any[],
    setCourts: any,
    setPlayers: any,
    toggleTimer: any,
    previewOnly: boolean = false,
    setSuggestedPlayers?: (players: Player[]) => void
  ) => {
    const court = courts.find(c => c.assigned.filter(Boolean).length === 0);
    if (!court) return toast.warn('No available court found');
  
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5050/api/matchHistory/top-players?clubId=${clubId}&limit=15`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  
    const { players: allPlayers = [] } = await res.json();
    if (allPlayers.length < 4) {
      if (!previewOnly) toast.error('Not enough historical data');
      return;
    }
  
    const fixedPlayer = allPlayers[0];
    let eligible = allPlayers.slice(1);
  
    const enriched = eligible.map(p => {
      const scores = p.matchHistory?.slice(-10).map(m => m.points) || [];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { ...p, avgScore: avg };
    });
  
    const hard = [...enriched].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
    const medium = [...enriched].sort((a, b) => b.avgScore - a.avgScore).slice(3, 6);
    const easy = [...enriched].sort((a, b) => b.avgScore - a.avgScore).slice(6, 9);
  
    const wildcard = [...enriched].sort(() => 0.5 - Math.random()).slice(0, 3);
  
    const groups = [
      { label: '🏆 Hard', players: [fixedPlayer, ...hard] },
      { label: '⚖️ Balanced', players: [fixedPlayer, ...medium] },
      { label: '🎉 Easy', players: [fixedPlayer, ...easy] },
      { label: '🎲 Surprise Me', players: [fixedPlayer, ...wildcard] }
    ];
  
    const validGroups = groups.map(g => ({
      label: g.label,
      players: g.players.filter((p, i, self) => self.findIndex(x => x.id === p.id) === i)
    })).filter(g => g.players.length === 4);
  
    if (previewOnly && setSuggestedPlayers) {
        console.log('🔧 Running getAllSuggestedTeams for category:', category);
console.log('📊 Player count:', players.length);

      // Default to first available valid group
      setSuggestedPlayers(validGroups[0]?.players || []);
      return;
    }
  
    const selected = validGroups[0]?.players;
    if (!selected || selected.length < 4) {
      if (!previewOnly) toast.error('No suitable team found');
      return;
    }
  
    setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
    setPlayers(prev => prev.filter(p => !selected.some(s => s.id === p.id)));
    toggleTimer(court.courtNo);
  };
  



export const getAllSuggestedTeams = async (
    clubId: string,
    players: Player[],
    courts: any[]
  ): Promise<
    {
      label: string;
      icon: string;
      players: Player[];
    }[]
  > => {
    const firstPlayer = players[0];
    const remaining = players.slice(1, 8); // next 7 for variety
    const clubToken = localStorage.getItem('token');
  
    const courtAvailable = courts.find(c => c.assigned.every(p => !p));
    if (!courtAvailable || !firstPlayer) return [];
  
    // Fetch player stats if needed
    const enriched = await Promise.all(
      remaining.map(async (p) => {
        const scores = p.matchHistory?.slice(-10).map(m => m.points) || [];
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return { ...p, avgScore };
      })
    );
  
    const buckets = {
      hard: [] as Player[],
      medium: [] as Player[],
      easy: [] as Player[],
    };
  
    enriched.forEach(p => {
      if (p.avgScore >= 70) buckets.hard.push(p);
      else if (p.avgScore >= 40) buckets.medium.push(p);
      else buckets.easy.push(p);
    });
  
    const buildTeam = (bucket: Player[]) => {
      const filtered = bucket.filter(p => p.id !== firstPlayer.id);
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selected = [firstPlayer, ...shuffled.slice(0, 3)];
      const unique = new Set(selected.map(p => p.id));
      return unique.size === 4 ? selected : [];
    };
  
    const surprisePool = [...players.slice(1)].sort(() => 0.5 - Math.random());
    const surpriseTeam = [firstPlayer, ...surprisePool.slice(0, 3)];
  
    const validTeam = (team: Player[]) => team.length === 4 && new Set(team.map(p => p.id)).size === 4;
  
    const results = [
      {
        label: '🏆 Hard',
        icon: '🔥',
        players: buildTeam(buckets.hard),
      },
      {
        label: '⚖️ Medium',
        icon: '📊',
        players: buildTeam(buckets.medium),
      },
      {
        label: '🎉 Easy',
        icon: '🎯',
        players: buildTeam(buckets.easy),
      },
      {
        label: '🎲 Surprise Me',
        icon: '❓',
        players: validTeam(surpriseTeam) ? surpriseTeam : [],
      },
    ];
  
    return results.filter(option => option.players.length === 4);
  };
  