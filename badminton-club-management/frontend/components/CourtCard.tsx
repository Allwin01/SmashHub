import { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';



const PlayerSlot = ({ player }: { player: Player | null }) => {
    if (!player) return <div className="bg-white/20 w-full h-full rounded-xl" />;
    const className = `bg-gradient-to-br ${player.gender === 'Male' ? 'from-blue-400 to-cyan-400' : 'from-pink-400 to-purple-400'} px-4 py-2 rounded-xl shadow-lg text-sm font-bold text-white`;
    return <motion.div className={className}>{player.name}</motion.div>;
  };

interface CourtCardProps {
  courtNo: number;
  assigned: (Player | null)[];
  score: string;
  time: string;
  isRunning: boolean;
  onScoreChange: (value: string) => void;
  onStartStop: () => void;
  onRemoveCourt: () => void;
}

export default function CourtCard({
  courtNo,
  assigned,
  score,
  time,
  isRunning,
  onScoreChange,
  onStartStop,
  onRemoveCourt
}: CourtCardProps) {
  return (
    <div className="min-w-[320px] w-[320px] relative rounded-2xl shadow-2xl border-4 border-indigo-900 bg-gradient-to-br from-blue-600 to-fuchsia-600 overflow-hidden hover:scale-105 transition-all duration-300">
      {/* Remove Court */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={onRemoveCourt}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-full shadow-lg"
        >
          ✕
        </button>
      </div>

      {/* Header */}
      <div className={`text-white font-bold text-xl text-center py-3 border-b-2 ${assigned.filter(Boolean).length === 0 ? 'bg-green-700' : 'bg-red-700'} border-white/20`}>
        🏸 Court {courtNo}{' '}
        {assigned.filter(Boolean).length === 4 && (
          <span className="ml-2 text-yellow-200 animate-pulse">(In Play)</span>
        )}
      </div>

      {/* Layout */}
      <div className="relative h-[440px]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-fuchsia-500/90">
          {/* Net & Lines */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[4px] bg-white/90 -translate-x-1/2 shadow-sm" />
          <div className="absolute top-[0%] w-full h-[3px] bg-white/90" />
          <div className="absolute top-[8%] w-full h-[3px] bg-white/90" />
          <div className="absolute top-[40%] w-full h-[3px] bg-white/90" />
          <div className="absolute top-[60%] w-full h-[3px] bg-white/90" />
          <div className="absolute top-[92%] w-full h-[2px] bg-white/80" />
          <div className="absolute top-[100%] w-full h-[2px] bg-white/80" />
          <div className="absolute left-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]" />
          <div className="absolute right-[10%] top-0 bottom-0 w-[6px] bg-yellow-400/90 shadow-[0_0_6px_1px_rgba(250,250,0,0.7)]" />

          {/* Players */}
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

          {/* Score & Timer */}
          <div className="absolute bottom-10 left-3">
            <input
              type="text"
              className="rounded px-2 py-1 text-sm"
              value={score}
              onChange={(e) => onScoreChange(e.target.value)}
              placeholder="Enter Score (e.g., 21/18)"
            />
          </div>
          <div className="absolute bottom-10 right-3">
            <Button
              size="sm"
              onClick={onStartStop}
              className="bg-white/90 text-indigo-900"
            >
              {isRunning ? `Stop (${time})` : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
