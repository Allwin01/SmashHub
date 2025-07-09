
// ... previous imports
import { Request, Response } from 'express';
import Player from '../control/models/Player';
import { AuthRequest } from '../types/AuthRequest';
import { logAudit } from '../control/utils/auditLogger';
import Attendance from '../control/models/Attendance';
import Club from '../control/models/Club';


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

export const skillGroups: Record<string, string[]> = {
  'Movement Phases': ['Split-Step', 'Chasse Step', 'Lunging', 'Jumping'],
  'Grips & Grip Positions': ['Basic Grip', 'Panhandle', 'Bevel', 'Thumb Grip', 'Grip Adjustment'],
  'Forehand Strokes': ['Clear', 'Drop Shot', 'Smash', 'Slice Drop', 'Lift (Underarm)', 'Net Drop (Underarm)'],
  'Backhand Strokes': ['Clear (Backhand)', 'Drop Shot (Backhand)', 'Lift (Backhand)', 'Net Drop (Backhand)'],
  'Serve Techniques': ['Low Serve', 'High Serve', 'Flick Serve', 'Drive Serve'],
  'Footwork & Speed': ['6-Corner Footwork', 'Shadow Footwork', 'Pivot & Rotation', 'Recovery Steps'],
};


// Add Player

export const addPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const clubId = user?.clubId;

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID not found in user context.' });
    }

    const {
      firstName, surName, dob, sex, isJunior, parentName, parentPhone, email,
      emergencyContactname, emergencyContactphonenumber, joiningDate,
      paymentStatus, coachName, membershipStatus, level, clubRoles,
      playerType, profileImage
    } = req.body;

    // ✅ Check for existing player
    const existingPlayer = await Player.findOne({
      firstName: firstName.trim(),
      surName: surName.trim(),
      clubId
    });

    if (existingPlayer) {
      return res.status(409).json({
        message: `Player '${firstName} ${surName}' already exists in this club.`
      });
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
      level,
      clubId, // ✅ Directly using clubId from user
      clubRoles,
      playerType,
      profileImage,
    });

    await newPlayer.save();

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

// Delete Player


export const deletePlayerPost = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (deletePlayerPost):', req.user);

  try {
    const user = req.user;
    const { playerId, reason } = req.body;

    if (!playerId) {
      return res.status(400).json({ message: 'Missing playerId' });
    }

    if (user?.role !== 'ClubAdmin' && user?.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deleted = await Player.findByIdAndDelete(playerId);

    if (!deleted) {
      return res.status(404).json({ message: 'Player not found' });
    }

    await logAudit({
      model: 'Player',
      documentId: deleted._id,
      action: 'delete',
      changedBy: user?.fullName || user?.email || 'Unknown',
      role: user?.role || 'Unknown',
      context: `Delete Player${reason ? ` — Reason: ${reason}` : ''}`,
      changes: deleted.toObject(),
    });

    return res.status(200).json({ message: 'Player deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    return res.status(500).json({ message: 'Failed to delete player' });
  }
};



//   GetPlayer


export const getPlayers = async (req: AuthRequest, res: Response) => {
  console.log('🔐 Decoded user (getPlayers):', req.user);
  try {
    const user = req.user;


    console.log('🔐 Decoded user (getPlayers):', user);
    console.log('🔍 Token user:', req.user);


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
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    const playerObj = player.toObject();

    // ✅ Convert skillMatrix (object of objects)
    const skillMatrixPlain: Record<string, Record<string, number>> = {};

    for (const category in player.skillMatrix) {
      const skillMap = player.skillMatrix[category];
      skillMatrixPlain[category] = {};
      for (const skill in skillMap) {
        skillMatrixPlain[category][skill] = skillMap[skill];
      }
    }

    // ✅ Overwrite with latest history, Map or plain object
    const latestHistory = player.skillsHistory?.[player.skillsHistory.length - 1];

    if (latestHistory?.skills instanceof Map) {
      for (const [category, skillMap] of latestHistory.skills.entries()) {
        if (!skillMatrixPlain[category]) skillMatrixPlain[category] = {};
        for (const [skill, value] of skillMap.entries()) {
          skillMatrixPlain[category][skill] = value;
        }
      }
    } else if (typeof latestHistory?.skills === 'object') {
      for (const [category, skillMap] of Object.entries(latestHistory.skills)) {
        if (!skillMatrixPlain[category]) skillMatrixPlain[category] = {};
        for (const [skill, value] of Object.entries(skillMap)) {
          skillMatrixPlain[category][skill] = value;
        }
      }
    }

    // ✅ Add skillMatrix and clubName to response object
    (playerObj as any).skillMatrix = skillMatrixPlain;
    (playerObj as any).clubName = req.user?.clubName || '';

    return res.json(playerObj);
  } catch (err) {
    console.error('❌ getPlayerById error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};






// Check for Duplicate player by first Name and Surname

  export const checkDuplicatePlayer = async (req: Request, res: Response) => {
    console.log('✅ /check-duplicate endpoint hit');
  console.log('🔐 Headers:', req.headers);
  console.log('📦 Query params:', req.query);
  try {
    const { firstName, surName, clubId } = req.query;
    console.log('🔍 Duplicate check request:', { firstName, surName, clubId });

    if (!firstName || !surName || !clubId) {
      console.warn('⚠️ Missing required parameters:', { firstName, surName, clubId });
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const existingPlayer = await Player.findOne({
      firstName: { $regex: `^${firstName}$`, $options: 'i' },
      surName: { $regex: `^${surName}$`, $options: 'i' },
      clubId
    });

    console.log('✅ Duplicate check result →', !!existingPlayer);
    return res.json({ exists: !!existingPlayer });

  } catch (err) {
    console.error('❌ Error in checkDuplicatePlayer:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// UpdateSkillMatrix

{/*

export const updateSkillMatrix = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { skillMatrix } = req.body;
    const user = req.user;

    console.log('📤 updateSkillMatrix - SkillMatrix received:', skillMatrix);

    if (!user || ['Parent', 'Tournament Organiser'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const player = await Player.findById(id);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    if (!skillMatrix || typeof skillMatrix !== 'object') {
      return res.status(400).json({ message: 'Invalid skillMatrix payload' });
    }

    const updatedBy = player.coachName || user.fullName || user.clubName || 'Unknown';
    const today = new Date().toISOString().split('T')[0];

    const changedSkills: Record<string, Record<string, number>> = {};

    for (const category in skillMatrix) {
      const newSkills = skillMatrix[category];
      for (const skill in newSkills) {
        const newValue = newSkills[skill];
        const currentValue = player.skillMatrix?.[category]?.[skill] ?? null;

        if (newValue !== currentValue) {
          if (!changedSkills[category]) changedSkills[category] = {};
          changedSkills[category][skill] = newValue;
        }
      }
    }

    if (Object.keys(changedSkills).length === 0) {
      return res.status(200).json({ message: 'No changes detected in skill matrix' });
    }

    // ✅ Merge new values into skillMatrix
    const updatedSkillMatrix = { ...player.skillMatrix };

    for (const category in changedSkills) {
      if (!updatedSkillMatrix[category]) updatedSkillMatrix[category] = {};
      for (const skill in changedSkills[category]) {
        updatedSkillMatrix[category][skill] = changedSkills[category][skill];
      }
    }

    // ✅ Save updated skillMatrix
    player.skillMatrix = updatedSkillMatrix;

    // ✅ Save skill change history
    const skillsMap = new Map<string, Map<string, number>>();
for (const category in changedSkills) {
  const innerMap = new Map<string, number>();
  for (const skill in changedSkills[category]) {
    innerMap.set(skill, changedSkills[category][skill]);
  }
  skillsMap.set(category, innerMap);
}

// 🔁 Convert Map → Record<string, Record<string, number>>
const plainChangedSkills: Record<string, Record<string, number>> = {};
for (const [group, skillMap] of skillsMap.entries()) {
  plainChangedSkills[group] = Object.fromEntries(skillMap.entries());
}

player.skillsHistory.push({
  updatedBy,
  date: today,
  skills: plainChangedSkills,
});



    // ✅ Compute group averages
    const newAverages: Record<string, number> = {};
    for (const group in skillGroups) {
      const skills = skillGroups[group];
      const values = skills
        .map(skill => updatedSkillMatrix[group]?.[skill])
        .filter((v): v is number => v !== undefined);

      if (values.length) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        newAverages[group] = parseFloat(avg.toFixed(2));
      }
    }

    if (!player.skillGroupAverages) player.skillGroupAverages = [];

    const existing = player.skillGroupAverages.find(entry => entry.date === today);
    if (existing) {
      existing.groupAverages = {
        ...existing.groupAverages,
        ...newAverages,
      };
    } else {
      player.skillGroupAverages.push({
        date: today,
        groupAverages: newAverages,
      });
    }
    console.log('📦 Final skillsHistory before save:', player.skillsHistory);
    console.log('📦 Final skillMatrix before save:', player.skillMatrix);
    console.log('📦 Final skillGroupAverages before save:', player.skillGroupAverages);
    
    // ✅ Save changes
    await player.save();
    const reloaded = await Player.findById(player._id);
console.log('🔁 Reloaded Player skillsHistory:', reloaded?.skillsHistory);

    // ✅ Log
    await logAudit({
      model: 'Player',
      documentId: player._id,
      action: 'update',
      changedBy: user.fullName || user.email || 'Unknown',
      role: user.role || 'Unknown',
      context: 'Update Skill Matrix',
      changes: changedSkills,
    });

    res.status(200).json({ message: '✅ Skill matrix updated successfully', player });
  } catch (error) {
    console.error('❌ Error updating skill matrix:', error);
    res.status(500).json({ message: 'Server error updating skill matrix' });
  }
};

*/}


export const updateSkillMatrix = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { skillMatrix } = req.body;
    const user = req.user;

    console.log('📤 updateSkillMatrix - SkillMatrix received:', skillMatrix);

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

    // 🧠 Merge skillMatrix and latest skillsHistory to get effective latestSkillMatrix
    const latestSkillMatrix: Record<string, Record<string, number>> = {};

    // From existing skillMatrix
    if (player.skillMatrix) {
      for (const group in player.skillMatrix) {
        latestSkillMatrix[group] = { ...player.skillMatrix[group] };
      }
    }

    // Overwrite with latest from history (if available)
    const latestHistory = player.skillsHistory?.[player.skillsHistory.length - 1];
    if (latestHistory?.skills) {
      for (const group in latestHistory.skills) {
        if (!latestSkillMatrix[group]) latestSkillMatrix[group] = {};
        for (const skill in latestHistory.skills[group]) {
          latestSkillMatrix[group][skill] = latestHistory.skills[group][skill];
        }
      }
    }

    // 🧠 Detect changed values (even if decremented)
    const changedSkills: Record<string, Record<string, number>> = {};
    for (const group in skillMatrix) {
      for (const skill in skillMatrix[group]) {
        const newVal = skillMatrix[group][skill];
        const oldVal = latestSkillMatrix[group]?.[skill] ?? null;
        if (newVal !== oldVal) {
          if (!changedSkills[group]) changedSkills[group] = {};
          changedSkills[group][skill] = newVal;
        }
      }
    }

    if (Object.keys(changedSkills).length === 0) {
      return res.status(200).json({ message: 'No changes detected in skill matrix' });
    }

    // 🧠 Update the skillMatrix with changes
    const updatedSkillMatrix: Record<string, Record<string, number>> = JSON.parse(JSON.stringify(latestSkillMatrix));
    for (const group in changedSkills) {
      if (!updatedSkillMatrix[group]) updatedSkillMatrix[group] = {};
      for (const skill in changedSkills[group]) {
        updatedSkillMatrix[group][skill] = changedSkills[group][skill];
      }
    }

    player.skillMatrix = updatedSkillMatrix;

    // 📜 Append to history
    player.skillsHistory.push({
      updatedBy,
      date: today,
      skills: changedSkills, // ✅ Must be plain object, not Map
    });

    // 📊 Update skillGroupAverages
    const newAverages: Record<string, number> = {};
    for (const group in skillGroups) {
      const values = skillGroups[group]
        .map(skill => updatedSkillMatrix[group]?.[skill])
        .filter((v): v is number => v !== undefined);

      if (values.length) {
        newAverages[group] = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
      }
    }

    if (!player.skillGroupAverages) player.skillGroupAverages = [];

    const existingEntry = player.skillGroupAverages.find(entry => entry.date === today);
    if (existingEntry) {
      existingEntry.groupAverages = { ...existingEntry.groupAverages, ...newAverages };
    } else {
      player.skillGroupAverages.push({ date: today, groupAverages: newAverages });
    }

    await player.save();

    await logAudit({
      model: 'Player',
      documentId: player._id,
      action: 'update',
      changedBy: updatedBy,
      role: user.role || 'Unknown',
      context: 'Update Skill Matrix',
      changes: changedSkills,
    });

    return res.status(200).json({ message: '✅ Skill matrix updated successfully', player });
  } catch (err) {
    console.error('❌ Error updating skill matrix:', err);
    return res.status(500).json({ message: 'Server error updating skill matrix' });
  }
};








// GET /api/players/:id/skill-history
export const getSkillHistory = async (req: Request, res: Response) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: 'Player not found' });

  return res.json({ history: player.skillsHistory });
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
    .select('firstName surName profilePicUrl playerType coachName clubRoles')

      .sort({ firstName: 1, surName: 1 });

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

    // 🔍 Get clubId from clubName
    const club = await Club.findOne({ name: req.user?.clubName });
    if (!club) {
      return res.status(404).json({ error: `Club '${req.user?.clubName}' not found` });
    }

    let upsertedCount = 0;

    // ⏫ Loop through attendance entries and upsert
    for (const entry of attendance) {
      const filter = {
        playerId: entry.playerId,
        date: entry.date,
        clubId: club._id,
      };

      const update = {
        $set: {
          day: entry.day,
          type: entry.type,
          status: entry.status,
          markedBy,
          clubId: club._id,
        }
      };

      const result = await Attendance.updateOne(filter, update, { upsert: true });
      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        upsertedCount++;
      }
    }

    return res.status(200).json({
      message: `✅ Attendance updated for ${upsertedCount} player(s)`,
    });
  } catch (error) {
    console.error('🔥 Error upserting attendance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};





// GET /api/player/attendances?date=YYYY-MM-DD&clubId=xxxxx
export const getPlayersWithAttendance = async (req: AuthRequest, res: Response) => {

  console.log('📥 /api/player/attendances endpoint hit');
console.log('➡️ Query params:', req.query);
  try {
    const { date, clubId } = req.query;
   


    if (!date || !clubId) {
      return res.status(400).json({ error: 'Missing required parameters: date or clubId' });
    }

    const attendanceRecords = await Attendance.find({
      date,
      status: 'Present',
      clubId,
    }).populate('playerId');

    const players = attendanceRecords
      .filter((entry) => entry.playerId)
      .map((entry) => {
        const player = entry.playerId as any;
        return {
          id: player._id,
          name: `${player.firstName} ${player.surName}`,
          gender: player.sex,
          status: entry.status, 
        };
      });

    res.status(200).json(players);
  } catch (error) {
    console.error('🔥 Error fetching attendance players:', error);
    res.status(500).json({ error: 'Failed to fetch attendance players' });
  }
};


//  
export const getAttendanceByDate = async (req: Request, res: Response) => {
  const { clubId, date } = req.query;

  console.log('📥 Incoming GET /players/attendance request:', { clubId, date });

  if (!clubId || !date) {
    console.warn('⚠️ Missing clubId or date');
    return res.status(400).json({ error: 'Missing clubId or date' });
  }

  try {
    const records = await Attendance.find({ clubId, date });
    console.log(`✅ Found ${records.length} attendance records for ${date}`);
    res.json(records);
  } catch (err) {
    console.error('❌ Error retrieving attendance:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// PUT /api/players/:id/comments
export const updateCoachComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const player = await Player.findByIdAndUpdate(
      id,
      { $set: { coachComment: comment } },
      { new: true }
    );

    if (!player) return res.status(404).json({ message: 'Player not found' });

    res.status(200).json({ message: 'Coach comment updated', player });
  } catch (err) {
    console.error('❌ Error updating comment:', err);
    res.status(500).json({ message: 'Server error saving comment' });
  }
};


// GET /api/players/:id/comment
export const getCoachComment = async (req: AuthRequest, res: Response) => {
  try {
    const player = await Player.findById(req.params.id).select('coachComment');
    if (!player) return res.status(404).json({ message: 'Player not found' });

    res.status(200).json({ coachComment: player.coachComment || '' });
  } catch (error) {
    console.error('❌ Error fetching coach comment:', error);
    res.status(500).json({ message: 'Server error fetching coach comment' });
  }
};

