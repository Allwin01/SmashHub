// matchUtils.ts
import { Player } from '@/types';
import { toast } from 'react-toastify';

export async function saveMatchHistory(
  assignedPlayers: Player[],
  courtNo: number,
  matchType: string,
  score: string,
  duration: string
) {
  try {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:5050/api/matchHistory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ assignedPlayers, courtNo, matchType, score, duration })
    });
  } catch (err) {
    console.error('❌ Failed to save match history:', err);
    toast.error('❌ Failed to save match history');
  }
}

export async function handleStartStopMatch({
  courtNo,
  courts,
  scores,
  timer,
  setPlayers,
  setCourts,
  toggleTimer,
  setRefreshWinnerKey
}: {
  courtNo: number;
  courts: { courtNo: number; assigned: (Player | null)[] }[];
  scores: Record<number, string>;
  timer: Record<number, number>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setCourts: React.Dispatch<any>;
  toggleTimer: (courtNo: number) => void;
  setRefreshWinnerKey: React.Dispatch<React.SetStateAction<number>>;
}) {
  const assignedPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];
  const scoreValue = scores[courtNo];

  if (!scoreValue || scoreValue === '00/00') {
    const confirmNoSave = window.confirm('⚠️ Score not entered. Match history will not be saved. Proceed?');
    if (!confirmNoSave) return;
    setPlayers(prev => [...prev, ...assignedPlayers]);
    setCourts(prev => prev.map(c => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
    toggleTimer(courtNo);
    return;
  }

  const [scoreA, scoreB] = scoreValue.split('/').map(Number);
  const [teamA, teamB] = assignedPlayers.length === 2
    ? [[assignedPlayers[0]], [assignedPlayers[1]]]
    : [assignedPlayers.slice(0, 2), assignedPlayers.slice(2)];

  const winningTeam = scoreA > scoreB ? teamA : teamB;
  const losingTeam = scoreA > scoreB ? teamB : teamA;

  setPlayers(prev =>
    prev.map(p => winningTeam.find(w => w.id === p.id) ? { ...p, wins: (p.wins || 0) + 1 } : p)
  );

  let matchType = 'MD';
  if (assignedPlayers.length === 2) {
    const [p1, p2] = assignedPlayers;
    if (p1.gender === 'Male' && p2.gender === 'Male') matchType = 'MS';
    else if (p1.gender === 'Female' && p2.gender === 'Female') matchType = 'WS';
    else matchType = 'XD';
  } else if (assignedPlayers.length === 4) {
    const maleCount = assignedPlayers.filter(p => p.gender === 'Male').length;
    const femaleCount = assignedPlayers.filter(p => p.gender === 'Female').length;
    if (maleCount === 4) matchType = 'MD';
    else if (femaleCount === 4) matchType = 'WD';
    else matchType = 'XD';
  }

  const duration = `${String(Math.floor((timer[courtNo] || 0) / 60)).padStart(2, '0')}:${String((timer[courtNo] || 0) % 60).padStart(2, '0')}`;
  await saveMatchHistory(assignedPlayers, courtNo, matchType, scoreValue, duration);

  const clubId = localStorage.getItem('clubId');
  const today = new Date().toISOString().split('T')[0];
  const winnerPayload = winningTeam.filter(p => !p.id.startsWith('guest')).map(p => ({ playerId: p.id, gender: p.gender }));
  if (winnerPayload.length > 0) {
    await fetch('http://localhost:5050/api/matchSummary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ clubId, date: today, matchType, winners: winnerPayload })
    });
  }

  setRefreshWinnerKey(Date.now());
  setPlayers(prev => [...prev, ...winningTeam, ...losingTeam]);
  setCourts(prev => prev.map(c => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
  toggleTimer(courtNo);
  toast.success(`✅ Match saved! 🏆 ${winningTeam.map(p => p.name).join(' & ')} won`, {
    autoClose: 5000,
    position: 'top-center'
  });
}
