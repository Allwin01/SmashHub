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

import SmartAssignModal from '@/components/SmartAssignModal';
import CourtCard from '@/components/CourtCard';
import PlayerPool from '@/components/PlayerPool';
import { handleStartStopMatch } from '@/utils/matchUtils';
import {
  handleSmartAssign,
  handleAutoAssign,
  fetchTopPlayersWithHistory, getAllSuggestedTeams
} from '@/utils/matchAssigners';




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



const FloatingActions = ({ onSmartSelect, onAddCourt, onAddGuest }) => {
  const buttons = [
    { icon: <Wand2 className="w-5 h-5 text-white" />, label: 'Smart Select', onClick: onSmartSelect, color: 'from-green-400 to-green-600' },
    { icon: <PlusCircle className="w-5 h-5 text-white" />, label: 'Add Court', onClick: onAddCourt, color: 'from-blue-400 to-blue-600' },
    { icon: <Users className="w-5 h-5 text-white" />, label: 'Add Guest', onClick: onAddGuest, color: 'from-pink-400 to-pink-600' }
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
    const [players, setPlayers] = useState<Player[]>([]);
    const [courts, setCourts] = useState<{ courtNo: number; assigned: (Player | null)[] }[]>([
      { courtNo: 1, assigned: [null, null, null, null] }]);
    const [guestGender, setGuestGender] = useState<'Male' | 'Female' | null>(null);
    const [timer, setTimer] = useState<Record<number, number>>({});
    const [intervals, setIntervals] = useState<Record<number, NodeJS.Timeout>>({});
    const [scores, setScores] = useState<Record<number, string>>({});
    const [hasFetched, setHasFetched] = useState(false);
    const toastShownRef = useRef(false);
    const [showMatchPopup, setShowMatchPopup] = useState(false);
    const [showGuestDialog, setShowGuestDialog] = useState(false);
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

    type TeamOption = {
      label: string;
      icon: string;
      players: Player[];
      isSurprise?: boolean;
    };
    
    const onSmartSelect = () => {
      setSelectedCategory(null);      // Reset selections
      setSelectedMode(null);
      setTeamOptions([]);
      setShowMatchPopup(true);        // Opens the modal
    };
    

    const handleSmartSelectClick = () => {
      setShowCategoryDialog(true);  // Show category dialog first
    };
    
const handleSmartSelect = async () => {
  const clubId = localStorage.getItem('clubId');
  if (!clubId || players.length < 4) return toast.warn('Not enough players');

  const teamSets = await getAllSuggestedTeams(clubId, players, courts); // <- import this logic
  if (teamSets.length === 0) {
    toast.error('No valid team combinations found');
    return;
  }
  setShowCategoryDialog(true);
  setTeamOptions(teamSets);
  setShowMatchPopup(true);
};

    
    
{/*}
    const prefillAutoPlayers = () => {
      const court = getAvailableCourt(courts);
      if (!court) return toast.error('No court available');
      const selected = handleAutoAssign(selectedCategory ?? 'MS', courts, players);
      if (selected?.length === 4) {
        setSuggestedPlayers(selected);
        setShowMatchPopup(true);
      } else {
        toast.warn('Not enough players');
      }
    }; */}

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        const clubId = localStorage.getItem('clubId');
        const res = await fetch(`http://localhost:5050/api/players/attendances?date=${today}&clubId=${clubId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        if (!toastShownRef.current) {
          toast.error('Failed to fetch players');
          toastShownRef.current = true;
        }
      }
    };
    fetchPlayers();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const draggedPlayer = players.find(p => p.id === active.id);
    const [courtIdStr, slotStr] = over.id.split('-');
    const courtNo = parseInt(courtIdStr, 10);
    const slotIndex = parseInt(slotStr, 10);
    const courtIndex = courts.findIndex(c => c.courtNo === courtNo);
    if (courtIndex !== -1 && slotIndex >= 0 && slotIndex < 4 && draggedPlayer) {
      const updatedCourts = [...courts];
      updatedCourts[courtIndex].assigned[slotIndex] = draggedPlayer;
      setCourts(updatedCourts);
      setPlayers(prev => prev.filter(p => p.id !== draggedPlayer.id));
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
  

  const handleConfirmTeamAssign = (selectedPlayers: Player[]) => {
    const court = courts.find(c => c.assigned.every(p => !p));
    if (!court) return toast.error('No free court');
  
    setCourts(prev =>
      prev.map(c =>
        c.courtNo === court.courtNo
          ? { ...c, assigned: selectedPlayers }
          : c
      )
    );
    setPlayers(prev =>
      prev.filter(p => !selectedPlayers.some(sp => sp.id === p.id))
    );
    toggleTimer(court.courtNo);
    setShowMatchPopup(false);
    setTeamOptions([]);
  };
  

  const handleConfirmAssignment = (category, mode, level) => {
    const clubId = localStorage.getItem('clubId');
    const court = getAvailableCourt(courts);
    if (!court) return toast.error('No court available');
  
    if (mode === 'Smart') {
      if (!level) return toast.warn('Please select level');
      handleSmartAssign(clubId, category, level, courts, setCourts, setPlayers, toggleTimer);
    } else {
      handleAutoAssign(
        category,
        courts,
        players,
        setCourts,
        setPlayers,
        toggleTimer,
        suggestedPlayers, // 👈 Use previewed selection
        undefined,
        false // 👈 Now do actual court assignment
      );
    }
  
    setShowMatchPopup(false);
    setSelectedCategory(null);
    setSmartLevel(null);
    setSelectedMode(null);

  };


  const handleTeamConfirm = (players: Player[]) => {
    const court = courts.find(c => c.assigned.every(p => !p));
    if (!court) {
      toast.error("No court available");
      return;
    }
  
    setCourts(prev => prev.map(c =>
      c.courtNo === court.courtNo ? { ...c, assigned: players } : c
    ));
    setPlayers(prev => prev.filter(p => !players.find(x => x.id === p.id)));
    toggleTimer(court.courtNo);
    setShowMatchPopup(false);
  };

  
  {/*}
// ⏱️ Timer controls
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


const handleScoreChange = (courtNo: number, value: string) => {
  setScores(prev => ({ ...prev, [courtNo]: value }));
};






*/}

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

  const prefillAutoPlayers = () => {
    const category = selectedCategory ?? 'MS';
    handleAutoAssign(
      category,
      courts,
      players,
      setCourts,
      setPlayers,
      toggleTimer,
      [],
      setSuggestedPlayers,
      true // 👈 previewOnly: true
    );
    // Slight delay to ensure UI updates after state
    setTimeout(() => setShowMatchPopup(true), 50);
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
  

  return (
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
  
      {/* Floating Action Buttons 
    
        <FloatingActions
        onSmartSelect={prefillAutoPlayers}
      
        onAddCourt={addCourt}
        onAddGuest={() => {
          setGuestGender(null);
          setGuestNameInput('');
          setShowGuestDialog(true);
        }}
      />  

<FloatingActions
  onSmartSelect={handleSmartSelectClick}
  onAddCourt={addCourt}
  onAddGuest={() => {
    setGuestGender(null);
    setGuestNameInput('');
    setShowGuestDialog(true);
  }}
/>

<FloatingActions
  onSmartSelect={onSmartSelect}
  onAddCourt={addCourt}
  onAddGuest={() => {
    setGuestGender(null);
    setGuestNameInput('');
    setShowGuestDialog(true);
  }}
/>

*/}




<FloatingActions
  onSmartSelect={() => setShowSmartAssignModal(true)}



  
      {/* SmartAssignModal (centralized) 
      <SmartAssignModal
        show={showMatchPopup}
        onClose={() => {
          setShowMatchPopup(false);
          setSelectedCategory(null);
          setSmartLevel(null);
          setSelectionMode(null);
        }}
        onConfirm={handleConfirmAssignment}
        suggestedPlayers={suggestedPlayers}
        onRedoAuto={prefillAutoPlayers}
      />

     <SmartAssignModal
  show={showMatchPopup}
  onClose={() => setShowMatchPopup(false)}
  onConfirm={handleTeamConfirm}
  teamOptions={teamOptions}
/>


       */}

       <SmartAssignModal
       show={showSmartAssignModal}
       players={players}
       courts={courts}
       onClose={() => setShowSmartAssignModal(false)}
       onConfirm={(selectedPlayers) => {
         const court = courts.find(c => c.assigned.every(p => !p));
         if (!court) return toast.warn('No court available');
         setCourts(prev =>
           prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selectedPlayers } : c)
         );
         setPlayers(prev =>
           prev.filter(p => !selectedPlayers.find(sel => sel.id === p.id))
         );
         toggleTimer(court.courtNo);
         setShowSmartAssignModal(false);
       }}
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
              fetchSuggestedTeams(cat);
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


  {/* Layout */}
  <div className="flex flex-col lg:flex-row gap-6 mt-6">
      <PlayerPool players={players} onDragEnd={handleDragEnd} />

      <div className="flex-1 overflow-x-auto">
        <div className="flex flex-wrap justify-center gap-6">
          {courts.map(({ courtNo, assigned }, index) => (
            <CourtCard
              key={courtNo}
              courtNo={courtNo}
              assigned={assigned}
              score={scores[courtNo] || ''}
              onScoreChange={(value) => handleScoreChange(courtNo, value)}
              onStartStop={() =>
                handleStartStopMatch({
                  courtNo,
                  courts,
                  scores,
                  timer,
                  setPlayers,
                  setCourts,
                  toggleTimer,
                  setRefreshWinnerKey,
                })
              }
              isRunning={!!intervals[courtNo]}
              time={formatTime(timer[courtNo] || 0)}
              onRemoveCourt={() => removeCourt(index)}
            />
          ))}
        </div>
      </div>
    </div>



    </div>
  );
 }  