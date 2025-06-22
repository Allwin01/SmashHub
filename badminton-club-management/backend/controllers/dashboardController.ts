
//

import { Request, Response } from 'express';

export const getSuperAdminDashboard = (req: Request, res: Response) => {
  res.json({ message: 'Super Admin dashboard access granted.' });
};

export const getClubAdminDashboard = (req: Request, res: Response) => {
  res.json({ message: 'Club Admin dashboard access granted.' });
};

export const getCoachDashboard = (req: Request, res: Response) => {
  res.json({ message: 'Coach dashboard access granted.' });
};

export const getTournamentOrganiserDashboard = (req: Request, res: Response) => {
  res.json({ message: 'Tournament Organiser dashboard access granted.' });
};

export const getParentsDashboard = (req: Request, res: Response) => {
  res.json({ message: 'Parents dashboard access granted.' });
};
