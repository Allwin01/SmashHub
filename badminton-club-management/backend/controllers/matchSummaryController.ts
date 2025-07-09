// backend/controllers/matchSummaryController.ts

import { Request, Response } from 'express';
import MatchSummary from '../control/models/MatchSummary';
import MatchHistory from '../control/models/MatchHistory';
import Player from '../control/models/Player';

export const updateMatchSummary = async (req: Request, res: Response) => {
    try {
      const { clubId, date, winners, matchType } = req.body;
  
      console.log('📤 updateMatchSummary received:', { clubId, date, winners, matchType });
  
      if (!clubId || !date || !Array.isArray(winners) || winners.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      let summary = await MatchSummary.findOne({ clubId, date });
  
      if (!summary) {
        // Create new summary if it doesn't exist
        summary = new MatchSummary({
          date,
          clubId,
          totalMatches: 0,
          winners: [],
          topPlayer: null,
          topMale: null,
          topFemale: null,
        });
      }
  
      // 1️⃣ Increment match count ONCE per match
      summary.totalMatches += 1;
  
      // 2️⃣ Update win counts for each winner
      for (const winner of winners) {
        const existing = summary.winners.find(w => w.playerId.toString() === winner.playerId);
        if (existing) {
          existing.wins += 1;
        } else {
          summary.winners.push({ playerId: winner.playerId, wins: 1 });
        }
  
        // 3️⃣ Assign topMale / topFemale if not already set
        if (winner.gender === 'Male' && !summary.topMale) {
          summary.topMale = winner.playerId;
        } else if (winner.gender === 'Female' && !summary.topFemale) {
          summary.topFemale = winner.playerId;
        }
      }
  
      // 4️⃣ Sort by win count to determine overall topPlayer
      summary.winners.sort((a, b) => b.wins - a.wins);
      summary.topPlayer = summary.winners[0]?.playerId ?? null;
  
      await summary.save();
  
      return res.status(200).json({ message: '✅ Match summary updated successfully' });
    } catch (err) {
      console.error('❌ Error updating match summary:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

// To Send Match summary for Winner board..



  export const getMatchSummary = async (req: Request, res: Response) => {
    try {
      const { clubId, date } = req.query;
  
      console.log('📥 GET /matchSummary with query:', req.query);

      if (!clubId || !date) {
        return res.status(400).json({ error: 'Missing clubId or date' });
      }
  
      const summary = await MatchSummary.findOne({ clubId, date });
  
      if (!summary) {
        return res.status(404).json({ error: 'No summary found' });
      }
  
      const allWinnerIds = summary.winners.map(w => w.playerId?.toString());
  
      const playerDetails = await Player.find({ _id: { $in: allWinnerIds } }).lean();
  
      // Add number of wins to player objects
      const getWins = (id: string) =>
        summary.winners.find(w => w.playerId.toString() === id)?.wins || 0;
  
      const decoratePlayer = (id: string | null) => {
        if (!id) return null;
        const player = playerDetails.find(p => p._id.toString() === id.toString());
        if (!player) return null;
        return { ...player, wins: getWins(id.toString()) };
      };
  
      const decoratedTopPlayer = decoratePlayer(summary.topPlayer?.toString() || '');
      const decoratedTopMale = decoratePlayer(summary.topMale?.toString() || '');
      const decoratedTopFemale = decoratePlayer(summary.topFemale?.toString() || '');
  
      console.log('📤 Returning populated summary:', {
        topPlayer: decoratedTopPlayer,
        topMale: decoratedTopMale,
        topFemale: decoratedTopFemale
      });
  
      return res.status(200).json({
        summary: {
          date: summary.date,
          clubId: summary.clubId,
          totalMatches: summary.totalMatches,
          topPlayer: decoratedTopPlayer,
          topMale: decoratedTopMale,
          topFemale: decoratedTopFemale
        }
      });
  
    } catch (err) {
      console.error('❌ Error fetching match summary:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  