

'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Player {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
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

  // Fetch player attendance from backend
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        const clubName = localStorage.getItem('clubName');
        const res = await fetch(`http://localhost:5050/api/player/attendance?date=${today}&clubName=${clubName}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setPlayers(data);
        setHasFetched(true);
      } catch (err) {
        if (!hasFetched) toast.error('❌ Failed to fetch players');
      }
    };
    fetchPlayers();
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


  {/*
  const handleStartStop = (courtNo: number) => {
    if (intervals[courtNo]) {
      // Handle stop logic
      const assignedPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];
      if (!scores[courtNo] || scores[courtNo] === '00/00') {
        const confirmNoSave = window.confirm('⚠️ Score not entered. Match history will not be saved. Proceed?');
        if (!confirmNoSave) return;
      } else {
        const [scoreA, scoreB] = scores[courtNo].split('/').map(Number);
        const [teamA, teamB] = [assignedPlayers.slice(0, 2), assignedPlayers.slice(2)];
        const allPlayers = scoreA >= scoreB ? [...teamA, ...teamB] : [...teamB, ...teamA];
        setMatchHistory(prev => [...prev, {
          court: courtNo,
          players: assignedPlayers,
          score: scores[courtNo],
          time: formatTime(timer[courtNo] || 0),
          timestamp: new Date().toLocaleString()
        }]);
        setPlayers(prev => [...allPlayers, ...prev]);
      }
      setCourts(prev => prev.map(c => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
    }
    toggleTimer(courtNo);
  };

*/}


const handleStartStop = async (courtNo: number) => {
  if (intervals[courtNo]) {
    const assignedPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];
    const scoreValue = scores[courtNo];

    if (scoreValue && scoreValue !== '00/00') {
      const [scoreA, scoreB] = scoreValue.split('/').map(Number);
      const [teamA, teamB] = [assignedPlayers.slice(0, 2), assignedPlayers.slice(2)];
      const winningTeam = scoreA > scoreB ? teamA : teamB;
      const losingTeam = scoreA > scoreB ? teamB : teamA;
      const result = scoreA > scoreB ? 'Win' : 'Loss';


      let matchType = 'MD'; // Default
        if (assignedPlayers.length === 2) {
          const [p1, p2] = assignedPlayers;
          if (p1.gender === 'Male' && p2.gender === 'Male') matchType = 'MS';
          else if (p1.gender === 'Female' && p2.gender === 'Female') matchType = 'WS';
          else matchType = 'MX';
        } else if (assignedPlayers.length === 4) {
          const maleCount = assignedPlayers.filter(p => p.gender === 'Male').length;
          const femaleCount = assignedPlayers.filter(p => p.gender === 'Female').length;
          if (maleCount === 4) matchType = 'MD';
          else if (femaleCount === 4) matchType = 'WD';
          else matchType = 'MX';
        }



      const now = new Date();
      const duration = formatTime(timer[courtNo] || 0);

      // Save individual player stats to backend
      const token = localStorage.getItem('token');
      for (const player of [...teamA, ...teamB]) {
        if (!player.id.startsWith('guest')) {
          const body = {
            playerId: player.id,
            matchId: `${courtNo}-${now.toISOString()}`,
            matchDate: now.toISOString().split('T')[0],
            matchTime: now.toTimeString().split(' ')[0],
            result: winningTeam.includes(player) ? 'Win' : 'Loss',
            matchType,
            partner: assignedPlayers.find(p => p.id !== player.id && p.gender === player.gender)?.name || '',
            partnerSex: assignedPlayers.find(p => p.id !== player.id && p.gender === player.gender)?.gender || '',
            opponents: assignedPlayers.filter(p => p.gender !== player.gender).map(op => ({ name: op.name, gender: op.gender })),
            points: winningTeam.includes(player) ? scoreA : scoreB,
            duration,
            courtNo
          };
          await fetch('http://localhost:5050/api/player/match-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
          });
        }
      }

      const sorted = [...winningTeam, ...losingTeam];
      setPlayers(prev => [...sorted, ...prev]);
    } else {
      const confirmNoSave = window.confirm('⚠️ Score not entered. Match history will not be saved. Proceed?');
      if (!confirmNoSave) return;
      const allPlayers = courts.find(c => c.courtNo === courtNo)?.assigned || [];
      setPlayers(prev => [...allPlayers, ...prev]);
    }

    setCourts(prev => prev.map(c => c.courtNo === courtNo ? { ...c, assigned: [] } : c));
  }
  toggleTimer(courtNo);
};


  //Add Guest Player
  const addGuestPlayer = (name: string, gender: 'Male' | 'Female') => {
    const newId = 'guest_' + Date.now();
    setPlayers(prev => [...prev, { id: newId, name, gender }]);
    toast.success(`Guest player "${name}" added.`);
  };

  const assignNextPlayers = () => {
    const court = courts.find(c => c.assigned.length === 0);
    if (!court) return;
    const selected = players.slice(0, 4);
    setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
    setPlayers(prev => prev.filter(p => !selected.includes(p)));
  };

  const assignAutoPlayers = () => {
    const court = courts.find(c => c.assigned.length === 0);
    if (!court) return;
    const mandatory = players.find(p => p.id === 'p1');
    if (!mandatory) return;
    const rest = players.filter(p => p.id !== 'p1');
    const shuffled = rest.sort(() => 0.5 - Math.random());
    const selected = [mandatory, ...shuffled.slice(0, 3)];
    setCourts(prev => prev.map(c => c.courtNo === court.courtNo ? { ...c, assigned: selected } : c));
    setPlayers(prev => prev.filter(p => !selected.includes(p)));
    toggleTimer(court.courtNo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <ToastContainer />
      <div className="mb-6 flex justify-between items-start">
        <div className="relative p-6 rounded-xl shadow-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">SmashHub</h1>
          <h2 className="text-2xl font-semibold text-white/90">Smart Peg Board</h2>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 mt-6">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded-md border border-white shadow bg-white/80">
              <option>Mens Doubles</option>
              <option>Womens Doubles</option>
              <option>Mixed Doubles</option>
              <option>Mens Singles</option>
              <option>Womens Singles</option>
            </select>
            <Button onClick={assignAutoPlayers} className="bg-blue-400 hover:bg-blue-500 text-white shadow">Auto Select</Button>
            <Button className="bg-purple-400 hover:bg-purple-500 text-white shadow">Smart Select</Button>
            <Button onClick={assignNextPlayers} className="bg-pink-400 hover:bg-pink-500 text-white shadow">Next Players</Button>
            <Button onClick={() => addGuestPlayer(prompt('Guest name?') || '', 'Male')}>+ Add Guest Male</Button>
          <Button onClick={() => addGuestPlayer(prompt('Guest name?') || '', 'Female')}>+ Add Guest Female</Button>
          <Button onClick={addCourt} className="bg-green-500 hover:bg-green-600 text-white shadow h-12">+ Add Court</Button>
          </div>
        </div>
       
      </div>
{/*layer Pool */}
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Player Pool</h3>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {players.map((player) => (
                <SortablePlayer key={player.id} {...player} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
{/*Court */}
        <div className="col-span-3 flex flex-wrap gap-8 p-4">
          {courts.map(({ courtNo, assigned }, index) => (
            <div key={courtNo} className="relative rounded-2xl shadow-2xl border-4 border-indigo-900 bg-gradient-to-br from-blue-600 to-fuchsia-600 w-[320px] overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="absolute top-3 right-3 z-10">
                <button onClick={() => removeCourt(index)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-full shadow-lg">✕</button>
              </div>
              <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${assigned.length === 0 ? 'bg-green-700' : 'bg-red-700'} border-white/20`}>
                🏸 Court {courtNo} {assigned.length === 4 && <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>}
              </div>
              <div className="relative h-[440px]">
                <div className="absolute top-3 bottom-3 left-0 right-0 bg-gradient-to-br from-blue-500/90 to-fuchsia-500/90">
                  <div className="absolute top-0 bottom-0 left-1/2 w-[4px] bg-white/90 -translate-x-1/2 shadow-sm"></div>
                  
                  <div className="absolute top-[0%] w-full h-[3px] bg-white/90 shadow"></div>
                  <div className="absolute top-[8%] w-full h-[3px] bg-white/90 shadow"></div>
                 
                 
                 
                  <div className="absolute top-[40%] w-full h-[3px] bg-white/90"></div>
                  <div className="absolute top-[60%] w-full h-[3px] bg-white/90"></div>
                  <div className="absolute top-[92%] w-full h-[2px] bg-white/80"></div>
                  <div className="absolute top-[100%] w-full h-[2px] bg-white/80"></div>
                  <div className="absolute left-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]"></div>
                  <div className="absolute right-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]"></div>
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
                    <Button size="sm" onClick={() => handleStartStop(courtNo)} className="bg-white/90 text-indigo-900">
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
  );
}