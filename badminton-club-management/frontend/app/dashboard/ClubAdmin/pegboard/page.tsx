'use client';

import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, DragEndEvent, useDroppable, DragOverEvent } from '@dnd-kit/core';
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

import ConfettiEffect from '@/components/ConfettiEffect';

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
    const [winningTeam, setWinningTeam] = useState<Player[] | null>(null);
    const [winningCourt, setWinningCourt] = useState<number | null>(null);
    const [justDropped, setJustDropped] = useState<{ court: number; slot: number } | null>(null);
    const [fixedPlayerWarning, setFixedPlayerWarning] = useState<string | null>(null);

    
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

// 🧩 Updated Drag Logic in PegBoard
const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  if (!over) return;

  const fromPool = active?.data?.current?.from === 'pool';
  const fromCourt = active?.data?.current?.from === 'court';
  const draggedPlayer = active?.data?.current?.player;
  if (!draggedPlayer) return;

  const overId = over.id as string;
  if (overId.startsWith('slot-')) {
    const [, courtStr, slotStr] = overId.split('-');
    const courtNo = parseInt(courtStr);
    const slotIndex = parseInt(slotStr);
    if (isNaN(courtNo) || isNaN(slotIndex)) return;

    setCourts(prev =>
      prev.map(c =>
        c.courtNo === courtNo
          ? {
              ...c,
              assigned: c.assigned.map((p, i) =>
                i === slotIndex ? draggedPlayer : p
              )
            }
          : c
      )
    );

    if (fromPool) {
      setPlayers(prev => prev.filter(p => p.id !== draggedPlayer.id));
    }

    // Reinsert dragged player back to pool if they are moved out of a court slot
    if (fromCourt) {
      const fromSlotIndex = active.data.current.index;
      const fromCourtNo = courts.find(c =>
        c.assigned[fromSlotIndex]?.id === draggedPlayer.id
      )?.courtNo;

      // If moved to different court/slot
      if (fromCourtNo !== courtNo || fromSlotIndex !== slotIndex) {
        setPlayers(prev => [{ ...draggedPlayer }, ...prev]);
        setCourts(prev =>
          prev.map(c =>
            c.courtNo === fromCourtNo
              ? {
                  ...c,
                  assigned: c.assigned.map((p, i) =>
                    i === fromSlotIndex ? null : p
                  )
                }
              : c
          )
        );
      }
    }
  }
};



// --- Entire file updated to handle replacedPlayer logic in drag drop ---

// In the drag end logic
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) {
    console.warn('⛔ Drag ended but no valid drop target.');
    return;
  }

  const activeData = active.data?.current;
  const overId = over.id.toString();
  if (!activeData || !activeData.player) return;

  const player: Player = activeData.player;
  const fromPool = activeData.fromPool === true;

  console.log('🎯 DragEnd Event:');
  console.log('  From Pool:', fromPool);
  console.log('  Active ID:', active.id);
  console.log('  Over ID:', overId);
  console.log('  Player:', player);

  // 🔹 Pool ➝ Court Slot
  if (fromPool && overId.startsWith('slot-')) {
    const [, courtStr, slotStr] = overId.split('-');
    const courtNo = parseInt(courtStr);
    const slotIndex = parseInt(slotStr);
    if (isNaN(courtNo) || isNaN(slotIndex)) return;

    let replacedPlayer: Player | null = null;

    setCourts(prev =>
      prev.map(court => {
        if (court.courtNo !== courtNo) return court;
        replacedPlayer = court.assigned[slotIndex] ?? null;
        const newAssigned = [...court.assigned];
        newAssigned[slotIndex] = player;
        return { ...court, assigned: newAssigned };
      })
    );

    setPlayers(prev => {
      const updated = prev.filter(p => p.id !== player.id);
      if (replacedPlayer) updated.unshift(replacedPlayer);
      return updated;
    });

    return;
  }

  // 🔁 Court ➝ Court Slot (Reorder)
  if (!fromPool && overId.startsWith('slot-')) {
    const [, courtStr, toIndexStr] = overId.split('-');
    const courtNo = parseInt(courtStr);
    const toIndex = parseInt(toIndexStr);
    const fromIndex = activeData.index;
    if (isNaN(courtNo) || isNaN(fromIndex) || isNaN(toIndex)) return;

    setCourts(prev =>
      prev.map(court => {
        if (court.courtNo !== courtNo) return court;
        const newAssigned = [...court.assigned];
        const temp = newAssigned[toIndex];
        newAssigned[toIndex] = newAssigned[fromIndex];
        newAssigned[fromIndex] = temp;
        return { ...court, assigned: newAssigned };
      })
    );

    return;
  }

  // 🔄 Court ➝ Pool
  if (!fromPool && overId.startsWith('pool-')) {
    setPlayers(prev => [player, ...prev]);

    setCourts(prev =>
      prev.map(court => {
        const newAssigned = court.assigned.map(p => (p?.id === player.id ? null : p));
        return { ...court, assigned: newAssigned };
      })
    );

    return;
  }

  // 🔃 Pool ➝ Pool (Reorder)
  if (fromPool && overId.startsWith('pool-')) {
    const fromIndex = activeData.playerIndex;
    const toIndex = players.findIndex(p => `pool-${p.id}` === overId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const updated = [...players];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      setPlayers(updated);
    }

    return;
  }

  console.warn('🤔 Unhandled drop:', { activeData, overId });
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



  return (
    <DndContext
    collisionDetection={closestCenter}
    onDragEnd={handleDragEnd}
  >
    
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
    }
  }/>
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


  {/* Layout */}
  <div className="flex flex-col lg:flex-row gap-6 mt-6">
  <PlayerPool
  players={players}
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


      <div className="flex-1 overflow-x-auto">
        <div className="flex flex-wrap justify-center gap-6">
        {courts.map(({ courtNo, assigned }, index) => (
  <div key={courtNo} className="relative" id={`court-${courtNo}`}>
    <CourtCard
      courtNo={courtNo}
      assigned={assigned}
      score={scores[courtNo] || ''}
      onScoreChange={(value) => handleScoreChange(courtNo, value)}
      onStartStop={() => {
        if (!intervals[courtNo]) {
          toggleTimer(courtNo);
          toast.info(`🕒 Match started on Court ${courtNo}`, { position: 'bottom-center' });
        } else {
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
              setWinningCourt(courtNo); // Track the winning court here
            },
            onScoreChange: (val) => handleScoreChange(courtNo, val) // ✅ Pass reset logic
          });
        }
      }}
      isRunning={!!intervals[courtNo]}
      time={formatTime(timer[courtNo] || 0)}
      onRemoveCourt={() => removeCourt(index)}
      onDropPlayer={(slotIndex, player) => handleDropToCourt(courtNo, slotIndex, player)}
    />

    {winningTeam && winningCourt === courtNo && (
      <ConfettiEffect
        winnerNames={winningTeam.map(p => p.name).join(' & ')}
        containerId={`court-${courtNo}`}
        onComplete={() => {
          setWinningTeam(null);
          setWinningCourt(null);
        }}
      />
    )}
  </div>
))}


        </div>
      </div>
    </div>


   
    </div>
     </DndContext>
  );
      
      }