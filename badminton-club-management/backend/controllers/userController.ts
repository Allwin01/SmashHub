// controllers/userController.ts
import { Request, Response } from 'express';
import User from '../control/models/User';
import bcrypt from 'bcryptjs';


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
  

// Create login credentials for a new user
export const createLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, role, permissions, linkedPlayerId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      permissions,
      linkedPlayerId,
      status: 'Active',
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('❌ Error creating login:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update a user’s status (e.g., Active / Disabled)
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { email, newStatus } = req.body;

    const updated = await User.findOneAndUpdate(
      { email },
      { status: newStatus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Status updated', updated });
  } catch (err) {
    console.error('❌ Error updating status:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Save/overwrite permission fields for a user
export const savePermissions = async (req: Request, res: Response) => {
  try {
    const { email, permissions } = req.body;

    const updated = await User.findOneAndUpdate(
      { email },
      { permissions },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Permissions updated', updated });
  } catch (err) {
    console.error('❌ Error saving permissions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// ✅ Get all users by clubId
export const getUsersByClubId = async (req: Request, res: Response) => {
    try {
      const { clubId } = req.query;
      if (!clubId) {
        return res.status(400).json({ message: 'Club ID is required' });
      }
  
      // Return all users who selected the club
      const users = await User.find({ selectedClub: clubId });
      res.status(200).json(users);
    } catch (err) {
      console.error('❌ Error fetching users by club ID:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

  
// routes/users.ts or controllers/userController.ts
export const getUserByEmail = async (req: Request, res: Response) => {
    console.log('📥 Received GET /api/users with query:', req.query);
  
    const { email } = req.query;
  
    if (!email || typeof email !== 'string') {
      console.warn('⚠️ Email query param is missing or invalid');
      return res.status(400).json({ message: 'Email query param is required' });
    }
  
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
  
      if (!user) {
        console.info('ℹ️ No user found for email:', email);
        return res.status(404).json({ message: 'User not found' });
      }
  
      console.log('✅ Found user:', user.email);
      return res.status(200).json(user);
    } catch (err) {
      console.error('❌ Error finding user by email:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  