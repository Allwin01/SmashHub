
// control/controllers/matchHistoryController.ts
import { Request, Response } from 'express';
import MatchHistory from '../control/models/MatchHistory';
import Player from '../control/models/Player';
import mongoose from 'mongoose';

// --- helpers ---
const getId = (p: any): string =>
  (p?.playerId ?? p?.id ?? p?._id)?.toString?.() || '';

const getSex = (p: any): 'Male' | 'Female' | string =>
  p?.sex ?? p?.gender ?? '';

const getName = (p: any): string => {
  if (p?.name) return String(p.name).trim();
  const fn = p?.firstName ?? '';
  const sn = p?.surName ?? '';
  return `${fn} ${sn}`.trim();
};

const isGuest = (p: any): boolean =>
  Boolean(
    p?.isGuest ||
    p?.playerType === 'Guest' ||
    String(p?.id ?? '').startsWith('guest') ||
    String(p?._id ?? '').startsWith('guest') ||
    String(p?.playerId ?? '').startsWith('guest')
  );



  export const recordMatchHistory = async (req: Request, res: Response) => {
    console.log('📥 Received match history request');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
    try {
      const { courtNo, matchType, assignedPlayers, score, duration } = req.body;
  
      if (!Array.isArray(assignedPlayers) || assignedPlayers.length < 2 || !score) {
        return res.status(400).json({ error: 'Invalid match data' });
      }
  
      // Normalize the incoming players (full docs or slim shape)
      const normalized = assignedPlayers.map((p: any) => ({
        id: getId(p),                // ObjectId for members; empty/guest for guests
        name: getName(p),            // "First Last"
        sex: getSex(p),              // 'Male' | 'Female'
        guest: isGuest(p),
      }));
  
      // Split into teams
      const teamA = normalized.length === 2 ? [normalized[0]] : normalized.slice(0, 2);
      const teamB = normalized.length === 2 ? [normalized[1]] : normalized.slice(2);
  
      // Parse score (modal should already send NN/NN)
      const [scoreA, scoreB] = String(score).split('/').map((n: string) => parseInt(n, 10));
      const winningTeam = scoreA > scoreB ? teamA : teamB;
      const losingTeam  = scoreA > scoreB ? teamB : teamA;
      const winningScore = Math.max(scoreA, scoreB);
      const losingScore  = Math.min(scoreA, scoreB);
  
      // Common match fields
      const now = new Date();
      const matchId = `C${courtNo}-${now.toISOString()}`;
      const matchDate = now.toISOString().split('T')[0];
      const matchTime = now.toTimeString().split(' ')[0];
  
      const docsToInsert: any[] = [];
  
      // Create ONE row per **club member** (skip guests as the row owner)
      for (const me of [...teamA, ...teamB]) {
        const isMember = !!me.id; // guests will have empty id here
        if (!isMember) continue;  // don't create a row owned by a guest
  
        const iAmOnTeamA = teamA.some(x => x.id === me.id);
        const myTeam = iAmOnTeamA ? teamA : teamB;
        const oppTeam = iAmOnTeamA ? teamB : teamA;
  
        const isWinner = (scoreA > scoreB && iAmOnTeamA) || (scoreB > scoreA && !iAmOnTeamA);
  
        // Partner: if doubles, pick the other from my team (could be guest or member)
        const partner = myTeam.length === 2
          ? myTeam.find(p => p.id !== me.id) || myTeam.find(p => p.guest) || null
          : null;
  
        // Opponents: include both guests and members (your schema only needs name & gender)
        const opponents = oppTeam.map(o => ({ name: o.name, gender: o.sex }));
  
        docsToInsert.push({
          playerId: me.id,                                   // required by schema (row owner is a member)
          matchId,
          matchDate,
          matchTime,
          result: isWinner ? 'Win' : 'Loss',
          matchType,
          partner: partner?.name ?? '',                      // String
          partnerSex: partner?.sex ?? '',                    // String
          opponents,                                         // [{ name, gender }]
          points: isWinner ? winningScore : losingScore,
          duration,
          courtNo,
        });
      }
  
      if (docsToInsert.length === 0) {
        console.warn('⚠️ No member rows to insert (were all players guests?)');
        return res.status(200).json({ message: 'No member records created (guests only match)' });
      }
  
      await MatchHistory.insertMany(docsToInsert);
      console.log(`✅ ${docsToInsert.length} records inserted into MatchHistory`);
  
      // Update aggregates for each member we wrote a row for
      for (const doc of docsToInsert) {
        const allMatches = await MatchHistory.find({ playerId: doc.playerId }).sort({ matchDate: -1 }).limit(10);
        const totalPoints = allMatches.reduce((sum, m) => sum + (m.points || 0), 0);
        const avgPoints = allMatches.length ? Math.round(totalPoints / allMatches.length) : 0;
  
        await Player.updateOne(
          { _id: doc.playerId },
          { $set: { averagePoints: avgPoints }, $inc: { matchCount: 1 } }
        );
        console.log(`↪️ Player ${doc.playerId} stats updated`);
      }
  
      res.status(200).json({ message: '✅ Match history recorded for players' });
    } catch (error) {
      console.error('❌ Error saving match history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  
  {/*}

export const recordMatchHistory = async (req: Request, res: Response) => {
  console.log('📥 Received match history request');
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

  try {
    const { courtNo, matchType, score, duration } = req.body;

    // Flexible input: either assignedPlayers (array of 2–4 full docs) OR team1/team2 slim arrays
    let assignedPlayersRaw: any[] = [];
    if (Array.isArray(req.body.assignedPlayers)) {
      assignedPlayersRaw = req.body.assignedPlayers;
    } else if (req.body.team1?.players || req.body.team2?.players) {
      const t1 = Array.isArray(req.body.team1?.players) ? req.body.team1.players : [];
      const t2 = Array.isArray(req.body.team2?.players) ? req.body.team2.players : [];
      // Convert slim players to a uniform shape that our normalizer understands
      assignedPlayersRaw = [
        ...t1.map((p: any) => ({ id: p.playerId, name: p.name, sex: p.sex })),
        ...t2.map((p: any) => ({ id: p.playerId, name: p.name, sex: p.sex })),
      ];
    }

    if (!Array.isArray(assignedPlayersRaw) || assignedPlayersRaw.length < 2 || !score) {
      return res.status(400).json({ error: 'Invalid match data' });
    }

    // Normalize players to a minimal object the DB expects
    const assigned = assignedPlayersRaw.map((p) => ({
      id:      getId(p),                // ObjectId string for members; empty for guests
      name:    getName(p),              // "First Last"
      sex:     getSex(p),               // 'Male' | 'Female'
      guest:   isGuest(p),
    }));

    // Build teams (singles or doubles)
    const teamA = assigned.length === 2 ? [assigned[0]] : assigned.slice(0, 2);
    const teamB = assigned.length === 2 ? [assigned[1]] : assigned.slice(2);

    // Basic score parse (modal should already validate NN/NN)
    const [scoreA, scoreB] = String(score).split('/').map((n: string) => parseInt(n, 10));

    const now = new Date();
    const matchId = `C${courtNo}-${now.toISOString()}`;
    const matchDate = now.toISOString().split('T')[0];
    const matchTime = now.toTimeString().split(' ')[0];

    const winningTeam = scoreA > scoreB ? teamA : teamB;
    const losingTeam  = scoreA > scoreB ? teamB : teamA;
    const winningScore = Math.max(scoreA, scoreB);
    const losingScore  = Math.min(scoreA, scoreB);

    // Prepare insert docs for **members only** (skip guests that lack ObjectId)
    const docsToInsert: any[] = [];

    for (const player of [...teamA, ...teamB]) {
      if (player.guest || !player.id || !mongoose.Types.ObjectId.isValid(player.id)) {
        // Skip guests or bad ids for MatchHistory; they can be included later if schema supports it
        continue;
      }

      const isWinner = winningTeam.some(p => p.id === player.id);
      const team = isWinner ? winningTeam : losingTeam;
      const opponents = isWinner ? losingTeam : winningTeam;
      const points = isWinner ? winningScore : losingScore;

      const partner =
        team.length === 2
          ? team.find(p => p.id !== player.id)
          : null;

      docsToInsert.push({
        playerId: player.id,
        matchId,
        matchDate,
        matchTime,
        result: isWinner ? 'Win' : 'Loss',
        matchType,
        partner: partner?.name ?? '',
        partnerSex: partner?.sex ?? '',
        opponents: opponents
          .filter(o => !o.guest) // only persist members as opponents
          .map(o => ({ name: o.name, gender: o.sex })),
        points,
        duration,
        courtNo,
      });
    }

    if (docsToInsert.length === 0) {
      console.warn('⚠️ No member players to insert into MatchHistory (all guests?)');
      return res.status(200).json({ message: 'No member records created (guests only match)' });
    }

    await MatchHistory.insertMany(docsToInsert);
    console.log(`✅ ${docsToInsert.length} records inserted into MatchHistory`);

    // Update player aggregates
    for (const doc of docsToInsert) {
      const allMatches = await MatchHistory.find({ playerId: doc.playerId }).sort({ matchDate: -1 }).limit(10);
      const totalPoints = allMatches.reduce((sum, m) => sum + (m.points || 0), 0);
      const avgPoints = allMatches.length ? Math.round(totalPoints / allMatches.length) : 0;

      await Player.updateOne(
        { _id: doc.playerId },
        { $set: { averagePoints: avgPoints }, $inc: { matchCount: 1 } }
      );
      console.log(`↪️ Player ${doc.playerId} stats updated`);
    }

    res.status(200).json({ message: '✅ Match history recorded for players' });
  } catch (error) {
    console.error('❌ Error saving match history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

*/}


{/*}
import { Request, Response } from 'express';
import MatchHistory from '../control/models/MatchHistory'; 
import Player from '../control/models/Player';
import mongoose from 'mongoose';

import MatchSummary from '../control/models/MatchSummary';


interface PlayerInfo {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
}

// Route: POST /api/match-history
// control/controllers/matchHistoryController.ts
export const recordMatchHistory = async (req: Request, res: Response) => {

      console.log('📥 Received match history request');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    try {
      const {
        courtNo,
        matchType,
        assignedPlayers,
        score,
        duration
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
  
      const winningTeam = scoreA > scoreB ? teamA : teamB;
      const losingTeam = scoreA > scoreB ? teamB : teamA;
      const winningScore = Math.max(scoreA, scoreB);
      const losingScore = Math.min(scoreA, scoreB);
  
      const docsToInsert = [];
  
      for (const player of [...teamA, ...teamB]) {
        if (player.id.startsWith('guest')) continue;
  
        const isWinner = winningTeam.some(p => p.id === player.id);
        const team = isWinner ? winningTeam : losingTeam;
        const opponents = isWinner ? losingTeam : winningTeam;
        const points = isWinner ? winningScore : losingScore;
  
        docsToInsert.push({
          playerId: player.id,
          matchId,
          matchDate,
          matchTime,
          result: isWinner ? 'Win' : 'Loss',
          matchType,
          partner: team.length === 2 ? team.find(p => p.id !== player.id)?.name || '' : '',
          partnerSex: team.length === 2 ? team.find(p => p.id !== player.id)?.gender || '' : '',
          opponents: opponents.map(o => ({ name: o.name, gender: o.gender })),
          points,
          duration,
          courtNo
        });
      }
  
      await MatchHistory.insertMany(docsToInsert);

      console.log(`✅ ${docsToInsert.length} records inserted into MatchHistory`);
  
      for (const doc of docsToInsert) {
        const allMatches = await MatchHistory.find({ playerId: doc.playerId }).sort({ matchDate: -1 }).limit(10);
        const totalPoints = allMatches.reduce((sum, m) => sum + m.points, 0);
        const avgPoints = Math.round(totalPoints / allMatches.length);
  
        await Player.updateOne({ _id: doc.playerId }, {
          $set: { averagePoints: avgPoints },
          $inc: { matchCount: 1 }
        });
        console.log(`↪️ Player ${doc.playerId} stats updated`);
      }
  
      res.status(200).json({ message: '✅ Match history recorded for players' });
    } catch (error) {
      console.error('❌ Error saving match history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  


  // GET /api/matchHistory/top-players?clubId=xxx&limit=15
  export const getTopPlayersWithHistory = async (req: Request, res: Response) => {
    try {
      const { clubId, limit } = req.query;
  
      if (!clubId) return res.status(400).json({ error: 'Missing clubId' });
  
      const topLimit = parseInt(limit as string) || 15;
      const players = await Player.find({ clubId }).limit(topLimit).lean();
  
      const enriched = await Promise.all(
        players.map(async (p) => {
          const matches = await MatchHistory.find({ playerId: p._id })
            .sort({ matchDate: -1 })
            .limit(10);
  
          const total = matches.reduce((sum, m) => sum + (m.points || 0), 0);
          const avgScore = matches.length ? Math.round(total / matches.length) : 0;
  
          return {
            id: p._id,
            name: `${p.firstName} ${p.surName || ''}`.trim(),
            gender: p.sex,
            avgScore,
            matchCount: matches.length,
            profilePicUrl: p.profilePicUrl || '',

          };
        })
      );
  
      res.json({ players: enriched });
    } catch (err) {
      console.error('❌ Error in getTopPlayersWithHistory:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

export const getMatchHistoryByPlayerId = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log(`🎯 Incoming request for match history of player ID: ${id}`); // ✅ Debug log
  console.log('📥 getMatchHistoryByPlayerId controller called');
  console.log(`🔎 Requesting match history for player ID: ${id}`);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid player ID' });
  }

  try {
    const matches = await MatchHistory.find({ playerId: id }).sort({ matchDate: -1 }).lean();
    const formattedMatches = matches.map(m => ({
      date: m.matchDate,
      category: m.matchType,
      result: m.result,
      partner: m.partner,
      opponents: m.opponents?.map(o => o.name || o), // fallback if it's a string
    }));

    console.log(`✅ Found ${formattedMatches.length} matches for player ${id}`); // Optional log
    res.json(formattedMatches);
  } catch (err) {
    console.error('❌ Error fetching match history:', err);
    res.status(500).json({ message: 'Server error while fetching match history' });
  }
};

*/}
