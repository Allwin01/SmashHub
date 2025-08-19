'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
    let isMounted = true;
    const fetchPlayers = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';
        const res = await fetch(`${baseUrl}/api/players`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to fetch players');
        const data: Player[] = await res.json();
        if (isMounted) setPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌ Fetch error:', err);
        if (isMounted) setPlayers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlayers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players;
    return players.filter((p) => `${p.firstName} ${p.surname}`.toLowerCase().includes(term));
  }, [players, search]);

  const juniors = useMemo(() => filteredPlayers.filter((p) => p.isJunior), [filteredPlayers]);
  const adults = useMemo(() => filteredPlayers.filter((p) => !p.isJunior), [filteredPlayers]);

  // Ensure the default tab is visible even if the other group is empty
  useEffect(() => {
    if (activeTab === 'junior' && juniors.length === 0 && adults.length > 0) {
      setActiveTab('adult');
    }
    if (activeTab === 'adult' && adults.length === 0 && juniors.length > 0) {
      setActiveTab('junior');
    }
  }, [activeTab, juniors.length, adults.length]);

  const renderPlayers = (group: Player[]) =>
    group.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {group.map((player) => (
          <button
            key={player._id}
            type="button"
            onClick={() => router.push(`/dashboard/clubadmin/player-card/${player._id}`)}
            className="group text-left rounded-2xl p-4 bg-white/70 backdrop-blur border border-slate-200 shadow-sm hover:shadow-xl focus:shadow-xl transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/70 hover:-translate-y-0.5"
            aria-label={`Open player card for ${player.firstName} ${player.surname}`}
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-indigo-200 group-hover:ring-indigo-300 transition">
                <Image
                  src={
                    player.profileImage ||
                    (player.sex?.toLowerCase() === 'female' ? '/Avatar-female.png' : '/Avatar-male.png')
                  }
                  alt={`${player.firstName} ${player.surname}`}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    // Fallback to gender avatar if custom image fails
                    (e.currentTarget as HTMLImageElement).src =
                      player.sex?.toLowerCase() === 'female' ? '/Avatar-female.png' : '/Avatar-male.png';
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-semibold text-slate-900 leading-tight truncate">
                  {player.firstName} {player.surname}
                </p>
                {player.level && (
                  <p className="text-base md:text-lg text-slate-600 mt-1">Level: {player.level}</p>
                )}
                <p className="text-sm md:text-base text-slate-500 mt-1 truncate">
                  {player.isJunior ? 'Junior Member' : 'Adult Member'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    ) : (
      <p className="text-slate-500 text-center mt-10 text-lg">No players found in this category.</p>
    );

  return (
    <section className="p-4 sm:p-6 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-indigo-900">
          Player Roster
        </h1>
        <p className="mt-2 text-slate-600 text-base md:text-lg">
          Browse and open a player card. Use the tabs to switch between Juniors and Adults.
        </p>
      </header>

      <div className="mb-6 md:mb-8 max-w-xl">
        <Label htmlFor="player-search" className="sr-only">
          Search by name
        </Label>
        <Input
          id="player-search"
          type="text"
          inputMode="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 text-base md:text-lg px-4 rounded-xl border-slate-300 focus-visible:ring-4 focus-visible:ring-indigo-300/70"
          aria-label="Search players by name"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'junior' | 'adult')} className="w-full">
          <TabsList
            className="sticky top-0 z-10 mb-6 md:mb-8 flex w-full justify-start gap-3 rounded-2xl bg-white/80 backdrop-blur p-2 border border-slate-200 shadow-sm"
            aria-label="Player category tabs"
          >
            <TabsTrigger value="junior" className="group px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-semibold rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow focus-visible:ring-4 focus-visible:ring-indigo-300/70"
              aria-controls="tab-panel-juniors"
            >
              Junior Club Members <span className="ml-2 text-slate-500 group-data-[state=active]:text-white text-sm md:text-base">({juniors.length})</span>
            </TabsTrigger>
            <TabsTrigger value="adult" className="group px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-semibold rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow focus-visible:ring-4 focus-visible:ring-indigo-300/70"
              aria-controls="tab-panel-adults"
            >
              Adult Club Members <span className="ml-2 text-slate-500 group-data-[state=active]:text-white text-sm md:text-base">({adults.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="junior" id="tab-panel-juniors" role="tabpanel" className="outline-none">
            {renderPlayers(juniors)}
          </TabsContent>
          <TabsContent value="adult" id="tab-panel-adults" role="tabpanel" className="outline-none">
            {renderPlayers(adults)}
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}




{/*}

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

*/}
