import { Player } from '@/types';

export const getAllSuggestedTeams = async (
  clubId: string,
  players: Player[],
  courts: any[]
): Promise<
  {
    label: string;
    icon: string;
    players: Player[];
  }[]
> => {
  const firstPlayer = players[0];
  const remaining = players.slice(1, 8); // next 7 for variety
  const clubToken = localStorage.getItem('token');

  const courtAvailable = courts.find(c => c.assigned.every(p => !p));
  if (!courtAvailable || !firstPlayer) return [];

  // Fetch player stats if needed
  const enriched = await Promise.all(
    remaining.map(async (p) => {
      const scores = p.matchHistory?.slice(-10).map(m => m.points) || [];
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { ...p, avgScore };
    })
  );

  const buckets = {
    hard: [] as Player[],
    medium: [] as Player[],
    easy: [] as Player[],
  };

  enriched.forEach(p => {
    if (p.avgScore >= 70) buckets.hard.push(p);
    else if (p.avgScore >= 40) buckets.medium.push(p);
    else buckets.easy.push(p);
  });

  const buildTeam = (bucket: Player[]) => {
    const filtered = bucket.filter(p => p.id !== firstPlayer.id);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = [firstPlayer, ...shuffled.slice(0, 3)];
    const unique = new Set(selected.map(p => p.id));
    return unique.size === 4 ? selected : [];
  };

  const surprisePool = [...players.slice(1)].sort(() => 0.5 - Math.random());
  const surpriseTeam = [firstPlayer, ...surprisePool.slice(0, 3)];

  const validTeam = (team: Player[]) => team.length === 4 && new Set(team.map(p => p.id)).size === 4;

  const results = [
    {
      label: '🏆 Hard',
      icon: '🔥',
      players: buildTeam(buckets.hard),
    },
    {
      label: '⚖️ Medium',
      icon: '📊',
      players: buildTeam(buckets.medium),
    },
    {
      label: '🎉 Easy',
      icon: '🎯',
      players: buildTeam(buckets.easy),
    },
    {
      label: '🎲 Surprise Me',
      icon: '❓',
      players: validTeam(surpriseTeam) ? surpriseTeam : [],
    },
  ];

  return results.filter(option => option.players.length === 4);
};
