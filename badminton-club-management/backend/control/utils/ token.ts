

// 📄 utils/token.ts — JWT Token Generation and Verification

import jwt from 'jsonwebtoken';

// ✅ Define JWT Secret and Token Expiry Duration
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret'; // 🔒 Replace in production
const TOKEN_EXPIRY = '7d'; // 🗓️ Adjust as per security policy

// 🎟️ Payload structure for JWT token
interface TokenPayload {
userId: string;
role: string;
}

/**

🔐 Generate a JWT token for a user

@param userId - Unique MongoDB user ID

@param role - User role (e.g., "Parents", "Club Admin")

@returns Signed JWT token string
*/
export function generateToken(userId: string, role: string): string {
return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**

🔍 Verify a JWT token's validity and return decoded data

@param token - JWT token string

@returns Decoded payload (userId, role)

@throws Will throw if token is invalid or expired
*/
export function verifyToken(token: string): TokenPayload {
return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// 🧠 TODO: Support refresh tokens for long sessions

// 🧠 TODO: Move JWT_SECRET to a secure secrets manager in production