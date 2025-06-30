
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../control/models/User';
import { AuthRequest } from '../types/AuthRequest';
import { AuditLog } from '../control/models/AuditLog'; // import AuditLog model
import Club from '../control/models/Club';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

interface SignupRequestBody {
  firstName: string;
  surName: string;
  email: string;
  password: string;
  address1: string;
  address2?: string;
  postcode: string;
  county: string;
  country: string;
  role: string;
  clubName?: string;
  clubAddress?: string;
  clubCity?: string;
  selectedClub?: string;
}

// ✅ Signup Controller
export const signupUser = async (
  req: Request<{}, {}, SignupRequestBody>,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      firstName, surName, email, password,
      address1, address2, postcode, county, country,
      role: rawRole, clubName, clubAddress, clubCity, selectedClub
    } = req.body;

    const role = rawRole.trim();
    console.log(`📝 Signup attempt: ${email}, role: ${role}`);

    const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

// ✅ Optional: Create club if it doesn't already exist
if ((role === 'Club Admin' || role === 'Independent Coach') && clubName) {
  const existingClub = await Club.findOne({ name: clubName });
  if (!existingClub) {
    await Club.create({
      name: clubName,
      address: clubAddress,
      city: clubCity,
    });
    console.log(`🏸 New club '${clubName}' created`);
  }
}
    const newUser = new User({
      firstName,
      surName,
      email: email.toLowerCase(),
      password: password,
      address: {
        address1,
        address2,
        postcode,
        county,
        country,
      },
      role,
      ...(role === 'Parents' ? { selectedClub } : {}),
      ...(role === 'Club Admin' || role === 'Independent Coach'
        ? {
            club: {
              name: clubName,
              address: clubAddress,
              city: clubCity,
            },
          }
        : {})
    });

    console.log('📤 Saving user:', newUser);
    const savedUser = await newUser.save();
    console.log(`✅ Signup successful: ${email}`);

    if (process.env.ENABLE_AUDIT_LOG === 'true') {
      await AuditLog.create({
        model: 'User',
        documentId: savedUser._id,
        action: 'create',
        changedBy: `${firstName} ${surName}`,
        role,
        timestamp: new Date(),
        context: 'User Signup',
        changes: {
          email: savedUser.email,
          role: savedUser.role,
          club: savedUser.club || savedUser.selectedClub || null
        }
      });
    }

    return res.status(201).json({ message: 'Signup successful', userId: savedUser._id });
  } catch (err) {
    console.error('❌ Signup error:', err);
    return res.status(500).json({ message: 'Signup failed', error: (err as Error).message });
  }
};


// ✅ Login Controller
export const loginUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);

    const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    

// ✅ Fetch clubId from clubName or selectedClub
const clubName = user.club?.name || user.selectedClub || '';
let clubId = '';



if (clubName) {
  const club = await Club.findOne({ name: clubName });
  if (club) {
    clubId = club._id.toString();  // ✅ Use ObjectId as string
  }
}
console.log('✅ Login response:', clubId);



// ✅ Now generate token with clubName and clubId
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role.replace(/\s/g, ''), // convert "Club Admin" → "ClubAdmin"
        clubName,
        clubId, // ✅ inject real ID
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Generated token:', token);

    if (process.env.ENABLE_AUDIT_LOG === 'true') {
      await AuditLog.create({
        model: 'User',
        documentId: user._id,
        action: 'login',
        changedBy: `${user.firstName} ${user.surName}`,
        role: user.role.replace(/\s/g, ''), // convert "Club Admin" → "ClubAdmin",
        timestamp: new Date(),
        context: 'User Login',
        changes: null
      });
    }
   

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        role: user.role,
        clubName,
        clubId, // ✅ send back to frontend
        email: user.email,
        firstName: user.firstName,
        surname: user.surName
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ message: 'Login failed', error: (err as Error).message });
  }
};


/*
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../control/models/User';
import { AuthRequest } from '../types/AuthRequest';


const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

interface SignupRequestBody {
firstName: string;
surname: string;
email: string;
password: string; 
address1: string;
address2?: string;
postcode: string;
county: string;
country: string;
role: string;
clubName?: string;
clubAddress?: string;
clubCity?: string;
selectedClub?: string;
}

// ✅ Signup Controller
export const signupUser = async (
req: Request<{}, {}, SignupRequestBody>,
res: Response
): Promise<Response | void> => {
try {
const {
firstName, surname, email, password,
address1, address2, postcode, county, country,
role: rawRole, clubName, clubAddress, clubCity, selectedClub
} = req.body;


const role = rawRole.trim();
console.log(`📝 Signup attempt: ${email}, role: ${role}`);

const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
if (existingUser) {
  return res.status(409).json({ message: 'Email already registered' });
}



const newUser = new User({
  firstName,
  surname,
  email: email.toLowerCase(),
  password: password,
  address: {
    address1,
    address2,
    postcode,
    county,
    country,
  },
  role,
  ...(role === 'Parents' ? { selectedClub } : {}),
  ...(role === 'Club Admin' || role === 'Independent Coach'
    ? {
        club: {
          name: clubName,
          address: clubAddress,
          city: clubCity,
        },
      }
    : {})
});

console.log('📤 Saving user:', newUser);
const savedUser = await newUser.save();
console.log(`✅ Signup successful: ${email}`);
return res.status(201).json({ message: 'Signup successful', userId: savedUser._id });
} catch (err) {
console.error('❌ Signup error:', err);
return res.status(500).json({ message: 'Signup failed', error: (err as Error).message });
}
};

// ✅ Login Controller
export const loginUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);

    const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        clubName: user.club?.name || user.selectedClub || '',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Generated token:', token); 

    return res.status(200).json({
      message: 'Login successful',
      token,                 // 🔑 JWT
    user: {
    role: user.role,
    clubName: user.club?.name || user.selectedClub || '',  // 🔄 Include this clearly
    email: user.email,
    firstName: user.firstName,
    surName: user.surName
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ message: 'Login failed', error: (err as Error).message });
  }
};



*/