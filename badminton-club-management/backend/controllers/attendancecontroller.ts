import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from '../control/models/Attendance';
import Player from '../control/models/Player';

export const getClubAttendanceStatsDaily = async (req: Request, res: Response) => {
  try {
    const clubId = req.query.clubId?.toString();
    if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // last 30 days
    const startISO = startDate.toISOString().split('T')[0];

    // Get active players split by type
    const players = await Player.find({
      clubId: new mongoose.Types.ObjectId(clubId),
      playerType: { $in: ['Club Member', 'Coaching only'] },
    }).lean();

    const totalByType = {
      clubMember: players.filter(p => p.playerType === 'Club Member').length,
      coachingOnly: players.filter(p => p.playerType === 'Coaching only').length,
    };

    if (totalByType.clubMember + totalByType.coachingOnly === 0) {
      return res.json([]);
    }

    const stats = await Attendance.aggregate([
      {
        $match: {
          clubId: new mongoose.Types.ObjectId(clubId),
          status: 'Present',
          date: { $gte: startISO }
        }
      },
      {
        $lookup: {
          from: 'players',
          localField: 'playerId',
          foreignField: '_id',
          as: 'player'
        }
      },
      { $unwind: '$player' },
      {
        $match: {
          'player.playerType': { $in: ['Club Member', 'Coaching only'] }
        }
      },
      {
        $group: {
          _id: {
            date: '$date',
            type: '$player.playerType'
          },
          presentCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          counts: {
            $push: {
              k: '$_id.type',
              v: '$presentCount'
            }
          }
        }
      },
      {
        $addFields: {
          countsObj: { $arrayToObject: '$counts' }
        }
      },
      {
        $project: {
          period: '$_id',
          clubMember: {
            $round: [
              {
                $cond: [
                  { $gt: [totalByType.clubMember, 0] },
                  { $multiply: [{ $divide: ['$countsObj.Club Member', totalByType.clubMember] }, 100] },
                  0
                ]
              },
              1
            ]
          },
          coachingOnly: {
            $round: [
              {
                $cond: [
                  { $gt: [totalByType.coachingOnly, 0] },
                  { $multiply: [{ $divide: ['$countsObj.Coaching only', totalByType.coachingOnly] }, 100] },
                  0
                ]
              },
              1
            ]
          }
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.json(stats);
  } catch (err) {
    console.error('❌ Error in getClubAttendanceStatsDaily:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
