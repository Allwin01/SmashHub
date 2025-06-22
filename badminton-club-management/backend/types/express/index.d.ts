

import { AuthPayload } from '../../types/AuthRequest';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/*

// types/express/index.d.ts
import { Request } from "express"
import { AuthPayload } from '../../control/middleware' // ✅ Make sure path is correct
import { User } from '../models/user'
import { AuthRequest } from '../types/AuthRequest'; // or wherever it's defined


const handler = (req: AuthRequest, res: Response) => {
  // Now req.user is guaranteed
  const role = req.user.role;
};

/*
declare global {
  namespace Express {
    interface AuthRequest extends Request {
      user: AuthPayload;
    }
    
  }
}

export {};




/*

export {};  

import { User } from "../models/User"; // Adjust import to your user type

declare global {
  namespace Express {
    interface Request {
      user?: User; // Or your custom user type/interface
    }
  }
}

 */
