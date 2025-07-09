// app/dashboard/parent/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import SkillProgressVisual from '@/components/SkillProgressVisual';

interface PlayerProfile {
  _id: string;
  firstName: string;
  surName: string;
  profileImage?: string;
  level?: string;
  coachName?: string;
}

const ParentDashboard = () => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinkedPlayers = async () => {
      const token = localStorage.getItem('token');
      const parentId = localStorage.getItem('userId'); // assume userId is stored at login
      if (!token || !parentId) return;

      try {
        const res = await fetch(`/api/players/linked-to-parent/${parentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPlayers(data);
          if (data.length === 1) {
            setSelectedPlayer(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch linked players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedPlayers();
  }, []);

  if (loading) return <div className="p-6">Loading your dashboard...</div>;

  if (selectedPlayer) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-blue-700 mb-4">Skill Report for {selectedPlayer.firstName}</h1>
        <SkillProgressVisual player={selectedPlayer} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">Welcome, Parent</h1>
      <p className="mb-4 text-gray-600">You have multiple children linked to your account. Select one to view their skill report:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {players.map(player => (
          <div key={player._id} className="border rounded-lg p-4 flex flex-col items-center shadow">
            <Image
              src={player.profileImage || '/Avatar-female.png'}
              alt={player.firstName}
              width={80}
              height={80}
              className="rounded-full border mb-2"
            />
            <div className="text-center">
              <h3 className="font-bold text-lg">{player.firstName} {player.surName}</h3>
              <p className="text-sm text-gray-500">Coach: {player.coachName || 'N/A'}</p>
            </div>
            <button
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              onClick={() => setSelectedPlayer(player)}
            >
              📊 View Skill Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentDashboard;
