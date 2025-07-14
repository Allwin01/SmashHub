import { Player } from '@/types';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { handleAutoAssign } from '@/utils/matchAssigners';
import { motion } from 'framer-motion';

interface SmartAssignModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (players: Player[]) => void;
  suggestedPlayers?: Player[];
  setSuggestedPlayers?: (players: Player[]) => void;
  onRedoAuto: () => void;
  courts: any[];
  players: Player[];
}

export default function SmartAssignModal({ show, onClose, onConfirm, suggestedPlayers = [], setSuggestedPlayers, onRedoAuto, courts, players }: SmartAssignModalProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<'Auto' | 'Smart' | null>(null);
  const [readyToConfirm, setReadyToConfirm] = useState(false);

  useEffect(() => {
    if (show && suggestedPlayers?.length === 4 && category && mode === 'Auto') {
      setReadyToConfirm(true);
    }
  }, [show, suggestedPlayers, category, mode]);

  useEffect(() => {
    if (!show) {
      setCategory(null);
      setMode(null);
      setReadyToConfirm(false);
    }
  }, [show]);

  const triggerAutoAssign = () => {
    if (!courts || courts.length === 0) return;
    console.log('🚀 Triggering handleAutoAssign from SmartAssignModal');
    handleAutoAssign(
      category!,
      courts,
      players,
      () => {},
      () => {},
      () => {},
      [],
      (assigned) => {
        console.log("✅ Assigned players received in callback:", assigned);
        if (Array.isArray(assigned)) {
          setSuggestedPlayers?.(assigned);
        } else {
          console.warn('⚠️ Assigned is not an array:', assigned);
        }
      },
      true
    );
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === 'smart-modal-backdrop') {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div
      id="smart-modal-backdrop"
      className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
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
                  onClick={() => {
                    setMode(m as 'Auto' | 'Smart');
                    if (m === 'Auto') {
                      triggerAutoAssign();
                    }
                  }}
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
        ) : (
          <div className="flex flex-col items-center justify-center mt-4 w-full">
            <h3 className="text-xl font-semibold text-center mb-3">Confirm Assignment</h3>

            <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="flex-1 text-sm text-left">
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Mode:</strong> {mode}</p>
              </div>

              <div className="flex-1 text-sm">
                <p className="font-semibold mb-1">Selected Players:</p>
                <ul className="text-sm pl-4 list-disc">
                  {Array.isArray(suggestedPlayers) && suggestedPlayers.map((p, i) => (
                    <li key={p.id} className={i === 0 ? 'font-bold text-indigo-700' : ''}>
                      {p.firstName ?? p.name} {p.surName ?? ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setSuggestedPlayers?.([]);
                  triggerAutoAssign();
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600"
              >
                🔁 Re-do Auto
              </button>
              <button
                className="px-6 py-2 bg-green-500 text-white rounded-full shadow hover:bg-green-600"
                onClick={() => onConfirm(suggestedPlayers || [])}
                
              >
                🏸 Start Match
              </button>
            </div>

            <button
              className="text-sm text-gray-600 hover:underline mt-4"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



{/*}

import { Player } from '@/types';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { handleAutoAssign, getAllSuggestedTeams } from '@/utils/matchAssigners';

interface SmartAssignModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (players: Player[]) => void;
  players: Player[];
  courts: any[];
}

export default function SmartAssignModal({ show, onClose, onConfirm, players, courts }: SmartAssignModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'Auto' | 'Smart' | null>(null);
  const [teamOptions, setTeamOptions] = useState<{
    label: string;
    icon: string;
    players: Player[];
    isSurprise?: boolean;
  }[]>([]);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setSelectedCategory(null);
      setSelectedMode(null);
      setTeamOptions([]);
      setSelectedTeamIndex(null);
      setRevealed(false);
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!selectedCategory || !selectedMode) return;
      setLoading(true);

      const clubId = localStorage.getItem('clubId') ?? '';

      try {
        if (selectedMode === 'Auto') {
          await handleAutoAssign(
            selectedCategory,
            courts,
            players,
            () => {},
            () => {},
            () => {},
            [],
            (team) => {
              setTeamOptions([{ label: 'Suggested Match', icon: '🤖', players: team }]);
            },
            true // previewOnly
          );
        } else if (selectedMode === 'Smart') {
          const suggestions = await getAllSuggestedTeams(clubId, players, courts);
          setTeamOptions(suggestions);
        }
      } catch (err) {
        toast.error('Failed to fetch team suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [selectedCategory, selectedMode]);

  if (!show) return null;

  const renderCategorySelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Select Match Category</h2>
      <div className="flex justify-center gap-3 flex-wrap">
        {['MS', 'WS', 'MD', 'WD', 'XD'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-lg shadow-lg"
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="text-center">
        <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Cancel</button>
      </div>
    </div>
  );

  const renderModeSelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Choose Assignment Mode</h2>
      <div className="flex justify-center gap-6">
        {['Auto', 'Smart'].map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode as 'Auto' | 'Smart')}
            className="px-4 py-2 rounded-full bg-purple-500 text-white font-medium shadow-md"
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="text-center">
        <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Cancel</button>
      </div>
    </div>
  );

  const renderTeamOptions = () => (
    <>
      <h2 className="text-2xl font-bold text-center mb-2">Select a Suggested Match</h2>
      {loading ? (
        <p className="text-center text-gray-500">Loading suggestions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamOptions.map((option, index) => (
            <div
              key={index}
              className={`border rounded-xl p-4 cursor-pointer transition-transform hover:scale-105 shadow-sm ${
                selectedTeamIndex === index ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
              }`}
              onClick={() => {
                setSelectedTeamIndex(index);
                if (option.isSurprise) setRevealed(true);
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{option.icon}</span>
                <h3 className="font-semibold text-lg">{option.label}</h3>
              </div>
              <ul className="text-sm pl-4 list-disc">
                {(!option.isSurprise || revealed || selectedTeamIndex === index) ? (
                  option.players.map((p, i) => (
                    <li key={p.id} className={i === 0 ? 'font-bold text-indigo-700' : ''}>
                      {p.firstName} {p.surName ?? ''}
                    </li>
                  ))
                ) : (
                  <li className="italic text-gray-500">Tap to reveal players</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={onClose}
          className="text-sm text-gray-600 underline hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (selectedTeamIndex === null) {
              toast.warn('Please select a match suggestion first');
              return;
            }
            onConfirm(teamOptions[selectedTeamIndex].players);
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-full shadow hover:bg-green-700"
        >
          🏸 Start Match
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full space-y-6">
        {!selectedCategory
          ? renderCategorySelection()
          : !selectedMode
          ? renderModeSelection()
          : renderTeamOptions()}
      </div>
    </div>
  );
}


{/*}

import { Player } from '@/types';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { handleAutoAssign } from '@/utils/matchAssigners';

interface SmartAssignModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (category: string, mode: 'Auto' | 'Smart', level?: 'High' | 'Medium' | 'Low' | null) => void;
  suggestedPlayers: Player[];
  setSuggestedPlayers: (players: Player[]) => void;
  onRedoAuto: () => void;
  courts: any[];
  players: Player[];
}

export default function SmartAssignModal({ show, onClose, onConfirm, suggestedPlayers, setSuggestedPlayers, onRedoAuto, courts, players }: SmartAssignModalProps) {
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === 'smart-modal-backdrop') {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div
      id="smart-modal-backdrop"
      className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
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
                  onClick={() => {
                    setMode(m as 'Auto' | 'Smart');
                    if (m === 'Auto') {
                      if (!courts || courts.length === 0) return;
                      handleAutoAssign(
                        category,
                        courts,
                        players,
                        () => {},
                        () => {},
                        () => {},
                        [],
                        setSuggestedPlayers,
                        true // previewOnly
                      );
                    }
                  }}
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
        ) : (
          <div className="flex flex-col items-center justify-center mt-4 w-full">
            <h3 className="text-xl font-semibold text-center mb-3">Confirm Assignment</h3>

            <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="flex-1 text-sm text-left">
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Mode:</strong> {mode}</p>
                {level && <p><strong>Level:</strong> {level}</p>}
              </div>

              <div className="flex-1 text-sm">
                <p className="font-semibold mb-1">Selected Players:</p>
                <ul className="space-y-1">
                  {suggestedPlayers.map((p, i) => (
                    <li key={p.id}>
                      <span className={i === 0 ? 'text-blue-600 font-bold' : ''}>{p.firstName} {p.surName}</span>
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
                🏸 Start Match
              </button>
            </div>

            <button
              className="text-sm text-gray-600 hover:underline mt-4"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

*/}

