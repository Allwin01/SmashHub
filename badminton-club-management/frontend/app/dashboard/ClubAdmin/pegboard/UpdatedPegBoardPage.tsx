'use client';

import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, DragEndEvent, useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { Plus, PlusCircle, Users, Wand2, XCircle, X,  X as XIcon,Trophy, Maximize2, Minimize2 } from 'lucide-react';
import WinnerBoard from '@/components/WinnerBoard'; // adjust path
import {
  handleSmartAssign,
  handleAutoAssign
} from '@/utils/matchAssigners';
import SmartAssignModal from '@/components/SmartAssignModal';



interface Player {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  profileImageUrl?: string;
  matchCount?: number;
  matchHistory?: { points: number }[];
  avgScore?: number;
  wins?: number;
 
}
// Player Pool
const SortablePlayer = ({ player, index }: { player: Player; index: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: player.id });

  const initials = player?.name
    ? player.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
    : 'GU';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto'
  };

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`flex items-center justify-between w-full p-2 mb-2 bg-gradient-to-r ${
        player?.gender === 'Male' ? 'from-blue-400 to-purple-400' : 'from-pink-400 to-cyan-400'
      } rounded-xl shadow border border-gray-300 text-white font-semibold cursor-move hover:scale-105 hover:ring-2 hover:ring-white transition duration-200`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center font-bold text-xs overflow-hidden">
          {player?.profileImageUrl ? (
            <img src={player.profileImageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <div className="text-sm font-bold">{player?.name ?? 'Unknown'}</div>
          <div className="text-xs text-white/80">#{index + 1}</div>
        </div>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: player?.wins ?? 0 }).map((_, i) => (
          <svg key={i} className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.5 2a1.5 1.5 0 00-1.5 1.5V6a4 4 0 004 4h2a4 4 0 004-4V3.5A1.5 1.5 0 0013.5 2h-7z" />
            <path d="M3 15a4 4 0 014-4h6a4 4 0 014 4v1H3v-1z" />
          </svg>
        ))}
      </div>
    </motion.div>
  );
};


function DroppableSlot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      id={id}
      className={`min-h-[60px] rounded flex items-center justify-center border transition-all duration-300 ${isOver ? 'bg-green-200 border-green-500 scale-105' : 'bg-gray-100'}`}
    >
      {children}
    </div>
  );
}

// Floating Action icon

const FloatingActions = ({ onSmartSelect, onAddCourt, onAddGuest }: any) => {
  const buttons = [
    {
      icon: <Wand2 className="w-5 h-5 text-white" />,
      label: 'Smart Select',
      onClick: onSmartSelect,
      color: 'from-green-400 to-green-600'
    },
    {
      icon: <PlusCircle className="w-5 h-5 text-white" />,
      label: 'Add Court',
      onClick: onAddCourt,
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: <Users className="w-5 h-5 text-white" />,
      label: 'Add Guest',
      onClick: onAddGuest,
      color: 'from-pink-400 to-pink-600'
    }
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


function PlayerSlot({ player }: { player: Player | null }) {
  if (!player) return <div className="bg-white/20 w-full h-full rounded-xl" />;
  const color = player.id.startsWith('guest')
    ? player.gender === 'Male'
      ? 'bg-blue-500'
      : 'bg-pink-500'
    : player.gender === 'Male'
      ? 'from-blue-400 to-cyan-400'
      : 'from-pink-400 to-purple-400';
  const className = player.id.startsWith('guest')
    ? `px-4 py-2 rounded-xl shadow-lg text-sm font-bold text-white border-2 border-white/30 backdrop-blur-sm ${color}`
    : `bg-gradient-to-br ${color} px-4 py-2 rounded-xl shadow-lg text-sm font-bold text-white border-2 border-white/30 backdrop-blur-sm`;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {player.name}
    </motion.div>
  );
}
const ConfettiEffect = dynamic(() => import('@/components/ConfettiEffect'), { ssr: false });

// ✅ Smart Select Fetch from DB
const fetchTopPlayersWithHistory = async (clubId: string, limit = 15): Promise<Player[]> => {
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






// UI Wiring inside modal flow

const openAssignModal = () => {
  setShowMatchPopup(true);
};

const handleConfirmAssignment = async (category: string, mode: 'Auto' | 'Smart', level: string | null) => {
  const clubId = localStorage.getItem('clubId');
  const courtAvailable = courts.find(c => c.assigned.filter(Boolean).length === 0);

  if (!courtAvailable) {
    toast.error('❌ No free court available. Please clear a court first.');
    return;
  }

  if (mode === 'Smart') {
    if (!level) return toast.warn('Please select a skill level');
    handleSmartAssign(clubId!, category, level, courts, setCourts, setPlayers, toggleTimer);
  } else {
    handleAutoAssign(category, courts, players, setCourts, setPlayers, toggleTimer, suggestedPlayers);
  }

  // Cleanup modal state
  setShowMatchPopup(false);
  setSelectedCategory(null);
  setSmartLevel(null);
  setSelectionMode(null);
};

const prefillAutoPlayers = () => {
  const clubId = localStorage.getItem('clubId');
  const courtAvailable = courts.find(c => c.assigned.filter(Boolean).length === 0);

  if (!courtAvailable) {
    toast.error('❌ No free court available.');
    return;
  }

  const selected = handleAutoAssign(selectedCategory ?? 'MS', courts, players);
  if (selected?.length === 4) {
    setSuggestedPlayers(selected);
    setShowMatchPopup(true);
  } else {
    toast.warn('Not enough players for Auto Assign');
  }
};



export default function PegBoard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<{ courtNo: number; assigned: (Player | null)[] }[]>([
    { courtNo: 1, assigned: [null, null, null, null] }
  ]);
  
  const [guestGender, setGuestGender] = useState<'Male' | 'Female' | null>(null);
  const [timer, setTimer] = useState<Record<number, number>>({});
  const [intervals, setIntervals] = useState<Record<number, NodeJS.Timeout>>({});
  const [scores, setScores] = useState<Record<number, string>>({});
  const [hasFetched, setHasFetched] = useState(false);
  const toastShownRef = useRef(false);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'Auto' | 'Smart' | null>(null);
  const [smartLevel, setSmartLevel] = useState<'High' | 'Medium' | 'Low' | null>(null);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [refreshWinnerKey, setRefreshWinnerKey] = useState(Date.now());
  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);



  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        const clubId = localStorage.getItem('clubId');
        if (!token || !clubId) throw new Error('Missing token or clubId');

        const res = await fetch(`http://localhost:5050/api/players/attendances?date=${today}&clubId=${clubId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

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



  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const draggedPlayer = players.find(p => p.id === active.id);
    if (!draggedPlayer) return;
  
    const [courtIdStr, slotStr] = over.id.split('-');
    const courtNo = parseInt(courtIdStr, 10);
    const slotIndex = parseInt(slotStr, 10);
    const courtIndex = courts.findIndex(c => c.courtNo === courtNo);
  

  
    if (courtIndex !== -1 && slotIndex >= 0 && slotIndex < 4) {
      const updatedCourts = [...courts];
      updatedCourts[courtIndex].assigned[slotIndex] = draggedPlayer;
      setCourts(updatedCourts);
      setPlayers(prev => prev.filter(p => p.id !== draggedPlayer.id));
    }
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

  const addCourt = () => setCourts(prev => [...prev, { courtNo: prev.length + 1, assigned: [] }]);

  const removeCourt = (index: number) => {
    const courtNo = courts[index].courtNo;
    setCourts(prev => prev.filter((_, i) => i !== index));
    clearInterval(intervals[courtNo]);
    const { [courtNo]: _, ...rest } = timer;
    setTimer(rest);
  };

  //Add Guest Player
  const guestCounters = useRef({ Male: 1, Female: 1 });
 
  const [guestNameInput, setGuestNameInput] = useState('');
  
  const addGuestPlayer = () => {
    if (!guestGender) return;
    const index = guestCounters.current[guestGender]++;
    const guestId = `guest_${guestGender.toLowerCase()}_${index}`;
    const name = guestNameInput.trim();
    const guestName = name
      ? `Guest - ${name}`
      : `Guest ${guestGender} ${index}`;
    setPlayers(prev => [...prev, { id: guestId, name: guestName, gender: guestGender }]);
    setShowGuestDialog(false);
    setGuestNameInput('');
    setGuestGender(null);
    toast.success(`${guestName} added to the pool.`);
  };
  
  
{/*}

//updated Auto Assign
  const handleAutoAssign = (category: string) => {
    const court = courts.find(c => c.assigned.filter(Boolean).length === 0);

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
        
        const teamA = [selectedMales[0], selectedFemales[0]];
        const teamB = [selectedMales[1], selectedFemales[1]];
        const xdSelected = [...teamA, ...teamB];
        
  
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
  
*/}





// 🔁 Start  Stop function 




const saveMatchHistory = async (
  assignedPlayers: Player[],
  courtNo: number,
  matchType: string,
  score: string,
  duration: string
) => {
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
};

// Handle Start and Stop functions

const handleStartStop = async (courtNo: number) => {
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

  // 🏆 Update local state with win counts
  setPlayers(prev =>
    prev.map(p => {
      const winner = winningTeam.find(w => w.id === p.id);
      return winner ? { ...p, wins: (p.wins || 0) + 1 } : p;
    })
  );

  // 🧠 Determine match type
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

  // 📝 Save match history
  await saveMatchHistory(assignedPlayers, courtNo, matchType, scoreValue, duration);

  // ✅ POST to matchSummary once (not in loop)
  const clubId = localStorage.getItem('clubId');
  const today = new Date().toISOString().split('T')[0];
  const winnerPayload = winningTeam
    .filter(p => !p.id.startsWith('guest'))
    .map(p => ({ playerId: p.id, gender: p.gender }));

  if (winnerPayload.length > 0) {
    await fetch('http://localhost:5050/api/matchSummary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        clubId,
        date: today,
        matchType,
        winners: winnerPayload
      })
    });
  }

  // 🔁 Re-fetch winner board
  setRefreshWinnerKey(Date.now());

  // 🧼 Cleanup court
  setPlayers(prev => [...prev, ...winningTeam, ...losingTeam]);
  setCourts(prev => prev.map(c => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
  toggleTimer(courtNo);

  toast.success(`✅ Match saved! 🏆 ${winningTeam.map(p => p.name).join(' & ')} won`, {
    autoClose: 5000,
    position: 'top-center'
  });
};




// 📌 Added fullscreen change listener to sync fullscreen state
useEffect(() => {
  const handleChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener('fullscreenchange', handleChange);
  return () => document.removeEventListener('fullscreenchange', handleChange);
}, []);

// 📌 Added actual fullscreen API toggle handler
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`❌ Fullscreen request failed: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};


// ✅ Enhanced: WinnerBoard auto-fetch with retry + delay
useEffect(() => {
  const fetchSummary = async () => {
    const clubId = localStorage.getItem('clubId');
    const today = new Date().toISOString().split('T')[0];

    if (!clubId || clubId.length < 24) return;

    try {
      console.log('🧪 Fetching match summary with:', { clubId, today });
      await new Promise(res => setTimeout(res, 500));
      let retries = 3;
      let data = null;

      while (retries--) {
        const res = await fetch(`http://localhost:5050/api/matchSummary?clubId=${clubId}&date=${today}`);
        if (res.ok) {
          data = await res.json();
          break;
        }
        await new Promise(res => setTimeout(res, 300));
      }

      if (data?.summary) {
        setSummary(data.summary);
      } else {
        console.warn('⚠️ Summary not available after retries');
      }
    } catch (err) {
      console.error('❌ Error fetching match summary:', err);
    }
  };

  fetchSummary();
}, [refreshWinnerKey]);


return (
  <div className={`min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6 relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-y-auto' : ''}`}>
      <ToastContainer />

     {/* 📌 Fullscreen Toggle UI */}
     <AnimatePresence>
        {isFullscreen ? (
          <motion.button
            key="exit"
            onClick={toggleFullscreen}
            initial={{ opacity: 0, y: -50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed top-4 right-4 z-50 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 p-3 rounded-full shadow-xl"
            title="Exit Fullscreen"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          </motion.button>
        ) : (
          <motion.button
            key="enter"
            onClick={toggleFullscreen}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow hover:scale-105"
            title="Enter Fullscreen"
          >
            <Maximize2 className="w-5 h-5 text-indigo-600" />
          </motion.button>
        )}
      </AnimatePresence>


    {/* Banner */}
<div className="relative w-full h-[180px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-b-[60px] flex flex-col justify-center items-center shadow-lg">
<h1 className="text-5xl font-extrabold text-white drop-shadow">SmashHub</h1>
<h2 className="text-2xl text-white/90 font-medium">Smart Peg Board</h2>
</div>

{/* 🏆 Winner Board Display */}
  {/* Page Content */}
 
  <WinnerBoard refreshKey={refreshWinnerKey} />

  <SmartAssignModal
  show={showMatchPopup}
  onClose={() => setShowMatchPopup(false)}
  onConfirm={(category, mode, level) => {
    const clubId = localStorage.getItem('clubId')!;
    const courtAvailable = courts.find(c => c.assigned.filter(Boolean).length === 0);

    if (!courtAvailable) {
      toast.error('❌ No free court available. Please clear a court first.');
      return;
    }

    if (mode === 'Smart') {
      if (!level) return toast.warn('Level not selected');
      handleSmartAssign(clubId, category, level, courts, setCourts, setPlayers, toggleTimer);
    } else {
      handleAutoAssign(category, courts, players, setCourts, setPlayers, toggleTimer);
    }

    // full reset after confirm
    setShowMatchPopup(false);
    setSelectedCategory(null);
    setSmartLevel(null);
    setSelectionMode(null);
  }}
/>






<FloatingActions
  onSmartSelect={() => setShowMatchPopup(true)}
  onAddCourt={addCourt}
  onAddGuest={() => {
    setGuestGender(null);
    setGuestNameInput('');
    setShowGuestDialog(true);
  }}
/>


     {/*} {showMatchPopup && <ConfettiEffect winnerNames="Example Winners" />}  */}

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
      
  <div className="flex flex-col items-center justify-center mt-8">
      <h3 className="text-xl font-semibold text-center mb-3">Confirm Assignment</h3>
      <p className="text-center mb-6">
        Category: <strong>{selectedCategory}</strong><br />
        Mode: <strong>{selectionMode}</strong>
        {smartLevel && <><br />Level: <strong>{smartLevel}</strong></>}
      </p>

      <div className="flex gap-6">
        <button
          onClick={prefillAutoPlayers}
          className="px-6 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600"
        >
          🔁 Re-do Auto
        </button>

        <button
          className="px-6 py-2 bg-green-500 text-white rounded-full shadow hover:bg-green-600"
          onClick={() => {
            const clubId = localStorage.getItem('clubId');
            if (!selectionMode || !selectedCategory || !clubId) {
              toast.warn('Missing selection data');
              return;
            }
            handleConfirmAssignment(selectedCategory, selectionMode, smartLevel);
          }}
        >
          ✅ Confirm
        </button>
      </div>

      <SmartAssignModal
        show={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        onConfirm={handleConfirmAssignment}
        suggestedPlayers={suggestedPlayers}
        onRedoAuto={prefillAutoPlayers}
      />
    </div>

      <SmartAssignModal
        show={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        onConfirm={handleconfirmAssignment}
        suggestedPlayers={suggestedPlayers}
        onRedoAuto={prefillAutoPlayers}
      />
    </div>

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


  {/* Guest Dialog */}
  {showGuestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            {!guestGender ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-center">Select Guest Type</h2>
                <div className="flex justify-around mb-6">
                  <button
                    onClick={() => setGuestGender('Male')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600"
                  >
                    👨 Men Guest
                  </button>
                  <button
                    onClick={() => setGuestGender('Female')}
                    className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600"
                  >
                    👩 Women Guest
                  </button>
                </div>
                <div className="text-center">
                  <button
                    className="text-sm text-gray-600 hover:underline"
                    onClick={() => setShowGuestDialog(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-center">Add {guestGender} Guest</h2>
                <label className="block mb-2 font-medium">First Name (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                  placeholder={`Enter ${guestGender} name`}
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <button
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={() => {
                      setShowGuestDialog(false);
                      setGuestGender(null);
                      setGuestNameInput('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 rounded text-white hover:opacity-90 ${guestGender === 'Male' ? 'bg-blue-600' : 'bg-pink-600'}`}
                    onClick={addGuestPlayer}
                  >
                    Add Guest
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}



   {/* Pegboard Section */}
   <div className="flex flex-row gap-6 items-start justify-center">
  {/* Player Pool and Court sections here */}  

{/* Player Pool */}
<div className="w-[280px] max-h-[calc(100vh-200px)] overflow-y-auto bg-white rounded-xl shadow-lg p-4">
  <h3 className="text-lg font-semibold text-gray-700 mb-4">Player Pool</h3>
  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={players.map((p) => String(p.id))} strategy={verticalListSortingStrategy}>
    {players.map((player, index) => (
  <SortablePlayer key={player.id} player={player} index={index} />
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
      <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${
  assigned.filter(Boolean).length === 0 ? 'bg-green-700' : 'bg-red-700'
} border-white/20`}>
  🏸 Court {courtNo}{' '}
  {assigned.filter(Boolean).length === 4 && (
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
};