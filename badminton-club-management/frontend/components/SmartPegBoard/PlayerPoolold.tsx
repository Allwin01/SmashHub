'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface PlayerPoolProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
}

export default function PlayerPool({ players, setPlayers }: PlayerPoolProps) {
  const { setNodeRef } = useDroppable({ id: 'player-pool' });
  const [justAddedPlayerId, setJustAddedPlayerId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  // 🧠 Persist players until midnight reset
  useEffect(() => {
    const saved = localStorage.getItem('playerPool');
    const lastUpdated = localStorage.getItem('playerPoolDate');
    const today = new Date().toISOString().slice(0, 10);
    if (saved && lastUpdated === today) {
      try {
        setPlayers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved players');
      }
    }
  }, [setPlayers]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('playerPool', JSON.stringify(players));
    localStorage.setItem('playerPoolDate', today);
  }, [players]);

  const handleRemoveGuest = (guestId: string) => {
    const isGuest = guestId?.startsWith('guest');
    if (!isGuest) return;
    setPlayers((prev) => prev.filter((p) => p.id !== guestId));
  };

  return (
    <div className="relative w-full md:w-[260px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={() => setActiveId(null)}
      >
        <div
          ref={setNodeRef}
          className="max-h-[calc(100vh-200px)] overflow-y-auto bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-xl p-4"
        >
          <h2 className="text-white text-lg font-semibold mb-4">🎽 Player Pool</h2>

          <SortableContext
            items={players.map((p) => `pool-${p._id || p.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {players.map((player, index) => (
                <SortablePoolPlayer
                  key={`pool-${player._id || player.id}`}
                  player={player}
                  index={index}
                  justAddedId={justAddedPlayerId ?? undefined}
                  handleRemoveGuest={handleRemoveGuest}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={{ duration: 150 }}>
          {activeId ? (
            <SortablePoolPlayer
              player={players.find((p) => `pool-${p._id || p.id}` === activeId)!}
              dragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortablePoolPlayer({
  player,
  index,
  justAddedId,
  handleRemoveGuest,
  dragOverlay
}: {
  player: Player;
  index?: number;
  justAddedId?: string;
  handleRemoveGuest?: (id: string) => void;
  dragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `pool-${player._id || player.id}`, data: { from: 'pool', player, playerIndex: index } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  const isGuest = player.id?.startsWith('guest');
  const genderColor = isGuest
    ? player.gender === 'Female'
      ? 'bg-pink-500'
      : 'bg-blue-500'
    : player.gender === 'Female'
      ? 'bg-gradient-to-r from-pink-400 to-blue-500'
      : 'bg-gradient-to-r from-blue-400 to-pink-500';

  const initials = player?.name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'GU';
  const isNewlyAdded = justAddedId === player._id;

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isNewlyAdded ? [1.05, 1] : 1,
        boxShadow: isNewlyAdded ? '0 0 0px 3px rgba(72, 187, 120, 0.6)' : undefined,
      }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`relative px-3 py-2 rounded-xl border border-white/30 shadow-md text-sm font-semibold text-white flex items-center gap-3 cursor-grab transition-all duration-200 ${genderColor} ${isDragging ? 'scale-105 ring-2 ring-indigo-400' : ''}`}
    >
      {isGuest && (
        <button
          onClick={() => handleRemoveGuest?.(player.id)}
          className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full p-[2px] text-xs"
          title="Remove Guest"
        >
          ×
        </button>
      )}

      <GripVertical className="text-white w-4 h-4 opacity-80" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center font-bold text-xs overflow-hidden">
          {player.profileImageUrl ? (
            <img
              src={player.profileImageUrl}
              alt="avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">
            {player.firstName ?? player.name} {player.surName ?? ''}
          </div>
          {typeof index === 'number' && <div className="text-[10px] text-white/80">#{index + 1}</div>}
        </div>
      </div>
    </motion.div>
  );
}
