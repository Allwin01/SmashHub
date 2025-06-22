/*

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Player {
  _id: string;
  firstName: string;
  surname: string;
  email: string;
  isJunior: boolean;
  joinDate: string;
}

export default function PlayerCardDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5050/api/players', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch players');

        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error('❌ Fetch error:', err);
      } finally {
        setLoading(false); // ✅ set loading to false once done
      }
    };

    fetchPlayers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-800">Player Roster</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <Card key={player._id} className="p-4">
              <CardContent>
                <h3 className="font-semibold text-lg">{player.firstName} {player.surname}</h3>
                <p className="text-sm text-gray-600">Joined: {new Date(player.joinDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{player.email}</p>
                <Button
                  className="mt-3"
                  onClick={() => router.push(`/dashboard/clubadmin/player-card/${player._id}`)}
                >
                  View
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

*/

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface Player {
  _id: string;
  firstName: string;
  surname: string;
  isJunior: boolean;
  joinDate: string;
  playerType: string;
  level?: string;
  sex?: string;
  profileImage?: string;
}

export default function PlayerCardDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5050/api/players', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch players');

        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error('❌ Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter(p =>
    `${p.firstName} ${p.surname}`.toLowerCase().includes(search.toLowerCase())
  );

  const coachingPlayers = filteredPlayers.filter(p => p.playerType !== 'Club Member');
  const clubMembers = filteredPlayers.filter(p => p.playerType === 'Club Member');

  const renderPlayers = (group: Player[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {group.map((player) => (
        <div
          key={player._id}
          className="flex flex-col items-center cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl hover:bg-blue-50 rounded-xl p-4"
          onClick={() => router.push(`/dashboard/clubadmin/player-card/${player._id}`)}
          
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 mb-2">
          <Image
                 src={
                 player.profileImage ||
                 (player.sex?.toLowerCase() === 'female' ? '/Avatar-female.png' : '/Avatar-male.png')
                 }
                 alt={player.firstName}
                 width={96}
                height={96}
                 className="object-cover w-full h-full"
                />
          </div>
          <p className="text-md font-medium text-center">{player.firstName} {player.surname}</p>
          {player.level && <p className="text-sm text-gray-600 text-center">Level: {player.level}</p>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">Player Roster</h1>

      <Input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Coaching Players</h2>
            {renderPlayers(coachingPlayers)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Club Members</h2>
            {renderPlayers(clubMembers)}
          </div>
        </>
      )}
    </div>
  );
}

