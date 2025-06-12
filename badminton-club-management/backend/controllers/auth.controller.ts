/* import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../control/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// ✅ Define type-safe request body for signup
interface SignupRequestBody {
  firstName: string;
  lastName: string;
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

// ✅ Handle user signup
export const signupUser = async (
  req: Request<{}, {}, SignupRequestBody>,
  res: Response
): Promise<Response | void> => {
  try {
    const {
      firstName, lastName, email, password,
      address1, address2, postcode, county, country,
      role: rawRole, clubName, clubAddress, clubCity, selectedClub
    } = req.body;

    const role = rawRole.trim(); // Normalize role input
    console.log(`📝 Signup attempt: ${email}, role: ${role}`);

    // ✅ Check for existing user
    const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // ✅ Hash password
    //const hashedPassword = await bcrypt.hash(password, 10);

    // Proper way to hash during registration
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function registerUser(password, plainTextPassword) {
  const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
  // Store hashedPassword in DB
}

    // ✅ Build user object conditionally
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
     
      password: hashedPassword,
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
    console.log('🔒 Hashed password:', hashedPassword);
    console.log('📤 Saving user:', newUser);
    const savedUser = await newUser.save();
    console.log(`✅ Signup successful: ${email}`);
    return res.status(201).json({ message: 'Signup successful', userId: savedUser._id });
  

  } catch (err) {
    console.error('❌ Signup error:', err);
    return res.status(500).json({ message: 'Signup failed', error: (err as Error).message });
  }
};

// ✅ Handle user login
export const loginUser = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { username, password } = req.body;
    console.log('🔐 Login attempt:', username);

    const user = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i') });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid User' });
    }
    console.log('🔐 Entered password:', password);
    console.log('🧂 Stored hash:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ message: 'Login failed', error: (err as Error).message });
  }
};



++++++++++++======================  */


import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../control/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

interface SignupRequestBody {
firstName: string;
lastName: string;
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
firstName, lastName, email, password,
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
  lastName,
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
export const loginUser = async (req: Request, res: Response): Promise<Response | void> => {
try {
const { email, password } = req.body;
console.log('🔐 Login attempt:', email);


const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
if (!user) {
  console.log('❌ User not found');
  return res.status(401).json({ message: 'Invalid credentials' });
}

console.log('🧂 Stored hash:', user.password);

const isMatch = await bcrypt.compare(password, user.password);
console.log('✅ Match result:', isMatch);

if (!isMatch) {
  return res.status(401).json({ message: 'Invalid credentials' });
}

const token = jwt.sign(
  { userId: user._id.toString(), role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

return res.status(200).json({
  message: 'Login successful',
  token,
  user: {
    id: user._id,
    email: user.email,
    role: user.role
  }
});
} catch (err) {
console.error('❌ Login error:', err);
return res.status(500).json({ message: 'Login failed', error: (err as Error).message });
}
};