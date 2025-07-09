
'use client';

import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Player {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  matchCount?: number;
  matchHistory?: { points: number }[];
  avgScore?: number;
}

function SortablePlayer({ id, name, gender }: Player) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const gradient = gender === 'Male' ? 'from-blue-400 to-purple-400' : 'from-pink-400 to-cyan-400';

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`p-2 mb-2 bg-gradient-to-r ${gradient} rounded-xl shadow cursor-move border border-gray-300 text-white font-semibold`}
    >
      {name}
    </motion.div>
  );
}

function PlayerSlot({ player }: { player: Player | null }) {
  if (!player) return <div className="bg-white/20 w-full h-full rounded-xl" />;
  const color = player.gender === 'Male' ? 'from-blue-400 to-cyan-400' : 'from-pink-400 to-purple-400';
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${color} px-4 py-2 rounded-xl shadow-lg text-sm font-bold text-white border-2 border-white/30 backdrop-blur-sm`}
    >
      {player.name}
    </motion.div>
  );
}

export default function PegBoard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<{ courtNo: number; assigned: Player[] }[]>([{ courtNo: 1, assigned: [] }]);
  const [timer, setTimer] = useState<Record<number, number>>({});
  const [intervals, setIntervals] = useState<Record<number, NodeJS.Timeout>>({});
  const [scores, setScores] = useState<Record<number, string>>({});
  const [category, setCategory] = useState<string>('Mens Doubles');
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

// Add state handlers
const [showMatchPopup, setShowMatchPopup] = useState(false);
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [selectionMode, setSelectionMode] = useState<'Auto' | 'Smart' | null>(null);
const [smartLevel, setSmartLevel] = useState<'High' | 'Medium' | 'Low' | null>(null);


  // Fetch player attendance from backend

const toastShownRef = useRef(false);

useEffect(() => {
  const fetchPlayers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = localStorage.getItem('token');
      const clubId = localStorage.getItem('clubId');

      if (!token || !clubId) throw new Error('Missing token or clubId');

      const res = await fetch(
        `http://localhost:5050/api/players/attendances?date=${today}&clubId=${clubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);

      const data = await res.json();
      setPlayers(data);
      setHasFetched(true);
    } catch (err) {
      console.error('❌ Error fetching players:', err);
      if (!toastShownRef.current) {
        toast.error('❌ Failed to fetch players');
        toastShownRef.current = true;
      }
    }
  };

  if (!hasFetched) fetchPlayers();
}, [hasFetched]);


  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id && over?.id && active.id !== over.id) {
      const draggedPlayer = players.find(p => p.id === active.id);
      if (!draggedPlayer) return;
      const availableCourt = courts.find(c => c.assigned.length < 4);
      if (availableCourt) {
        setCourts(prev => prev.map(c => c.courtNo === availableCourt.courtNo ? { ...c, assigned: [...c.assigned, draggedPlayer] } : c));
        setPlayers(prev => prev.filter(p => p.id !== draggedPlayer.id));
      }
    }
  };

  const addCourt = () => setCourts(prev => [...prev, { courtNo: prev.length + 1, assigned: [] }]);

  const removeCourt = (index: number) => {
    const courtNo = courts[index].courtNo;
    setCourts(prev => prev.filter((_, i) => i !== index));
    clearInterval(intervals[courtNo]);
    const { [courtNo]: _, ...rest } = timer;
    setTimer(rest);
  };

  const toggleTimer = (courtNo: number) => {
    if (intervals[courtNo]) {
      clearInterval(intervals[courtNo]);
      const newIntervals = { ...intervals };
      delete newIntervals[courtNo];
      setIntervals(newIntervals);
    } else {
      const newIntervals = {
        ...intervals,
        [courtNo]: setInterval(() => {
          setTimer(prev => ({ ...prev, [courtNo]: (prev[courtNo] || 0) + 1 }));
        }, 1000)
      };
      setIntervals(newIntervals);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleScoreChange = (courtNo: number, value: string) => {
    setScores(prev => ({ ...prev, [courtNo]: value }));
  };


  //Add Guest Player
  const addGuestPlayer = (name: string, gender: 'Male' | 'Female') => {
    const newId = 'guest_' + Date.now();
    setPlayers(prev => [...prev, { id: newId, name, gender }]);
    toast.success(`Guest player "${name}" added.`);
  };

 


//updated Auto Assign
  const handleAutoAssign = (category: string) => {
    const court = courts.find(c => c.assigned.length === 0);
    if (!court) {
      toast.warn('No available court found');
      return;
    }
  
    // Filter players based on selected category
    let eligiblePlayers: Player[] = [];
  
    switch (category) {
      case 'MS': // Men's Singles
      case 'MD': // Men's Doubles
        eligiblePlayers = players.filter(p => p.gender === 'Male' && !p.id.startsWith('guest'));
        break;
      case 'WS': // Women's Singles
      case 'WD': // Women's Doubles
        eligiblePlayers = players.filter(p => p.gender === 'Female' && !p.id.startsWith('guest'));
        break;
      case 'XD': // Mixed Doubles
        const males = players.filter(p => p.gender === 'Male' && !p.id.startsWith('guest'));
        const females = players.filter(p => p.gender === 'Female' && !p.id.startsWith('guest'));
  
        if (males.length < 2 || females.length < 2) {
          toast.error('Not enough male and female players for Mixed Doubles');
          return;
        }
  
        const selectedMales = males.slice(0, 2);
        const selectedFemales = females.slice(0, 2);
        const xdSelected = [...selectedMales, ...selectedFemales];
  
        setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: xdSelected } : c));
        setPlayers(prev => prev.filter(p => !xdSelected.includes(p)));
        toggleTimer(court.courtNo);
        return;
    }
  
    // For MD, WD, MS, WS
    if (eligiblePlayers.length < 4) {
      toast.error('Not enough eligible players in the pool');
      return;
    }
  
    // Pick first player and 3 random from next 7
    const first = eligiblePlayers[0];
    const rest = eligiblePlayers.slice(1, 8); // next 7
    const shuffled = [...rest].sort(() => 0.5 - Math.random());
    const selected = [first, ...shuffled.slice(0, 3)];
  
    if (selected.length < 4) {
      toast.error('Unable to select 4 players automatically');
      return;
    }
  
    setCourts(prev =>
      prev.map(c =>
        c.courtNo === court.courtNo ? { ...c, assigned: selected } : c
      )
    );
    setPlayers(prev => prev.filter(p => !selected.includes(p)));
    toggleTimer(court.courtNo);
  };
  



// 🧠 Smart assignment logic using historical match data
// Merged with match history recording and player stat updates


const handleSmartAssign = async (category: string, level: 'High' | 'Medium' | 'Low') => {
  const court = courts.find(c => c.assigned.length === 0);
  if (!court) {
    toast.warn('No available court found');
    return;
  }

  // Step 1: Filter out guest players with at least 5 matches and calculate avgScore from last 10
  let eligiblePlayers = players.filter(p => !p.id.startsWith('guest') && p.matchHistory?.length >= 5).map(p => {
    const recentMatches = p.matchHistory.slice(-10);
    const total = recentMatches.reduce((sum, match) => sum + match.points, 0);
    const avgScore = Math.round(total / recentMatches.length);
    return { ...p, avgScore };
  });

  // Step 2: Category filter
  if (['MS', 'MD'].includes(category)) {
    eligiblePlayers = eligiblePlayers.filter(p => p.gender === 'Male');
  } else if (['WS', 'WD'].includes(category)) {
    eligiblePlayers = eligiblePlayers.filter(p => p.gender === 'Female');
  }

  // Step 3: For MX category
  if (category === 'XD') {
    const males = eligiblePlayers.filter(p => p.gender === 'Male');
    const females = eligiblePlayers.filter(p => p.gender === 'Female');
    if (males.length < 2 || females.length < 2) {
      toast.error('Not enough eligible players for MX');
      return;
    }

    const getLevelGroup = (list: any[]) => {
      const high = list.filter(p => p.avgScore >= 70);
      const medium = list.filter(p => p.avgScore >= 40 && p.avgScore < 70);
      const low = list.filter(p => p.avgScore < 40);
      return { high, medium, low };
    };

    const maleGroup = getLevelGroup(males);
    const femaleGroup = getLevelGroup(females);

    const levelGroup = level.toLowerCase();
    let selectedMales = maleGroup[levelGroup];
    let selectedFemales = femaleGroup[levelGroup];

    if (selectedMales.length < 2) {
      selectedMales = [...selectedMales, ...maleGroup.medium, ...maleGroup.low].slice(0, 2);
    } else {
      selectedMales = selectedMales.slice(0, 2);
    }

    if (selectedFemales.length < 2) {
      selectedFemales = [...selectedFemales, ...femaleGroup.medium, ...femaleGroup.low].slice(0, 2);
    } else {
      selectedFemales = selectedFemales.slice(0, 2);
    }

    if (selectedMales.length < 2 || selectedFemales.length < 2) {
      toast.error('Unable to find enough qualified players for this level');
      return;
    }

    const selected = [...selectedMales, ...selectedFemales];
    await saveMatchHistory(selected, court.courtNo, category, '21/09', '08:00');
    setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
    setPlayers(prev => prev.filter(p => !selected.includes(p)));
    toggleTimer(court.courtNo);
    return;
  }

  // Step 4: Non-MX: group players by level
  const high = eligiblePlayers.filter(p => p.avgScore >= 70);
  const medium = eligiblePlayers.filter(p => p.avgScore >= 40 && p.avgScore < 70);
  const low = eligiblePlayers.filter(p => p.avgScore < 40);

  let selected =
    level === 'High' ? [...high, ...medium, ...low] :
    level === 'Medium' ? [...medium, ...high, ...low] :
    [...low, ...medium, ...high];

  selected = selected.slice(0, 4);

  if (selected.length < 4) {
    toast.error('Not enough qualified players for Smart selection');
    return;
  }

  await saveMatchHistory(selected, court.courtNo, category, '21/09', '08:00');
  setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
  setPlayers(prev => prev.filter(p => !selected.includes(p)));
  toggleTimer(court.courtNo);
};

// 🔁 Start  Stop function 



const handleStartStop = async (courtNo: number, scores: Record<number, string>, courts: { courtNo: number; assigned: Player[] }[], setPlayers: any, setCourts: any, timer: Record<number, number>, toggleTimer: (courtNo: number) => void, isSmartMatch: boolean = false) => {
  const assignedPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];
  const scoreValue = scores[courtNo];

  if (!scoreValue || scoreValue === '00/00') {
    const confirmNoSave = window.confirm('⚠️ Score not entered. Match history will not be saved. Proceed?');
    if (!confirmNoSave) return;
    setPlayers((prev: Player[]) => {
      const remaining = [...prev];
      return [...remaining, ...assignedPlayers];
    });
    setCourts((prev: any) => prev.map((c: any) => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
    toggleTimer(courtNo);
    return;
  }

  const [scoreA, scoreB] = scoreValue.split('/').map(Number);
  const [teamA, teamB] = assignedPlayers.length === 2
    ? [[assignedPlayers[0]], [assignedPlayers[1]]]
    : [assignedPlayers.slice(0, 2), assignedPlayers.slice(2)];

  const winningTeam = scoreA > scoreB ? teamA : teamB;
  const losingTeam = scoreA > scoreB ? teamB : teamA;

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
  const sorted = [...winningTeam, ...losingTeam];
  setPlayers((prev: Player[]) => {
    const remaining = [...prev];
    const updated = [...remaining, ...winningTeam, ...losingTeam];
    return updated;
  });
  setCourts((prev: any) => prev.map((c: any) => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
  toggleTimer(courtNo);

  // Show match summary toast with simple animation for winners
  const winnerNames = winningTeam.map(p => p.name).join(' & ');
  const loserNames = losingTeam.map(p => p.name).join(' & ');
  toast.success(`✅ Match saved! 🏆 ${winnerNames} beat ${loserNames} (${scoreValue})`, {
    autoClose: 5000,
    position: 'top-center',
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });

  // 🎉 Visual Celebration
if (isSmartMatch) {
  const confettiContainer = document.createElement('div');
  confettiContainer.id = 'confetti-wrapper';
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.zIndex = '9999';
  confettiContainer.style.pointerEvents = 'none';
  document.body.appendChild(confettiContainer);

  const lottie = document.createElement('div');
  lottie.innerHTML = `<lottie-player
    src="https://assets3.lottiefiles.com/packages/lf20_s3twlq2k.json"
    background="transparent"
    speed="1"
    style="width: 220px; height: 220px; position: fixed; top: 25%; left: 50%; transform: translate(-50%, -50%); z-index: 10000"
    autoplay
    onerror="this.style.display='none'; document.getElementById('fallbackTrophy').style.display='block';"
  ></lottie-player><div id="fallbackTrophy" style="display:none; text-align: center; color: #fff; font-weight: bold; font-size: 1.4rem; margin-top: 250px;">🏆 ${winnerNames}</div><div style="text-align: center; color: #fff; font-weight: bold; font-size: 1.2rem; margin-top: 250px;">🏆 ${winnerNames}</div>`;
  document.body.appendChild(lottie);

  import('canvas-confetti').then((confetti) => {
    const myConfetti = confetti.default.create(confettiContainer, {
      resize: true,
      useWorker: true
    });
    myConfetti({ particleCount: 180, spread: 120, origin: { y: 0.5 } });

    setTimeout(() => {
      document.body.removeChild(confettiContainer);
      document.body.removeChild(lottie);
    }, 4500);
  });
} else {
  import('canvas-confetti').then((confetti) => {
    confetti.default({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#bbf7d0', '#facc15', '#fda4af']
    });
  });
};



// 🧹 FIXED saveMatchHistory — now sends data to backend via fetch
 const saveMatchHistory = async (
  assignedPlayers: Player[],
  courtNo: number,
  matchType: string,
  score: string,
  duration: string
) => {
  try {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:5050/api/match-history', {
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
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <ToastContainer />

      {/* Banner */}
<div className="relative w-full h-[180px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-b-[60px] flex flex-col justify-center items-center shadow-lg">
  <h1 className="text-5xl font-extrabold text-white drop-shadow">SmashHub</h1>
  <h2 className="text-2xl text-white/90 font-medium">Smart Peg Board</h2>
</div>
{/* Floating Smart Select Button */}
<button
  onClick={() => setShowMatchPopup(true)}
  className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-full shadow-xl hover:scale-105 transition-all"
>
  + Smart Select
</button>

{/* Smart Selection Popup */}
{showMatchPopup && (
  <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-md w-full">
      {!selectedCategory ? (
        <>
          <h3 className="text-xl font-semibold mb-4 text-center">Choose Match Category</h3>
          <div className="flex justify-around mb-4">
            {["MS", "WS", "MD", "WD", "XD"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-lg shadow-lg"
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => setShowMatchPopup(false)} className="text-sm text-gray-600 hover:underline">Cancel</button>
          </div>
        </>
      ) : !selectionMode ? (
        <>
          <h3 className="text-xl font-semibold mb-4 text-center">Choose Assignment Mode</h3>
          <div className="flex justify-around mb-4">
            {['Auto', 'Smart'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectionMode(mode as 'Auto' | 'Smart')}
                className="px-4 py-2 rounded-full bg-purple-500 text-white font-medium shadow-md"
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => { setSelectedCategory(null); setShowMatchPopup(false); }} className="text-sm text-gray-600 hover:underline">Cancel</button>
          </div>
        </>
      ) : selectionMode === 'Smart' && !smartLevel ? (
        <>
          {/* Check if top 8 players (excluding guests) have at least 5 matches */}
          {players.filter(p => !p.id.startsWith('guest')).slice(0, 8).every(p => p.matchCount >= 5) ? (
            <>
              <h3 className="text-xl font-semibold mb-4 text-center">Competitive Level</h3>
              <div className="flex justify-around mb-4">
                {['High', 'Medium', 'Low'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSmartLevel(level as 'High' | 'Medium' | 'Low')}
                    className="px-4 py-2 rounded-full bg-purple-500 text-white font-medium shadow-md"
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <button onClick={() => { setSelectedCategory(null); setSelectionMode(null); setShowMatchPopup(false); }} className="text-sm text-gray-600 hover:underline">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-red-600 text-center font-medium mb-4">Players in the pool (except guest) should have played at least 5 matches to use Smart Selection.</p>
              <div className="flex justify-around">
                <button onClick={() => setSelectionMode('Auto')} className="px-4 py-2 bg-blue-500 text-white rounded-full">Choose Auto</button>
                <button onClick={() => { setSelectedCategory(null); setSelectionMode(null); setShowMatchPopup(false); }} className="text-sm text-gray-600 hover:underline">Cancel</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-center mb-3">Confirm Assignment</h3>
          <p className="text-center mb-6">Category: <strong>{selectedCategory}</strong> <br /> Mode: <strong>{selectionMode}</strong> {smartLevel && <><br /> Level: <strong>{smartLevel}</strong></>}</p>
          <div className="flex justify-around">
            <button
              className="px-6 py-2 bg-green-500 text-white rounded-full shadow hover:bg-green-600"
              onClick={() => {
                if (selectionMode === 'Auto') handleAutoAssign(selectedCategory);
                else handleSmartAssign(selectedCategory, smartLevel!);
                setShowMatchPopup(false);
                setSelectedCategory(null);
                setSmartLevel(null);
                setSelectionMode(null);
              }}
            >
              Confirm
            </button>
            <button
              className="text-sm text-gray-600 hover:underline"
              onClick={() => {
                setSelectedCategory(null);
                setSmartLevel(null);
                setSelectionMode(null);
                setShowMatchPopup(false);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}


        <div className="flex gap-6">  
  {/* Player Pool */}
  <div className="w-[280px] max-h-[calc(100vh-200px)] overflow-y-auto bg-white rounded-xl shadow-lg p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">Player Pool</h3>
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {players.map((player) => (
          <SortablePlayer key={player.id} {...player} />
        ))}
      </SortableContext>
    </DndContext>
  </div>



{/* Court Section */}
<div className="flex-1 overflow-x-auto">
  <div className="flex flex-wrap gap-6">
    {courts.map(({ courtNo, assigned }, index) => (
      <div
        key={courtNo}
        className="min-w-[320px] w-[320px] relative rounded-2xl shadow-2xl border-4 border-indigo-900 bg-gradient-to-br from-blue-600 to-fuchsia-600 overflow-hidden transform hover:scale-105 transition-all duration-300"
      >
        {/* Remove Court Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => removeCourt(index)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-full shadow-lg"
          >
            ✕
          </button>
        </div>

        {/* Court Header */}
        <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${assigned.length === 0 ? 'bg-green-700' : 'bg-red-700'} border-white/20`}>
          🏸 Court {courtNo}{' '}
          {assigned.length === 4 && (
            <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>
          )}
        </div>

        {/* Court Layout */}
        <div className="relative h-[440px]">
          <div className="absolute top-3 bottom-3 left-0 right-0 bg-gradient-to-br from-blue-500/90 to-fuchsia-500/90">

            {/* Net & Lines */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[4px] bg-white/90 -translate-x-1/2 shadow-sm"></div>
            <div className="absolute top-[0%] w-full h-[3px] bg-white/90 shadow"></div>
            <div className="absolute top-[8%] w-full h-[3px] bg-white/90 shadow"></div>
            <div className="absolute top-[40%] w-full h-[3px] bg-white/90"></div>
            <div className="absolute top-[60%] w-full h-[3px] bg-white/90"></div>
            <div className="absolute top-[92%] w-full h-[2px] bg-white/80"></div>
            <div className="absolute top-[100%] w-full h-[2px] bg-white/80"></div>
            <div className="absolute left-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]"></div>
            <div className="absolute right-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]"></div>

            {/* Player Slots Grid */}
            <div className="absolute inset-0 grid grid-rows-2">
              <div className="flex border-b-2 border-white/40">
                <div className="flex-1 h-full border-r border-white/40 flex items-center justify-center pt-4">
                  <PlayerSlot player={assigned[0] || null} />
                </div>
                <div className="flex-1 h-full flex items-center justify-center pt-4">
                  <PlayerSlot player={assigned[1] || null} />
                </div>
              </div>
              <div className="flex">
                <div className="flex-1 h-full border-r border-white/40 flex items-center justify-center pt-4">
                  <PlayerSlot player={assigned[2] || null} />
                </div>
                <div className="flex-1 h-full flex items-center justify-center pt-4">
                  <PlayerSlot player={assigned[3] || null} />
                </div>
              </div>
            </div>

            {/* Score & Timer Controls */}
            <div className="absolute bottom-10 left-3">
              <input
                type="text"
                className="rounded px-2 py-1 text-sm"
                value={scores[courtNo] || ''}
                onChange={(e) => handleScoreChange(courtNo, e.target.value)}
                placeholder="Enter Score (e.g., 21/18)"
              />
            </div>
            <div className="absolute bottom-10 right-3">
              <Button
                size="sm"
                onClick={() => handleStartStop(courtNo)}
                className="bg-white/90 text-indigo-900"
              >
                {intervals[courtNo] ? `Stop (${formatTime(timer[courtNo] || 0)})` : 'Start'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

</div>

    </div>
  );
}
};