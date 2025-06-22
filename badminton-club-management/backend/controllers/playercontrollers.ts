
// ... previous imports
// ... previous imports
import { Request, Response } from 'express';
import Player from '../control/models/Player';
import { AuthRequest } from '../types/AuthRequest';
import { logAudit } from '../control/utils/auditLogger';
import Attendance from '../control/models/Attendance';
import Club from '../control/models/Club';
import MatchHistory from '../control/models/MatchHistory';

const validSex = ['Male', 'Female'];
const validPlayerTypes = ['Coaching only', 'Club Member', 'Coaching and Club Member'];
const validClubRoles = [
  'Club President', 'Club Secretary', 'Club Treasurer', 'Men\'s Team Captain',
  'Women\'s Team Captain', 'Coach-Level 1', 'Coach-Level 2', 'Head Coach',
  'Safeguarding Officer', 'First Aid Officer', 'Social Media & Marketing Officer'
];
const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
const validMembershipStatuses = ['Active', 'Inactive', 'Paused', 'Discontinued', 'Guest'];
const validPaymentStatuses = ['Paid', 'Due', 'Partial'];


// Addplayer
export const addPlayer = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (addPlayer):', req.user);

  try {
    const user = req.user;

    // 🔍 Lookup actual clubId from clubName
    const club = await Club.findOne({ name: user?.clubName });
    if (!club) {
      return res.status(404).json({ message: `Club '${user?.clubName}' not found` });
    }

    const {
      firstName, surname, dob, sex, isJunior, parentName, parentPhone, email,
      emergencyContactname, emergencyContactphonenumber, joiningDate,
      paymentStatus, coachName, membershipStatus, level, clubRoles,
      playerType, profileImage
    } = req.body;

    const dobDate = new Date(dob);
    const age = new Date().getFullYear() - dobDate.getFullYear();

    const newPlayer = new Player({
      firstName,
      surname,
      dob: dobDate,
      sex,
      isJunior,
      isAdult: age >= 18,
      parentName,
      parentPhone,
      email,
      emergencyContactname,
      emergencyContactphonenumber,
      joinDate: new Date(joiningDate),
      paymentStatus,
      membershipStatus,
      coachName,
      level,
      clubId: club._id, // ✅ Use ObjectId from actual Club
      clubRoles,
      playerType,
      profileImage,
    });

    await newPlayer.save();

    // 📝 Log audit entry
    await logAudit({
      model: 'Player',
      documentId: newPlayer._id,
      action: 'create',
      changedBy: user?.fullName || user?.email || 'Unknown',
      role: user?.role || 'Unknown',
      context: 'Add Player',
      changes: req.body,
    });

    res.status(201).json({ message: 'Player created successfully', player: newPlayer });
  } catch (error) {
    console.error('❌ Add player error:', error);
    res.status(500).json({ message: 'Failed to create player', error });
  }
};


// UpdatePlayer
export const updatePlayer = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (updatePlayer):', req.user);
    try {
    const user = req.user;
    const { id } = req.params;
    const updates = req.body;
    console.log('📤 updatePlayer - Updates received:', updates);

    const updated = await Player.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Player not found' });

    await logAudit({
  model: 'Player',
  documentId: updated._id,
  action: 'update',
  changedBy: user?.fullName || user?.email || 'Unknown',
  role: user?.role || 'Unknown',
  context: 'Update Player',
  changes: updates
});

    res.json(updated);
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: 'Failed to update player' });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (deletePlayer):', req.user);
    try {
    const user = req.user;
    const { id } = req.params;
    const deleted = await Player.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: 'Player not found' });

    await logAudit({
  model: 'Player',
  documentId: deleted._id,
  action: 'delete',
  changedBy: user?.fullName || user?.email || 'Unknown',
  role: user?.role || 'Unknown',
  context: 'Delete Player',
  changes: deleted.toObject()
});

    res.json({ message: 'Player deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete player' });
  }
};

export const getPlayers = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (getPlayers):', req.user);
  try {
    const user = req.user;
   {/* if (!user?.clubName) {
      return res.status(400).json({ message: 'Missing club name in token' });
    }
  const players = await Player.find({ clubId: club._id }); */}

    console.log('🔐 Decoded user (getPlayers):', user);

    // 🔍 Get clubId from clubName
    const club = await Club.findOne({ name: user?.clubName });
    if (!club) {
      return res.status(404).json({ error: `Club '${user?.clubName}' not found` });
    }

    const players = await Player.find({ clubId: club._id });
    res.status(200).json(players);
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    res.status(500).json({ message: 'Failed to fetch players' });
  }
};

export const getPlayerById = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (getPlayerById):', req.user);
  try {
    const player = await Player.findById(req.params.id);
    console.log('📥 getPlayerById - Player fetched:', player);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


// Check for Duplicate player by first Name and Surname

  export const checkDuplicatePlayer = async (req: Request, res: Response) => {
    console.log('✅ /check-duplicate endpoint hit');
  console.log('🔐 Headers:', req.headers);
  console.log('📦 Query params:', req.query);
  try {
    const { firstName, surname, clubName } = req.query;
    console.log('🔍 Duplicate check request:', { firstName, surname, clubName });

    if (!firstName || !surname || !clubName) {
      console.warn('⚠️ Missing required parameters:', { firstName, surname, clubName });
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const existingPlayer = await Player.findOne({
      firstName: { $regex: `^${firstName}$`, $options: 'i' },
      surname: { $regex: `^${surname}$`, $options: 'i' },
      clubId: { $regex: `^${clubName}$`, $options: 'i' }
    });

    console.log('✅ Duplicate check result →', !!existingPlayer);
    return res.json({ exists: !!existingPlayer });

  } catch (err) {
    console.error('❌ Error in checkDuplicatePlayer:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




export const updateSkillMatrix = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (updateSkillMatrix):', req.user);
  try {
    const { id } = req.params;
    const { skillMatrix } = req.body;
    console.log('📤 updateSkillMatrix - SkillMatrix received:', skillMatrix);
    const user = req.user;

    if (!user || ['Parent', 'Tournament Organiser'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const player = await Player.findById(id);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    if (!skillMatrix || typeof skillMatrix !== 'object') {
      return res.status(400).json({ message: 'Invalid skillMatrix payload' });
    }

    const updatedBy = player.coachName || user?.fullName || user?.clubName || 'Unknown';
    const today = new Date().toISOString().split('T')[0];
    const changedSkills: Map<string, Map<string, number>> = new Map();

    for (const category in skillMatrix) {
      const newSkills = skillMatrix[category];
      for (const skill in newSkills) {
        const newValue = newSkills[skill];
        const currentValue = player.skillMatrix?.get(category)?.get(skill) ?? null;

        if (newValue !== currentValue) {
          if (!changedSkills.has(category)) changedSkills.set(category, new Map());
          changedSkills.get(category)!.set(skill, newValue);
        }
      }
    }

    if (changedSkills.size === 0) {
      return res.status(200).json({ message: 'No changes detected in skill matrix' });
    }

    for (const [category, skillMap] of changedSkills.entries()) {
      if (!player.skillMatrix.has(category)) {
        player.skillMatrix.set(category, new Map());
      }
      const categoryMap = player.skillMatrix.get(category)!;
      for (const [skill, value] of skillMap.entries()) {
        categoryMap.set(skill, value);
      }
    }

    const plainChangedSkills: Record<string, Record<string, number>> = {};
    for (const [category, skillMap] of changedSkills.entries()) {
      plainChangedSkills[category] = Object.fromEntries(skillMap);
    }

    const historyEntry = {
      updatedBy,
      date: today,
      skills: new Map(
        Object.entries(plainChangedSkills).map(([category, skillsObj]) => [
          category,
          new Map(Object.entries(skillsObj))
        ])
      )
    };

    player.skillsHistory.push(historyEntry);
    await player.save();

    await logAudit({
  model: 'Player',
  documentId: player._id,
  action: 'update',
  changedBy: user?.fullName || user?.email || 'Unknown',
  role: user?.role || 'Unknown',
  context: 'Update Skill Matrix',
  changes: plainChangedSkills
});

    res.status(200).json({ message: 'Skill matrix updated successfully', player });
  } catch (err) {
    console.error('❌ Error updating skill matrix:', err);
    res.status(500).json({ message: 'Failed to update skill matrix' });
  }
};

// 🧩 GET /players/by-club

// GET /api/players/club
export const getPlayersByClub = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 getPlayersByClub called');
    console.log('➡️ Decoded user:', req.user);

    if (!req.user?.clubName) {
      console.log('⛔ Missing clubName');
      return res.status(400).json({ error: 'Missing clubName in token' });
    }

    const club = await Club.findOne({ name: req.user.clubName });
    if (!club) {
      console.log('⛔ Club not found:', req.user.clubName);
      return res.status(404).json({ error: 'Club not found' });
    }

    console.log('✅ Club found:', club._id);

    const players = await Player.find({ clubId: club._id })
      .select('firstName surname profilePicUrl')
      .sort({ firstName: 1, surname: 1 });

    console.log('✅ Players fetched:', players.length);
    return res.status(200).json(players);
  } catch (error) {
    console.error('🔥 Unhandled error in getPlayersByClub:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};





// 🧩 POST /attendance/
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { attendance } = req.body;
    const markedBy = req.user?.id;

    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ error: 'Invalid attendance data' });
    }

    // 🔍 Resolve clubId from clubName
    const club = await Club.findOne({ name: req.user?.clubName });
    if (!club) {
      return res.status(404).json({ error: `Club '${req.user?.clubName}' not found` });
    }

    const attendanceRecords = attendance.map(entry => ({
      playerId: entry.playerId,
      date: entry.date,
      day: entry.day,        // 📝 Sent from frontend
      type: entry.type,      // 'Club Night' or 'Tournament'
      status: entry.status,  // 'Present' or 'Absent'
      markedBy,
      clubId: club._id,      // ✅ Correct ObjectId
    }));

    await Attendance.insertMany(attendanceRecords);

    return res.status(200).json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('🔥 Error saving attendance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//Save Match Hstory
export const saveMatchHistory = async (req: AuthRequest, res: Response) => {
  try {
    const history = new MatchHistory(req.body);
    await history.save();
    res.status(201).json({ message: 'Match history saved' });
  } catch (err) {
    console.error('❌ Error saving match history:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


/*
import { Request, Response } from 'express';
import Player from '../control/models/Player';
import { AuthRequest } from '../types/AuthRequest';

const validSex = ['Male', 'Female'];
const validPlayerTypes = ['Coaching only', 'Club Member', 'Coaching and Club Member'];
const validClubRoles = [
  'Club President', 'Club Secretary', 'Club Treasurer', 'Men\'s Team Captain',
  'Women\'s Team Captain', 'Coach-Level 1', 'Coach-Level 2', 'Head Coach',
  'Safeguarding Officer', 'First Aid Officer', 'Social Media & Marketing Officer'
];
const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
const validMembershipStatuses = ['Active', 'Inactive', 'Paused', 'Discontinued', 'Guest'];
//const validFinancialStatuses = ['Payment Current', 'Payment Overdue'];
const validPaymentStatuses = ['Paid', 'Due', 'Partial'];

export const addPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    console.log('Decoded user:', user);

    const {
      firstName,
      surName,
      dob,
      sex,
      isJunior,
      parentName,
      parentPhone,
      email,
      emergencyContactname,
      emergencyContactphonenumber,
      joiningDate,
      paymentStatus,
      coachName,
      membershipStatus,
     // financialStatus,
      level,
      clubRoles,
      playerType,
      profileImage
    } = req.body;

    // Validation
    if (!validSex.includes(sex)) return res.status(400).json({ message: `Invalid sex value: ${sex}` });
    if (playerType && !validPlayerTypes.includes(playerType)) return res.status(400).json({ message: `Invalid playerType: ${playerType}` });
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) return res.status(400).json({ message: `Invalid paymentStatus: ${paymentStatus}` });
    if (membershipStatus && !validMembershipStatuses.includes(membershipStatus)) return res.status(400).json({ message: `Invalid membershipStatus: ${membershipStatus}` });
   // if (financialStatus && !validFinancialStatuses.includes(financialStatus)) return res.status(400).json({ message: `Invalid financialStatus: ${financialStatus}` });
    if (level && !validLevels.includes(level)) return res.status(400).json({ message: `Invalid level: ${level}` });
    if (clubRoles && Array.isArray(clubRoles)) {
      const invalidRoles = clubRoles.filter(role => !validClubRoles.includes(role));
      if (invalidRoles.length > 0) return res.status(400).json({ message: `Invalid clubRoles: ${invalidRoles.join(', ')}` });
    }

    const dobDate = new Date(dob);
    const age = new Date().getFullYear() - dobDate.getFullYear();

    const newPlayer = new Player({
      firstName,
      surName,
      dob: dobDate,
      sex,
      isJunior,
      isAdult: age >= 18,
      parentName,
      parentPhone,
      email,
      emergencyContactname,
      emergencyContactphonenumber,
      joinDate: new Date(joiningDate),
      paymentStatus,
      membershipStatus,
      coachName,
      //financialStatus,
      level,
      clubId: user?.clubName || 'Unknown',
      clubRoles,
      playerType,
      profileImage
    });

    await newPlayer.save();
    console.log('✅ Player saved:', newPlayer);
    res.status(201).json({ message: 'Player created successfully', player: newPlayer });
  } catch (error) {
    console.error('❌ Add player error:', error);
    res.status(500).json({ message: 'Failed to create player', error });
  }
};

export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    console.log('Decoded user:', user);

    if (!user?.clubName) {
      return res.status(400).json({ message: 'Missing club name in token' });
    }

    const players = await Player.find({ clubId: user.clubName });
    console.log(`Found ${players.length} players for club: ${user.clubName}`);

    res.status(200).json(players);
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    res.status(500).json({ message: 'Failed to fetch players' });
  }
};

export const getPlayerById = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Fetching player ID:', req.params.id);
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`📥 Update request for player ${id}:`, updates);

    if (updates.sex && !validSex.includes(updates.sex)) return res.status(400).json({ message: `Invalid sex value: ${updates.sex}` });
    if (updates.playerType && !validPlayerTypes.includes(updates.playerType)) return res.status(400).json({ message: `Invalid playerType: ${updates.playerType}` });
    if (updates.paymentStatus && !validPaymentStatuses.includes(updates.paymentStatus)) return res.status(400).json({ message: `Invalid paymentStatus: ${updates.paymentStatus}` });
    if (updates.membershipStatus && !validMembershipStatuses.includes(updates.membershipStatus)) return res.status(400).json({ message: `Invalid membershipStatus: ${updates.membershipStatus}` });
   // if (updates.financialStatus && !validFinancialStatuses.includes(updates.financialStatus)) return res.status(400).json({ message: `Invalid financialStatus: ${updates.financialStatus}` });
    if (updates.level && !validLevels.includes(updates.level)) return res.status(400).json({ message: `Invalid level: ${updates.level}` });
    if (updates.clubRoles && Array.isArray(updates.clubRoles)) {
      const invalidRoles = updates.clubRoles.filter((role: string) => !validClubRoles.includes(role));

      if (invalidRoles.length > 0) return res.status(400).json({ message: `Invalid clubRoles: ${invalidRoles.join(', ')}` });
    }

    const updated = await Player.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) return res.status(404).json({ message: 'Player not found' });

    console.log('✅ Player updated successfully:', updated);
    res.json(updated);
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: 'Failed to update player' });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Player.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: 'Player not found' });

    res.json({ message: 'Player deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete player' });
  }
};



// Update Skill Matrix Controller (Enhanced Grouped Skill Structure)

export const updateSkillMatrix = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { skillMatrix } = req.body;
    const user = req.user;

    if (!user || ['Parent', 'Tournament Organiser'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const player = await Player.findById(id);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    if (!skillMatrix || typeof skillMatrix !== 'object') {
      return res.status(400).json({ message: 'Invalid skillMatrix payload' });
    }

    const updatedBy = player.coachName || user?.fullName || user?.clubName || 'Unknown';
    const today = new Date().toISOString().split('T')[0];
    const changedSkills: Map<string, Map<string, number>> = new Map();

    for (const category in skillMatrix) {
      const newSkills = skillMatrix[category];
      for (const skill in newSkills) {
        const newValue = newSkills[skill];
        const currentValue = player.skillMatrix?.get(category)?.get(skill) ?? null;

        if (newValue !== currentValue) {
          if (!changedSkills.has(category)) changedSkills.set(category, new Map());
          changedSkills.get(category)!.set(skill, newValue);
        }
      }
    }

    if (changedSkills.size === 0) {
      return res.status(200).json({ message: 'No changes detected in skill matrix' });
    }

    for (const [category, skillMap] of changedSkills.entries()) {
      if (!player.skillMatrix.has(category)) {
        player.skillMatrix.set(category, new Map());
      }
      const categoryMap = player.skillMatrix.get(category)!;
      for (const [skill, value] of skillMap.entries()) {
        categoryMap.set(skill, value);
      }
    }

    const plainChangedSkills: Record<string, Record<string, number>> = {};
    for (const [category, skillMap] of changedSkills.entries()) {
      plainChangedSkills[category] = Object.fromEntries(skillMap);
    }

    const historyEntry = {
      updatedBy,
      date: today,
      skills: new Map(
        Object.entries(plainChangedSkills).map(([category, skillsObj]) => [
          category,
          new Map(Object.entries(skillsObj))
        ])
      )
    };

    player.skillsHistory.push(historyEntry);
    await player.save();

    if (process.env.ENABLE_AUDIT_LOG === 'true') {
      await AuditLog.create({
        model: 'Player',
        documentId: player._id,
        action: 'update',
        changedBy: user?.fullName || user?.email,
        role: user?.role,
        timestamp: new Date(),
        context: 'Update Skill Matrix',
        changes: plainChangedSkills
      });
    }

    res.status(200).json({ message: 'Skill matrix updated successfully', player });
  } catch (err) {
    console.error('❌ Error updating skill matrix:', err);
    res.status(500).json({ message: 'Failed to update skill matrix' });
  }
};


*/