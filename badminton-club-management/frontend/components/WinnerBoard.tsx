

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface Player {
  _id: string;
  firstName: string;
  surName: string;
  gender: 'Male' | 'Female';
  wins: number;
  photoUrl?: string;
}

interface MatchSummary {
  topPlayer: Player | null;
  topMale: Player | null;
  topFemale: Player | null;
}

  interface WinnerBoardProps {
  refreshKey: number; // 👈 receive refresh trigger
}


const WinnerBoard: React.FC<WinnerBoardProps> = ({ refreshKey }: { refreshKey: number }) => {
  const [summary, setSummary] = useState<any>(null);


  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const clubId = localStorage.getItem('clubId');
        const today = new Date().toISOString().split('T')[0];
  
        if (!clubId) return;
  
        console.log('📡 Refetching summary with refreshKey:', refreshKey);
        console.log('🧪 Fetching match summary with:', { clubId, today });
  
        const res = await fetch(`http://localhost:5050/api/matchSummary?clubId=${clubId}&date=${today}`);
        const data = await res.json();
        setSummary(data.summary);
      } catch (err) {
        console.error('Error fetching match summary:', err);
      }
    };
  
    fetchSummary();
  }, [refreshKey]); // ✅ Correct closure of useEffect
  


  const renderPlayer = (label: string, player: Player | null) => {
    if (!player) {
      return (
        <div className="flex flex-col items-center w-[180px] p-4 bg-white/80 rounded-2xl shadow-xl">
          <div className="w-[90px] h-[90px] rounded-full bg-gray-300 flex items-center justify-center text-white text-2xl font-bold mb-2">
            ?
          </div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-md font-bold text-indigo-900">N/A</p>
          <p className="text-xs text-gray-500">Wins: 0</p>
        </div>
      );
    }

    const fullName = `${player.firstName} ${player.surName}`;
    const color = player.gender === 'Male' ? 'blue' : 'pink';

    return (
      <div className="flex flex-col items-center w-[180px] p-4 bg-white/80 rounded-2xl shadow-xl transition hover:scale-105">
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={fullName}
            width={90}
            height={90}
            className="rounded-full mb-2 object-cover"
          />
        ) : (
          <div
            className={`w-[90px] h-[90px] rounded-full bg-${color}-500 flex items-center justify-center text-white text-2xl font-bold mb-2`}
          >
            {player.firstName.charAt(0)}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-md font-bold text-indigo-900">{fullName}</p>
          <p className="text-xs text-gray-500">Wins: {player.wins}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-center gap-6 mt-6">
      {renderPlayer('Lead Male', summary?.topMale)}
      {renderPlayer('🏆 Top Winner', summary?.topPlayer)}
      {renderPlayer('Lead Female', summary?.topFemale)}
    </div>
  );
};

export default WinnerBoard;



{/*

// WinnerBoard.tsx
import React, { useEffect, useState } from 'react';

interface WinnerBoardProps {
  refreshKey: number; // 👈 receive refresh trigger
}

const WinnerBoard: React.FC<WinnerBoardProps> = ({ refreshKey }) => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const clubId = localStorage.getItem('clubId');
      const today = new Date().toISOString().split('T')[0];

      if (!clubId) return;

      console.log('📡 Refetching summary with refreshKey:', refreshKey);

      try {
        const res = await fetch(`http://localhost:5050/api/matchSummary?clubId=${clubId}&date=${today}`);
        if (!res.ok) throw new Error('Failed to fetch match summary');
        const data = await res.json();
        setSummary(data.summary);
      } catch (err) {
        console.error('⚠️ Error loading summary:', err);
      }
    };

    fetchSummary();
  }, [refreshKey]); // 👈 triggers on change

  if (!summary) return <p>Loading summary...</p>;

  // render topPlayer, topMale, topFemale
  return (
    <div className="winner-board shadow p-4 rounded-xl bg-white/90 border-2 border-indigo-400">
      <h2 className="text-lg font-bold text-indigo-800 mb-2">🏆 Today's Top Performers</h2>
      <div className="flex gap-4 justify-around">
        <div>
          <p className="font-semibold text-sm text-gray-600">Top Player</p>
          <p className="text-indigo-700 font-bold">{summary.topPlayer?.firstName ?? 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-600">Lead Male</p>
          <p className="text-blue-700 font-bold">{summary.topMale?.firstName ?? 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-600">Lead Female</p>
          <p className="text-pink-600 font-bold">{summary.topFemale?.firstName ?? 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default WinnerBoard;

*/}
