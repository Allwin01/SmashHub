import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import User from '@/models/User';
import dbConnect from './db';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = '7d';

export async function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export async function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    await dbConnect();
    const decoded = verifyToken(token) as { userId: string; role: string };
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function loginUser(username: string, password: string) {
  await dbConnect();
  const user = await User.findOne({ username });

  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = await generateToken(user._id.toString(), user.role);
  return { user, token };
}

export async function signupUser(userData: any) {
  await dbConnect();
  
  const existingUser = await User.findOne({ 
    $or: [{ email: userData.email }, { username: userData.username }] 
  });

  if (existingUser) {
    throw new Error('User already exists with this email or username');
  }

  const user = new User(userData);
  await user.save();

  const token = await generateToken(user._id.toString(), user.role);
  return { user, token };
}