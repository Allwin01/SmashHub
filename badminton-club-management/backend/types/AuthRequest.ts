// types/AuthRequest.ts
import { Request } from 'express';

export interface AuthPayload {
    userId: string;
    role: string;
    id: string;
  email: string;
  clubId?: string;
  clubName?: string;
  firstName?: string; 
  surname?: string; 
fullName?: string; 
  }
  
 
  
  export interface AuthRequest extends Request {
    user?: AuthPayload;
  }
