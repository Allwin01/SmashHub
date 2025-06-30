import { Request, Response } from 'express';
import Player from '../control/models/Player';
import { AuthRequest } from '../types/AuthRequest';
import Club from '../control/models/Club'; 

export const getCoachList = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user?.clubName) {
      return res.status(400).json({ message: 'Missing club name in token' });
    }

    const club = await Club.findOne({ name: user.clubName });
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const coachRoles = ['Coach-Level 1', 'Coach-Level 2', 'Head Coach'];

    const coaches = await Player.find({
      clubId: club._id,
      clubRoles: { $in: coachRoles }
    }).select('firstName surname');

    res.status(200).json(coaches);
  } catch (err) {
    console.error('❌ Error fetching coaches:', err);
    res.status(500).json({ message: 'Failed to fetch coaches' });
  }
};
