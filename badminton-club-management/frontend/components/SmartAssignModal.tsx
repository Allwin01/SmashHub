import { Player } from '@/types';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

interface SmartAssignModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (category: string, mode: 'Auto' | 'Smart', level?: 'High' | 'Medium' | 'Low' | null) => void;
  suggestedPlayers: Player[];
  onRedoAuto: () => void;
}

export default function SmartAssignModal({ show, onClose, onConfirm, suggestedPlayers, onRedoAuto }: SmartAssignModalProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<'Auto' | 'Smart' | null>(null);
  const [level, setLevel] = useState<'High' | 'Medium' | 'Low' | null>(null);
  const [readyToConfirm, setReadyToConfirm] = useState(false);

  useEffect(() => {
    if (show && suggestedPlayers.length === 4 && category && mode === 'Auto') {
      setReadyToConfirm(true);
    }
  }, [show, suggestedPlayers, category, mode]);

  useEffect(() => {
    if (!show) {
      setCategory(null);
      setMode(null);
      setLevel(null);
      setReadyToConfirm(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-md w-full">
        {!category ? (
          <>
            <h3 className="text-xl font-semibold mb-4 text-center">Choose Match Category</h3>
            <div className="flex justify-around mb-4">
              {["MS", "WS", "MD", "WD", "XD"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-lg shadow-lg"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Cancel</button>
            </div>
          </>
        ) : !mode ? (
          <>
            <h3 className="text-xl font-semibold mb-4 text-center">Choose Assignment Mode</h3>
            <div className="flex justify-around mb-4">
              {["Auto", "Smart"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as 'Auto' | 'Smart')}
                  className="px-4 py-2 rounded-full bg-purple-500 text-white font-medium shadow-md"
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Cancel</button>
            </div>
          </>
        ) : mode === 'Smart' && !level ? (
          <>
            <h3 className="text-xl font-semibold mb-4 text-center">Competitive Level</h3>
            <div className="flex justify-around mb-4">
              {["High", "Medium", "Low"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l as 'High' | 'Medium' | 'Low')}
                  className="px-4 py-2 rounded-full bg-purple-500 text-white font-medium shadow-md"
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Cancel</button>
            </div>
          </>
        ) : readyToConfirm ? (
            <div className="flex flex-col items-center justify-center mt-4 w-full">
  <h3 className="text-xl font-semibold text-center mb-3">Confirm Assignment</h3>

  <div className="flex flex-col md:flex-row gap-6 w-full">
    {/* LEFT: Match Info */}
    <div className="flex-1 text-sm text-left">
      <p><strong>Category:</strong> {category}</p>
      <p><strong>Mode:</strong> {mode}</p>
      {level && <p><strong>Level:</strong> {level}</p>}
    </div>

    {/* RIGHT: Player Preview */}
    <div className="flex-1 text-sm">
      <p className="font-semibold mb-1">Selected Players:</p>
      <ul className="space-y-1">
        {suggestedPlayers.map((p, i) => (
          <li key={p.id}>
            <span className={i === 0 ? 'text-blue-600 font-bold' : ''}>
              {p.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </div>

  <div className="flex gap-4 mt-6">
    <button
      onClick={onRedoAuto}
      className="px-6 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600"
    >
      🔁 Re-do Auto
    </button>
    <button
      className="px-6 py-2 bg-green-500 text-white rounded-full shadow hover:bg-green-600"
      onClick={() => onConfirm(category, mode, level)}
    >
      ✅ Start Match
    </button>
  </div>

  <button
    className="text-sm text-gray-600 hover:underline mt-4"
    onClick={onClose}
  >
    Cancel
  </button>
</div>

          
        ) : (
          <p className="text-center text-gray-500 text-sm">⏳ Preparing selected players...</p>
        )}
      </div>
    </div>
  );
}
