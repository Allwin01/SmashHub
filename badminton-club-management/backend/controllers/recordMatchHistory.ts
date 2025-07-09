import { Request, Response } from 'express';
import MatchHistory from '../control/models/MatchHistory'; // path to your schema
import Player from '../control/models/Player';

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