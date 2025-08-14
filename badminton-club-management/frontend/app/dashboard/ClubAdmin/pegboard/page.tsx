'use client';

import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, DragEndEvent, useDroppable, DragOverEvent, PointerSensor, useSensor, useSensors,DragOverlay,sensors } from '@dnd-kit/core';
import { SortableContext,verticalListSortingStrategy, useSortable} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { Plus, PlusCircle, Users, Wand2, XCircle, X,  X as XIcon,Trophy, Maximize2, Minimize2 , UserCircle} from 'lucide-react';
import WinnerBoard from '@/components/SmartPegBoard/WinnerBoard'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import SmartAssignModal from '@/components/SmartPegBoard/SmartAssignModal';
import CourtCard from '@/components/SmartPegBoard/CourtCard';
import PlayerPool from '@/components/SmartPegBoard/PlayerPool';
import { handleStartStopMatch } from '@/utils/matchUtils';
import {handleSmartAssign,handleAutoAssign,fetchTopPlayersWithHistory, getAllSuggestedTeams} from '@/utils/matchAssigners';
//import DraggablePlayerCard from '@/components/DraggablePlayerCard1';
import AllClubSelector from '@/components/AllClubSelector';
import ConfettiEffect from '@/components/ConfettiEffect';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Player } from '@/types';



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

const getAvailableCourt = (courts) => courts.find(c => c.assigned.every(p => !p));
const isSmartEligible = (players) => players.filter(p => !p.id.startsWith('guest')).slice(0, 8).every(p => p.matchCount >= 5);



const FloatingActions = ({ onSmartSelect, onAddCourt, onAddGuest, onShowAllClub }) => {
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

  export default function PegBoard() {
   
    const [courts, setCourts] = useState<{ courtNo: number; assigned: (Player | null)[] }[]>([
      { courtNo: 1, assigned: [null, null, null, null] }]);
   
    const [guestGender, setGuestGender] = useState<'Male' | 'Female' | null>(null);
const [guestNameInput, setGuestNameInput] = useState('');
const [showGuestDialog, setShowGuestDialog] = useState(false);

    const [timer, setTimer] = useState<Record<number, number>>({});
    const [intervals, setIntervals] = useState<Record<number, NodeJS.Timeout>>({});
    const [scores, setScores] = useState<Record<number, string>>({});
    const [hasFetched, setHasFetched] = useState(false);
    const toastShownRef = useRef(false);
    const [showMatchPopup, setShowMatchPopup] = useState(false);
    const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
    const [refreshWinnerKey, setRefreshWinnerKey] = useState(Date.now());
    const [summary, setSummary] = useState<MatchSummary | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSmartAssignModal, setShowSmartAssignModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedMode, setSelectedMode] = useState<'Auto' | 'Smart' | null>(null);
    const [smartLevel, setSmartLevel] = useState<'High' | 'Medium' | 'Low' | null>(null);
    const [suggestedPlayers, setSuggestedPlayers] = useState([]);   
    const [winningTeam, setWinningTeam] = useState<Player[] | null>(null);
    const [winningCourt, setWinningCourt] = useState<number | null>(null);
    const [justDropped, setJustDropped] = useState<{ court: number; slot: number } | null>(null);
    const [fixedPlayerWarning, setFixedPlayerWarning] = useState<string | null>(null);
    const [clubPlayers, setAllClubPlayers] = useState<Player[]>([]);
    const [justAddedPlayerId, setJustAddedPlayerId] = useState<string | null>(null);
    const [showAllClubModal, setShowAllClubModal] = useState(false);
   
  // ✅ Load Player Pool from localStorage (if still valid today)
// Step 1: Load initial players from localStorage
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

// Step 2: Init state ONCE
const [players, setPlayers] = useState<Player[]>(() => getInitialPlayers());

// Step 3: Persist on any update
useEffect(() => {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('playerPool', JSON.stringify(players));
  localStorage.setItem('playerPoolDate', today);
}, [players]);


    const onSmartSelect = () => {
      setSelectedCategory(null);      // Reset selections
      setSelectedMode(null);
      setTeamOptions([]);
      setShowMatchPopup(true);        // Opens the modal
    };
    

    const handleSmartSelectClick = () => {
      setShowCategoryDialog(true);  // Show category dialog first
    };

    const prefillAutoPlayers = () => {
      const category = selectedCategory ?? 'MS';
    
      // Keep the fixed player as the first, but shuffle others
      const fixed = players[0];
      const rest = players.slice(1).sort(() => 0.5 - Math.random());
      const reordered = [fixed, ...rest];
    
      handleAutoAssign(
        category,
        courts,
        reordered,
        setCourts,
        setPlayers,
        toggleTimer,
        [],
        setSuggestedPlayers,
        true // previewOnly: true
      );
    
      setTimeout(() => setShowMatchPopup(true), 50);
    };
    



    const handleConfirmTeamAssign = (selectedPlayers: Player[]) => {
      const court = courts.find(c => c.assigned.every(p => !p));
      if (!court) return toast.error('No free court');
    
      setCourts(prev => {
        const updated = prev.map(c =>
          c.courtNo === court.courtNo
            ? { ...c, assigned: selectedPlayers }
            : c
        );
        console.log("✅ Updating courts with assigned players:", selectedPlayers);
        console.log('🧩 Updated courts after Start Match:', updated);
        return updated;
      });
      

      setPlayers(prev =>
        prev.filter(p => !selectedPlayers.some(sp => sp.id === p.id))
      );
     // toggleTimer(court.courtNo); // Removed auto timer start
      setShowSmartAssignModal(false);
      setTeamOptions([]);
    };
    
    type TeamOption = {
      label: string;
      icon: string;
      players: Player[];
      isSurprise?: boolean;
    };

    const fetchSuggestedTeams = async (category: string) => {
      const clubId = localStorage.getItem('clubId');
      if (!clubId || players.length < 4) return toast.warn('Not enough players');
    
      try {
        const result = await getAllSuggestedTeams(clubId, players, courts, category);
        setTeamOptions(result); // result: TeamOption[]
        setShowSmartAssignModal(true);
      } catch (err) {
        toast.error('Failed to load suggested teams');
        console.error('🔴 Team fetch error:', err);
      }
    };

    const handleReorderPool = (fromIndex: number, toIndex: number) => {
      setPlayers(prev => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });
    };
    
    const handleDropToCourt = (courtNo: number, slotIndex: number, player: Player) => {
      setCourts(prevCourts => {
        const updated = prevCourts.map(court => {
          if (court.courtNo !== courtNo) return court;
          const newAssigned = [...court.assigned];
          newAssigned[slotIndex] = player;
          return { ...court, assigned: newAssigned };
        });
        return updated;
      });
    
      setPlayers(prev => prev.filter(p => p.id !== player.id));
       // Set justDropped to trigger animation
    setJustDropped({ court: courtNo, slot: slotIndex });
    setTimeout(() => setJustDropped(null), 1000); // Clear after animation
  };
    
    
    const handleDropToPool = (player: Player, insertIndex: number = 0) => {
      setPlayers(prev => {
        const filtered = prev.filter(p => p.id !== player.id);
        filtered.splice(insertIndex, 0, player);
        return filtered;
      });
    
      setCourts(prev => prev.map(c => ({
        ...c,
        assigned: c.assigned.map(p => (p?.id === player.id ? null : p))
      })));
    };
    
    const handleDropFromCourt = (player: Player, insertIndex: number) => {
      // Remove from all courts first
      setCourts(prev =>
        prev.map(c => ({
          ...c,
          assigned: c.assigned.map(p => (p?.id === player.id ? null : p)),
        }))
      );
      // Then insert into pool
      setPlayers(prev => {
        const without = prev.filter(p => p.id !== player.id);
        const updated = [...without];
        updated.splice(insertIndex, 0, player);
        return updated;
      });
    };

    const updateCourtPlayers = (courtNo: number, updater: (players: (Player | null)[]) => (Player | null)[]) => {
      setCourts(prev => 
        prev.map(court => 
          court.courtNo === courtNo 
            ? { ...court, assigned: updater(court.assigned) } 
            : court
        )
      );
    };

    const handleSmartSelect = async () => {
      const clubId = localStorage.getItem('clubId');
      if (!clubId || players.length < 4) return toast.warn('Not enough players');
    
      if (!selectedCategory) {
        toast.warn('Please select a category first');
        return;
      }
    
      const fixedPlayer = players[0];
      const genderMismatch =
        (selectedCategory === 'WD' || selectedCategory === 'WS') && fixedPlayer.gender !== 'Female' ||
        (selectedCategory === 'MD' || selectedCategory === 'MS') && fixedPlayer.gender !== 'Male';
    
      if (genderMismatch) {
        setFixedPlayerWarning(`⚠️ "${fixedPlayer.name}" is not eligible for ${selectedCategory}. Suggestions may be unavailable.`);
      } else {
        setFixedPlayerWarning(null);
      }
    
      try {
        const teamSets = await getAllSuggestedTeams(clubId, players, courts, selectedCategory);
        setTeamOptions(teamSets);
        setShowMatchPopup(true);
      } catch (err) {
        toast.error('Failed to generate smart team suggestions');
        console.error('🔴 Smart assign error:', err);
      }
    };
    
    // Feth player into SmartPegBoard

    useEffect(() => {
      const fetchAllPlayers = async () => {
        try {
          const token = localStorage.getItem('token');
          const clubId = localStorage.getItem('clubId');
    
          const res = await fetch(`http://localhost:5050/api/players?clubId=${clubId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
    
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    
          const data = await res.json();
          setAllClubPlayers(data);   // Right side → all club members
        
        } catch (err) {
          if (!toastShownRef.current) {
            toast.error('Failed to load club players');
            toastShownRef.current = true;
          }
        }
      };
    
      fetchAllPlayers();
    }, []);   
    



// --- Entire file updated to handle replacedPlayer logic in drag drop ---

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  })
);
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  const activeData = active.data?.current;
  if (!activeData || !over) return;

  const player: Player = activeData.player;
  const from = activeData.from;
  const overId = over.id.toString();

  // === 1. Player Pool → Court ===
  if (from === 'pool' && overId.startsWith('slot-')) {
    const [, courtStr, slotStr] = overId.split('-');
    const courtNo = parseInt(courtStr);
    const slotIndex = parseInt(slotStr);
    if (isNaN(courtNo) || isNaN(slotIndex)) return;

    const courtIndex = courts.findIndex(c => c.courtNo === courtNo);
    if (courtIndex === -1) return;

    const replacedPlayer = courts[courtIndex].assigned[slotIndex];
    const newCourts = [...courts];

    newCourts[courtIndex] = {
      ...newCourts[courtIndex],
      assigned: newCourts[courtIndex].assigned.map((p, i) =>
        i === slotIndex ? player : p
      )
    };

    const playerId = player.id || player._id;
    const newPlayers = players.filter(p => (p.id || p._id) !== playerId);

    if (
      replacedPlayer &&
      !newPlayers.some(p => (p.id || p._id) === (replacedPlayer.id || replacedPlayer._id))
    ) {
      newPlayers.unshift(replacedPlayer);
    }

    setCourts(newCourts);
    setPlayers(newPlayers);
    return;
  }

  // === 2. Court → Player Pool ===
  if (from === 'court' && overId === 'player-pool') {
    const playerId = player.id || player._id;

    setCourts(prev =>
      prev.map(court => ({
        ...court,
        assigned: court.assigned.map(p =>
          (p?.id || p?._id) === playerId ? null : p
        )
      }))
    );

    setPlayers(prev => {
      if (prev.some(p => (p.id || p._id) === playerId)) return prev;
      return [...prev, player];
    });

    return;
  }

  // === 3. Court ⇄ Court Swap ===
  if (from === 'court' && overId.startsWith('slot-')) {
    const [, courtStr, toIndexStr] = overId.split('-');
    const courtNo = parseInt(courtStr);
    const toIndex = parseInt(toIndexStr);
    const fromIndex = activeData.index;
    if (isNaN(courtNo) || isNaN(fromIndex) || isNaN(toIndex)) return;

    setCourts(prev =>
      prev.map(court => {
        if (court.courtNo !== courtNo) return court;

        const updated = [...court.assigned];
        const temp = updated[toIndex];
        updated[toIndex] = updated[fromIndex];
        updated[fromIndex] = temp;

        return { ...court, assigned: updated };
      })
    );

    return;
  }
};



  const toggleTimer = (courtNo: number) => {
    setIntervals(prev => {
      if (prev[courtNo]) {
        clearInterval(prev[courtNo]);
        const { [courtNo]: _, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [courtNo]: setInterval(() => {
            setTimer(t => ({ ...t, [courtNo]: (t[courtNo] || 0) + 1 }));
          }, 1000)
        };
      }
    });
  };
  
  const handleScoreChange = (courtNo: number, value: string) => {
    console.log('📥 Typing Score for Court:', courtNo, '→', value);
    setScores(prev => ({ ...prev, [courtNo]: value }));
  };
  
  

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}; 

const addCourt = () => setCourts(prev => [...prev, { courtNo: prev.length + 1, assigned: [null, null, null, null] }]);

const removeCourt = (index: number) => {
  const courtNo = courts[index].courtNo;
  setCourts(prev => prev.filter((_, i) => i !== index));
  clearInterval(intervals[courtNo]);
  const { [courtNo]: _, ...rest } = timer;
  setTimer(rest);
};

// 📺 Fullscreen toggle
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

// 🏆 WinnerBoard auto-fetch with retry
useEffect(() => {
  const fetchSummary = async () => {
    const clubId = localStorage.getItem('clubId');
    const today = new Date().toISOString().split('T')[0];
    if (!clubId || clubId.length < 24) return;
    try {
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
      if (!data?.summary) console.warn('⚠️ No summary after retries');
    } catch (err) {
      console.error('❌ Summary fetch error:', err);
    }
  };
  fetchSummary();
}, [refreshWinnerKey]);


  //Add Guest Player

const guestCounters = useRef({ Male: 1, Female: 1 });

// New: submit handler (replaces addGuestPlayer)
const handleGuestSubmit = (sex: 'Male' | 'Female') => {
  const raw = guestNameInput.trim();
  if (!raw) {
    toast.warn('Please enter the guest first name.');
    return;
  }

  const idx = guestCounters.current[sex]++;
  const id = `guest_${sex.toLowerCase()}_${idx}`;
  const firstName = raw.replace(/\s+/g, ' '); // normalize spaces

  // Shape matches the rest of your app (CourtCard, matchUtils, etc.)
  const newGuest: any = {
    id,                   // guest_* id string
    _id: undefined,       // keep undefined to avoid ObjectId assumptions
    isGuest: true,
    playerType: 'Guest',
    firstName,            // UI uses this
    surName: '',
    gender: sex,          // your UI uses 'gender'
    sex,                  // some places read 'sex'
    name: firstName,      // fallback for any old code that uses 'name'
    profileImage: '',     // optional; keeps avatar code happy
  };

  // Add to the Player Pool (prepend so it’s visible)
  setPlayers(prev => [...prev, newGuest]);

  // Reset dialog
  setGuestNameInput('');
  setGuestGender(null);
  setShowGuestDialog(false);

  toast.success(`Guest added: ${firstName} (${sex})`);
};

  


  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    
    <div className={`min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6 relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-y-auto' : ''}`}>
      <ToastContainer />
      {/* 📌 Fullscreen Toggle UI */}

     
      <AnimatePresence>
        {isFullscreen ? (
          <motion.button
            key="exit"
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 p-3 rounded-full shadow-xl"
            title="Exit Fullscreen"
          >
            <X className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            key="enter"
            onClick={toggleFullscreen}
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
      <WinnerBoard refreshKey={refreshWinnerKey} />

<FloatingActions
  onSmartSelect={() => setShowSmartAssignModal(true)}
    onAddCourt={addCourt}
    onAddGuest={() => {
      setGuestGender(null);
      setGuestNameInput('');
      setShowGuestDialog(true);
    }}
  onShowAllClub={() => setShowAllClubModal(true)}
  />

{/* Modal for Club Player  */}
{showAllClubModal && (
  <AllClubSelector
    allPlayers={clubPlayers} // ✅ Replace with your real player array
    setPlayers={setPlayers} // ✅ this MUST be passed
    setJustAddedPlayerId={setJustAddedPlayerId}
  onClose={() => setShowAllClubModal(false)}
    playerPool={players}
    setPlayerPool={setPlayers}
    open={showAllClubModal}
    setOpen={setShowAllClubModal}
  />
)}

{/* Modal for Guest  */}

<Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
  <DialogContent className="max-w-sm bg-white shadow-lg">
    <DialogHeader>
      <DialogTitle className="text-lg font-bold text-indigo-700">Add Guest Player</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Enter guest first name"
        value={guestNameInput}
        onChange={(e) => setGuestNameInput(e.target.value)}
        className="text-sm"
      />
      <p className="text-xs text-gray-500">First name is required. Choose the gender to add the guest.</p>

      <div className="flex justify-between gap-4 mt-2">
        <Button
          type="button"
          onClick={() => handleGuestSubmit('Male')}
          disabled={guestNameInput.trim() === ''}
          className={`w-full font-semibold text-white transition-all duration-200 ${
            guestNameInput.trim() === '' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Male
        </Button>

        <Button
          type="button"
          onClick={() => handleGuestSubmit('Female')}
          disabled={guestNameInput.trim() === ''}
          className={`w-full font-semibold text-white transition-all duration-200 ${
            guestNameInput.trim() === '' ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
          }`}
        >
          Female
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>




      {/* SmartAssignModal (centralized)  */}

      <SmartAssignModal
  show={showSmartAssignModal}
  players={players}
  courts={courts}
  suggestedPlayers={suggestedPlayers}
  setSuggestedPlayers={setSuggestedPlayers}
  onClose={() => setShowSmartAssignModal(false)}
  onRedoAuto={prefillAutoPlayers}
  onConfirm={handleConfirmTeamAssign}
  warning={fixedPlayerWarning}  // ✅ add this
/>


{showCategoryDialog && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-2xl shadow-xl w-80 space-y-4">
      <h2 className="text-xl font-bold text-center">Select Match Category</h2>
      <div className="grid grid-cols-3 gap-3">
      {['MS', 'WS', 'MD', 'WD', 'XD'].map(cat => (
  <button
    key={cat}
    onClick={() => {
      setSelectedCategory(cat);
      setShowCategoryDialog(false);
      handleSmartSelect(); // ✅ Now calls with selectedCategory
    }}
    className="py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600"
  >
    {cat}
  </button>
))}

      </div>
      <button onClick={() => setShowCategoryDialog(false)} className="text-sm text-gray-500 hover:underline text-center w-full">Cancel</button>
    </div>
  </div>
)}

{/* 📐 Responsive Layout: stacked on mobile, horizontal on lg+ */}
<div className="flex flex-col gap-6 mt-6 lg:flex-row lg:items-start">
  


  {/* 🟦 1. Player Pool (Middle) */}
  <div className="w-full lg:w-[25%]">

  <PlayerPool
  players={players}
  setPlayers={setPlayers} // ✅ Ensures PlayerPool renders correctly
  justAddedPlayerId={justAddedPlayerId} // Optional, used for highlight effect
  onReorder={(from, to) => {
    setPlayers(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }}
  onDropFromCourt={(player, index) => {
    setPlayers(prev => {
      const without = prev.filter(p => p.id !== player.id);
      const updated = [...without];
      updated.splice(index, 0, player);
      return updated;
    });

    setCourts(prev =>
      prev.map(c => ({
        ...c,
        assigned: c.assigned.map(p => (p?.id === player.id ? null : p)),
      }))
    );
  }}
/>
  </div>

  {/* 🟩 2. Court Section (Rightmost) */}
  <div className="w-full lg:flex-1 overflow-x-auto">


  <div className="flex flex-wrap justify-center gap-6">
  {courts.map(({ courtNo, assigned }, index) => (
    <CourtCard
      key={courtNo}
      courtNo={courtNo}
      assigned={assigned}
      score={scores[courtNo] || ''}

      onScoreChange={(value) => handleScoreChange(courtNo, value)}

      // ⬇️ accept score from modal and pass to matchUtils as overrideScore
      onStartStop={(overrideScore?: string) => {

        console.log('⬅️ Parent onStartStop received', { courtNo, overrideScore, rawScore: scores[courtNo] });

        if (!intervals[courtNo]) {
          // START
          toggleTimer(courtNo);
          toast.info(`🕒 Match started on Court ${courtNo}`, { position: 'bottom-center' });
        } else {
          console.log('📤 Calling handleStartStopMatch with', {
            overrideScore,
            usingScore: overrideScore ?? scores[courtNo],
          });
      
          // STOP (possibly with score from modal)
          handleStartStopMatch({
            courtNo,
            courts,
            scores,
            timer,
            setPlayers,
            setCourts,
            toggleTimer,
            setRefreshWinnerKey,
            onWin: (team) => {
              setWinningTeam(team);
              setWinningCourt(courtNo);
            },
            onScoreChange: (val) => handleScoreChange(courtNo, val),
            overrideScore, // ✅ critical: use the modal score here
          });
        }
      }}

      isRunning={!!intervals[courtNo]}
      time={formatTime(timer[courtNo] || 0)}

      // (minor bug fix) you used `index` but didn’t capture it from map
      onRemoveCourt={() => removeCourt(index)}

      onDropPlayer={(slotIndex, player) => {
        setCourts(prev => prev.map(court => {
          if (court.courtNo !== courtNo) return court;
          const updated = [...court.assigned];
          updated[slotIndex] = player;
          return { ...court, assigned: updated };
        }));
      }}
    />
  ))}
</div>




  </div>
</div>

</div>

<DragOverlay dropAnimation={{ duration: 150 }}>
    {activePlayerId ? (
      <SortablePoolPlayer
        player={players.find(p => `pool-${p._id || p.id}` === activePlayerId)!}
        dragOverlay
      />
    ) : null}
  </DragOverlay>
     </DndContext>
  );
      
      }




   
 