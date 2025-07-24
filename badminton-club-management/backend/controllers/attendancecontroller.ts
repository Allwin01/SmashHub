
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

    // 🧱 Step 1: Load Players with joinDate and type
    const allPlayers = await Player.find({
      clubId: new mongoose.Types.ObjectId(clubId),
      playerType: { $in: ['Adult Club Member', 'Junior Club Member'] },
      joinDate: { $exists: true }
    }).select('_id playerType joinDate').lean();

    // 🧱 Step 2: Aggregate attendance (Present only)
    const attendanceData = await Attendance.aggregate([
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
          'player.playerType': { $in: ['Adult Club Member', 'Junior Club Member'] }
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
      }
    ]);

    // 🧱 Step 3: Prepare totals per day
    const dateMap: Record<string, { [type: string]: number }> = {};
    const dates = [...new Set(attendanceData.map(a => {
      const d = new Date(a._id.date);
      return d.toISOString().split('T')[0];
    }))];
    

    dates.forEach(dateStr => {
      const day = new Date(dateStr);
      const playersActive = allPlayers.filter(p => new Date(p.joinDate) <= day);

      const adultCount = playersActive.filter(p => p.playerType === 'Adult Club Member').length;
      const juniorCount = playersActive.filter(p => p.playerType === 'Junior Club Member').length;

      dateMap[dateStr] = {
        totalAdults: adultCount,
        totalJuniors: juniorCount
      };
    });

    // 🧱 Step 4: Assemble final result
    const dailyResult: {
      period: string;
      adultClubMember: number;
      juniorClubMember: number;
    }[] = [];

    dates.forEach(dateStr => {
      const dayStats = attendanceData.filter(a => {
        const d = new Date(a._id.date);
        return d.toISOString().split('T')[0] === dateStr;
      });

      
      const adultPresent = dayStats.find(a => a._id.type === 'Adult Club Member')?.presentCount || 0;
      const juniorPresent = dayStats.find(a => a._id.type === 'Junior Club Member')?.presentCount || 0;

      const total = dateMap[dateStr];
      const adultPct = total.totalAdults ? (adultPresent / total.totalAdults) * 100 : 0;
      const juniorPct = total.totalJuniors ? (juniorPresent / total.totalJuniors) * 100 : 0;

      dailyResult.push({
        period: dateStr,
        adultClubMember: Math.round(adultPct * 10) / 10,
        juniorClubMember: Math.round(juniorPct * 10) / 10
      });
    });

    res.json(dailyResult.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()));
  } catch (err) {
    console.error('❌ Error in getClubAttendanceStatsDaily:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



{/*}
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
      playerType: { $in: ['Adult Club Member', 'Junior Club Member'] },
    }).lean();

    const totalByType = {
      adultClubMember: players.filter(p => p.playerType === 'Adult Club Member').length,
      juniorClubMember: players.filter(p => p.playerType === 'Junior Club Member').length,
    };
    
   
    console.log('🧮 totalByType:', totalByType);


    if (totalByType.adultClubMember + totalByType.juniorClubMember=== 0) {
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
          'player.playerType': { $in: ['Adult Club Member', 'Junior Club Member'] }
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
            adultClubMember: {
              $round: [
                {
                  $cond: [
                    { $gt: [totalByType.adultClubMember, 0] },
                    { $multiply: [{ $divide: ['$countsObj.Adult Club Member', totalByType.adultClubMember] }, 100] },
                    0
                  ]
                },
                1
              ]
            },
            juniorClubMember: {
              $round: [
                {
                  $cond: [
                    { $gt: [totalByType.juniorClubMember, 0] },
                    { $multiply: [{ $divide: ['$countsObj.Junior Club Member', totalByType.juniorClubMember] }, 100] },
                    0
                  ]
                },
                1
              ]
            }
          }
        }
        ,
      { $sort: { period: 1 } }
    ]);

  

    res.json(stats);
  } catch (err) {
    console.error('❌ Error in getClubAttendanceStatsDaily:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

*/}