



'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState<'junior' | 'adult'>('junior');
  const router = useRouter();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch (`${baseUrl}/api/players`, {
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

  const juniors = filteredPlayers.filter(p => p.isJunior);
  const adults = filteredPlayers.filter(p => !p.isJunior);

  const renderPlayers = (group: Player[]) => (
    group.length > 0 ? (
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
    ) : (
      <p className="text-gray-500 text-center mt-8">No players found in this category.</p>
    )
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
        <Tabs defaultValue="junior" className="w-full" onValueChange={(val) => setActiveTab(val as 'junior' | 'adult')}>
          <TabsList className="mb-6 flex justify-start space-x-4 bg-gray-100 p-2 rounded-xl">
            <TabsTrigger value="junior" className="px-4 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Junior Club Members
            </TabsTrigger>
            <TabsTrigger value="adult" className="px-4 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Adult Club Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="junior">
            {renderPlayers(juniors)}
          </TabsContent>
          <TabsContent value="adult">
            {renderPlayers(adults)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
