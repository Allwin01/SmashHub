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
