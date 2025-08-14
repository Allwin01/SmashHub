'use client';

import { Player } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface AllClubSelectorProps {
  allPlayers: Player[];
  playerPool: Player[];
  setPlayerPool: React.Dispatch<React.SetStateAction<Player[]>>;
  open: boolean;
  setOpen: (val: boolean) => void;
  clubPlayers: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setJustAddedPlayerId: (id: string) => void;
  onClose: () => void;
}

const attendedSet = new Set<string>();

export default function AllClubSelector({
  allPlayers,
  playerPool,
  setPlayerPool,
  open,
  setOpen,
  clubPlayers,
  setPlayers,
  setJustAddedPlayerId,
  onClose
}: AllClubSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddToPool = async (player: Player) => {
    const alreadyInPool = playerPool.some(p => (p._id || p.id) === (player._id || player.id));
    if (alreadyInPool) return;

    setPlayers(prev => [...prev, player]);
    setJustAddedPlayerId(player._id || player.id);

    if (!attendedSet.has(player._id || player.id)) {
      await markAttendance(player);
      attendedSet.add(player._id || player.id);
    }
  };

  const handleRemoveFromPool = (playerId: string) => {
    setPlayerPool(prev => prev.filter(p => (p._id || p.id) !== playerId));
  };

  const isInPool = (playerId: string) => {
    return playerPool.some(p => (p._id || p.id) === playerId);
  };

  const filteredPlayers = (allPlayers ?? []).filter(player =>
    `${player.firstName} ${player.surName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markAttendance = async (player: Player) => {
    const today = new Date().toISOString().slice(0, 10);
    const weekday = format(new Date(today), 'EEEE');

    const record = {
      playerId: player._id || player.id,
      date: today,
      day: weekday,
      status: 'Present',
    };

    try {
      const res = await fetch('http://localhost:5050/api/players/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          attendance: [record],
          clubId: localStorage.getItem('clubId'),
        }),
      });

      if (!res.ok) throw new Error('Failed to save attendance');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const clubId = localStorage.getItem('clubId');
    const token = localStorage.getItem('token');

    if (!clubId || !token) return;

    fetch(`http://localhost:5050/api/players/attendance?date=${today}&clubId=${clubId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        data.forEach((record: any) => {
          if (record.status === 'Present') attendedSet.add(record.playerId);
        });
      })
      .catch(console.error);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Club Players</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Search player..."
            className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="px-4 py-2 h-[60vh]">
          <div className="space-y-2">
            {filteredPlayers.map((player) => {
              const inPool = isInPool(player._id);
              const gradient = player.gender === 'Female'
                ? 'bg-gradient-to-r from-pink-400 to-blue-500'
                : 'bg-gradient-to-r from-blue-400 to-pink-500';

              const hasBeenMarkedPresent = attendedSet.has(player._id || player.id);

              return (
                <div
                  key={player._id}
                  className={`flex justify-between items-center p-2 rounded-lg mb-2 ${gradient}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {player.profileImage ? (
                        <img
                          src={player.profileImage}
                          alt={`${player.firstName} ${player.surName}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-800">
                          {(player.firstName?.[0] || '') + (player.surName?.[0] || '')}
                        </span>
                      )}
                    </div>

                    <div className="text-white font-semibold text-base flex items-center gap-1">
                      {player.firstName} {player.surName}
                      {hasBeenMarkedPresent && (
                        <CheckCircle size={20} className="text-green-400 drop-shadow-sm" title="Present" />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      inPool ? handleRemoveFromPool(player._id) : handleAddToPool(player)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md transition ${
                      inPool ? 'bg-white text-red-500' : 'bg-white text-green-600'
                    }`}
                  >
                    {inPool ? 'Remove' : 'Add'}
                  </button>
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No players found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
