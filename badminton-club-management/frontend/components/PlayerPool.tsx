// components/PlayerPool.tsx
import { Player } from '@/types';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface PlayerPoolProps {
  players: Player[];
}

export default function PlayerPool({ players }: PlayerPoolProps) {
  return (
    <div className="relative w-full md:w-[260px]">
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-xl p-4">
        <h2 className="text-white text-lg font-semibold mb-4">🎽 Player Pool</h2>
        <SortableContext items={players.map(p => `pool-${p.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {players.map((player, index) => (
              <SortablePoolPlayer key={player.id} player={player} index={index} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function SortablePoolPlayer({ player, index }: { player: Player; index?: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `pool-${player.id}`, data: { fromPool: true, player, playerIndex: index } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  const genderColor = player.gender === 'Female'
    ? 'bg-gradient-to-r from-pink-300 to-pink-500'
    : 'bg-gradient-to-r from-blue-300 to-blue-500';

  const initials = player?.name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'GU';

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`px-3 py-2 rounded-xl border border-white/30 shadow-md text-sm font-semibold text-white flex items-center gap-3 cursor-grab transition-all duration-200 ${genderColor} ${isDragging ? 'scale-105 ring-2 ring-indigo-400' : ''}`}
    >
      <GripVertical className="text-white w-4 h-4 opacity-80" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center font-bold text-xs">
          {player.profileImageUrl ? (
            <img src={player.profileImageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">{player.firstName ?? player.name} {player.surName ?? ''}</div>
          {typeof index === 'number' && <div className="text-[10px] text-white/80">#{index + 1}</div>}
        </div>
      </div>
    </motion.div>
  );
}


{/*}
// components/PlayerPool.tsx
import { useState } from 'react';
import { Player } from '@/types';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface PlayerPoolProps {
  players: Player[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDropPlayer: (player: Player, index?: number) => void;
  onDropFromCourt: (player: Player, index: number) => void;
}

export default function PlayerPool({ players, onReorder, onDropPlayer, onDropFromCourt }: PlayerPoolProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const droppedData = active.data?.current;

    console.log('🎯 DragEnd (Pool):', { activeId, overId, droppedData });

    if (!droppedData || typeof droppedData !== 'object' || !droppedData.player) return;

    const isPoolDrop = overId.startsWith('pool-');
    const fromPool = droppedData.fromPool === true;

    if (fromPool && isPoolDrop) {
      const fromIndex = droppedData.playerIndex;
      const toIndex = players.findIndex(p => `pool-${p.id}` === overId);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        onReorder(fromIndex, toIndex);
      }
    } else if (!fromPool && isPoolDrop) {
      const toIndex = players.findIndex(p => `pool-${p.id}` === overId);
      if (toIndex !== -1) {
        onDropFromCourt(droppedData.player, toIndex);
      }
    }

    setActiveId(null);
  };

  return (
    <div className="relative w-full md:w-[260px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={({ active }) => setActiveId(active.id as string)}
      >
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-xl p-4">
          <h2 className="text-white text-lg font-semibold mb-4">🎽 Player Pool</h2>
          <SortableContext items={players.map(p => `pool-${p.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {players.map((player, index) => (
                <SortablePoolPlayer key={player.id} player={player} index={index} />
              ))}
            </div>
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={{ duration: 0.2 }}>
          {activeId ? (
            <SortablePoolPlayer
              player={players.find(p => `pool-${p.id}` === activeId)!}
              dragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortablePoolPlayer({ player, index, dragOverlay = false }: { player: Player; index?: number; dragOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `pool-${player.id}`, data: { fromPool: true, player, playerIndex: index } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || dragOverlay ? 1000 : undefined,
    boxShadow: dragOverlay ? '0 0 12px rgba(0,0,0,0.3)' : undefined,
  };

  const genderColor = player.gender === 'Female'
    ? 'bg-gradient-to-r from-pink-300 to-pink-500'
    : 'bg-gradient-to-r from-blue-300 to-blue-500';

  const initials = player?.name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'GU';

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`px-3 py-2 rounded-xl border border-white/30 shadow-md text-sm font-semibold text-white flex items-center gap-3 ${dragOverlay ? '' : 'cursor-grab'} transition-all duration-200 ${genderColor} ${isDragging ? 'scale-105 ring-2 ring-indigo-400' : ''}`}
    >
      <GripVertical className="text-white w-4 h-4 opacity-80" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center font-bold text-xs">
          {player.profileImageUrl ? (
            <img src={player.profileImageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">{player.firstName ?? player.name} {player.surName ?? ''}</div>
          {typeof index === 'number' && <div className="text-[10px] text-white/80">#{index + 1}</div>}
        </div>
      </div>
    </motion.div>
  );
}
*/}


{/*}

import { Player } from '@/types';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable} from '@dnd-kit/sortable';


import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';


interface PlayerPoolProps {
  players: Player[];
  onDragEnd: (event: DragEndEvent) => void;
  
}

const SortablePlayer = ({ player, index }: { player: Player; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
  
    const initials = player?.name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'GU';
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
        className="flex items-center justify-between w-full p-2 mb-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl shadow border border-gray-300 text-white font-semibold cursor-move"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center font-bold text-xs">
            {player.profileImageUrl ? (
              <img src={player.profileImageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold">{player.name}</div>
            <div className="text-xs text-white/80">#{index + 1}</div>
          </div>
        </div>
      </motion.div>
    );
  };
  

export default function PlayerPool({ players, onDragEnd }: PlayerPoolProps) {
  return (
    <div className="w-full md:w-[280px] max-h-[calc(100vh-200px)] overflow-y-auto bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Player Pool</h3>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={players.map((p) => String(p.id))} strategy={verticalListSortingStrategy}>
          {players.map((player, index) => (
            <SortablePlayer key={player.id} player={player} index={index} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}


*/}
