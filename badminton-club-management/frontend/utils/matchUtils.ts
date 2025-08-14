// matchUtils.ts
import { Player } from '@/types';
import { toast } from 'react-toastify';


const getId = (p: any): string => (p?.id ?? p?._id ?? '')?.toString();
const getGender = (p: any): string => (p?.gender ?? p?.sex ?? '');
const isGuest = (p: any): boolean =>
  Boolean(p?.isGuest || p?.playerType === 'Guest' || getId(p).startsWith('guest'));


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
      body: JSON.stringify({
        courtNo,
        matchType,
        score,
        duration,
        assignedPlayers: assignedPlayers.map(p => ({
          id: p.id,
          name: `${p.firstName ?? ''} ${p.surName ?? ''}`.trim(),
          gender: p.gender ?? p.sex,
          isGuest: p.isGuest || p.playerType === 'Guest',
        }))
      })
    });
    
  
  } catch (err) {
    console.error('❌ Failed to save match history:', err);
    toast.error('❌ Failed to save match history');
  }
}  

function getWinningTeam(score: string, teamA: Player[], teamB: Player[]): Player[] | null {
  const [a, b] = score.split('/').map(Number);
  const max = Math.max(a, b);
  const min = Math.min(a, b);

  if (max < 21) return null;
  if (max === 21 && min <= 19) return a > b ? teamA : teamB;
  if (max >= 22 && max <= 30 && max - min >= 2) return a > b ? teamA : teamB;
  if (max === 30) return a > b ? teamA : teamB;

  return null;
}

{/*}

export async function handleStartStopMatch({
  courtNo,
  courts,
  scores,
  timer,
  setPlayers,
  setCourts,
  toggleTimer,
  setRefreshWinnerKey,
  onWin,
  onScoreChange // ✅ Added this prop

}: {
  courtNo: number;
  courts: { courtNo: number; assigned: (Player | null)[] }[];
  scores: Record<number, string>;
  timer: Record<number, number>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setCourts: React.Dispatch<any>;
  toggleTimer: (courtNo: number) => void;
  setRefreshWinnerKey: React.Dispatch<React.SetStateAction<number>>;
  onWin?: (team: Player[]) => void;
  onScoreChange?: (val: string) => void; // ✅ Pass this from CourtCard
}) {
  const assignedPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];
const scoreValue = scores[courtNo];  */}

export async function handleStartStopMatch({
  courtNo,
  courts,
  scores,
  timer,
  setPlayers,
  setCourts,
  toggleTimer,
  setRefreshWinnerKey,
  onWin,
  onScoreChange,
  overrideScore,             // ✅ add this
}: {
  courtNo: number;
  courts: { courtNo: number; assigned: (Player | null)[] }[];
  scores: Record<number, string>;
  timer: Record<number, number>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setCourts: React.Dispatch<any>;
  toggleTimer: (courtNo: number) => void;
  setRefreshWinnerKey: React.Dispatch<React.SetStateAction<number>>;
  onWin?: (team: Player[]) => void;
  onScoreChange?: (val: string) => void;
  overrideScore?: string;    // ✅ add this
}) {

  console.group(`🏁 handleStartStopMatch(court ${courtNo})`);
  console.log('Args →', {
    overrideScore,
    scoresAtCourt: scores?.[courtNo],
    timerAtCourt: timer?.[courtNo],
  });

  const assignedPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];

  // ✅ Prefer the modal's score if provided
  const scoreValue = (overrideScore ?? scores[courtNo] ?? '').trim();

  console.log('Derived scoreValue =', scoreValue);

  if (!scoreValue || scoreValue === '00/00') {

    console.warn('⛔ No score detected — showing confirm dialog');

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


    console.log('✅ Proceeding with scoreValue, assignedPlayers:', {
      scoreValue,
      teamA: assignedPlayers.slice(0, 2).map(p => ({ id: p?.id ?? p?._id, name: `${p?.firstName} ${p?.surName ?? ''}` })),
      teamB: assignedPlayers.slice(2, 4).map(p => ({ id: p?.id ?? p?._id, name: `${p?.firstName} ${p?.surName ?? ''}` })),
    });

  const winningTeam = getWinningTeam(scoreValue, teamA, teamB);
  if (!winningTeam) {
    toast.warn('⚠️ Match undecided. Ensure score follows badminton rules.');
    return;
  }

  const losingTeam = winningTeam === teamA ? teamB : teamA;

  // Trigger confetti or UI animation via parent callback
  if (onWin) onWin(winningTeam);

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
  const winnerPayload = (winningTeam ?? [])
  .filter((p) => {
    const id = getId(p);
    return id && !isGuest(p); // skip guests; also skip empty ids
  })
  .map((p) => ({
    playerId: getId(p),
    gender: getGender(p),
  }));

  const loserPayload = (losingTeam ?? [])
  .filter((p) => {
    const id = getId(p);
    return id && !isGuest(p);
  })
  .map((p) => ({
    playerId: getId(p),
    gender: getGender(p),
  }));


  if (winnerPayload.length > 0 && loserPayload.length > 0) {
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
  // ✅ Now reset score (which will hide the textbox)
  if (onScoreChange) onScoreChange(''); // ✅ Now clear score field to hide input

}
