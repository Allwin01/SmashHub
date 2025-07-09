// controllers/userController.ts
import { Request, Response } from 'express';
import User from '../control/models/User';

export const updateSettings = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id; 
      const { sidebarColor } = req.body;
  
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
      const user = await User.findByIdAndUpdate(userId, { sidebarColor }, { new: true });
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      res.json({ success: true });
    } catch (err) {
      console.error('❌ Error updating settings:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
