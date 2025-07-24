import { Request, Response } from 'express';
import Match from '../control/models/MatchAnalytics';
import Player from '../control/models/Player';
import mongoose from 'mongoose';

// --- Util to format seconds as HH:MM:SS ---
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// POST /api/match-history
export const recordMatchHistory = async (req: Request, res: Response) => {
  console.log('📥 Received match history request');
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

  try {
    const {
      courtNo,
      matchType,
      assignedPlayers,
      score,
      duration // expects seconds
    } = req.body;

    if (!Array.isArray(assignedPlayers) || assignedPlayers.length < 2 || !score) {
      return res.status(400).json({ error: 'Invalid match data' });
    }

    const [scoreA, scoreB] = score.split('/').map(Number);
    const [teamA, teamB] = assignedPlayers.length === 2
      ? [[assignedPlayers[0]], [assignedPlayers[1]]]
      : [assignedPlayers.slice(0, 2), assignedPlayers.slice(2)];

    const now = new Date();
    const matchId = `C${courtNo}-${now.toISOString()}`;
    const matchDate = now.toISOString().split('T')[0];
    const matchTime = now.toTimeString().split(' ')[0];
    const durationFormatted = typeof duration === 'number'
  ? formatDuration(duration)
  : duration; // Assume already in 'HH:MM:SS' if string

    const team1 = teamA.map(p => ({
      playerId: p.id,
      name: p.name,
      sex: p.gender
    }));

    const team2 = teamB.map(p => ({
      playerId: p.id,
      name: p.name,
      sex: p.gender
    }));

    const newMatch = new Match({
      matchId,
      matchDate,
      matchTime,
      duration: durationFormatted,
      courtNo,
      matchType,
      team1: {
        players: team1,
        score: scoreA.toString()
      },
      team2: {
        players: team2,
        score: scoreB.toString()
      },
      winnerTeam: scoreA > scoreB ? 1 : 2
    });

    await newMatch.save();
    console.log(`✅ Match saved: ${matchId}`);

    // Optionally update player stats
    for (const player of [...teamA, ...teamB]) {
      if (player.id.startsWith('guest')) continue;

      const allMatches = await Match.find({
        $or: [
          { 'team1.players.playerId': player.id },
          { 'team2.players.playerId': player.id }
        ]
      }).sort({ matchDate: -1 }).limit(10);

      const totalPoints = allMatches.reduce((sum, m) => {
        const team = m?.team1?.players?.some(p => p.playerId.toString() === player.id) ? m.team1 : m.team2;
        return sum + parseInt(team?.score || '0');
      }, 0);

      const avgPoints = Math.round(totalPoints / allMatches.length);

      await Player.updateOne({ _id: player.id }, {
        $set: { averagePoints: avgPoints },
        $inc: { matchCount: 1 }
      });

      console.log(`↪️ Player ${player.id} stats updated`);
    }

    res.status(200).json({ message: '✅ Match recorded successfully' });
  } catch (error) {
    console.error('❌ Error saving match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/match-history/:id
export const getMatchHistoryByPlayerId = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log(`🎯 Incoming request for match history of player ID: ${id}`);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid player ID' });
  }

  try {
    const matches = await Match.find({
      $or: [
        { 'team1.players.playerId': id },
        { 'team2.players.playerId': id }
      ]
    }).sort({ matchDate: -1 }).lean();

    const formattedMatches = matches.map(m => {
      const isTeam1 = m?.team1?.players?.some(p => p.playerId.toString() === id);
      const myTeam = isTeam1 ? m?.team1 : m?.team2;
      const opponentTeam = isTeam1 ? m?.team2 : m?.team1;

      return {
        date: m.matchDate,
        category: m.matchType,
        result: (m.winnerTeam === (isTeam1 ? 1 : 2)) ? 'Win' : 'Loss',
        partner: myTeam?.players?.length === 2
          ? myTeam.players.find(p => p.playerId.toString() !== id)?.name || ''
          : '',
        opponents: opponentTeam?.players?.map(o => o.name || o) || [],
        duration: m.duration,
        score: `${m?.team1?.score || 0} / ${m?.team2?.score || 0}`
      };
    });

    console.log(`✅ Found ${formattedMatches.length} matches for player ${id}`);
    res.json(formattedMatches);
  } catch (err) {
    console.error('❌ Error fetching match history:', err);
    res.status(500).json({ message: 'Server error while fetching match history' });
  }
};

// GET /api/match-history/top-players?clubId=xxx&limit=15
export const getTopPlayersWithHistory = async (req: Request, res: Response) => {
  try {
    const { clubId, limit } = req.query;

    if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

    const topLimit = parseInt(limit as string) || 15;

    // Get players for the specified club
    const players = await Player.find({ clubId }).limit(topLimit).lean();

    // Enrich each player with recent match stats
    const enriched = await Promise.all(
      players.map(async (p) => {
        // Find up to 10 recent matches that this player participated in
        const matches = await Match.find({
          $or: [
            { 'team1.players.playerId': p._id },
            { 'team2.players.playerId': p._id }
          ]
        }).sort({ matchDate: -1 }).limit(10);

        // Calculate total points scored in those matches by checking which team the player was on
        const total = matches.reduce((sum, m) => {
          const isTeam1 = m?.team1?.players?.some(pl => pl.playerId.toString() === p._id.toString());
          const team = isTeam1 ? m?.team1 : m?.team2;
          return sum + parseInt(team?.score || '0');
        }, 0);

        const avgScore = matches.length ? Math.round(total / matches.length) : 0;

        return {
          id: p._id,
          name: `${p.firstName} ${p.surName || ''}`.trim(),
          gender: p.sex,
          avgScore,
          matchCount: matches.length,
          profilePicUrl: p.profilePicUrl || ''
        };
      })
    );

    // Sort players by avgScore descending before sending response
    enriched.sort((a, b) => b.avgScore - a.avgScore);

    res.json({ players: enriched });
  } catch (err) {
    console.error('❌ Error in getTopPlayersWithHistory:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
