

import mongoose, { Types, Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  firstName: string;
  surName: string;
  dob: Date;
  sex: 'Male' | 'Female';
  isJunior: boolean;
  isAdult: boolean;
  parentName?: string;
  parentPhone?: string;
  email: string;
  emergencyContactname: string;
  emergencyContactphonenumber: string;
  joinDate: Date;
  coachName: string;
  paymentStatus: 'Paid' | 'Due' | 'Partial';
  membershipStatus: 'Active' | 'Inactive' | 'Paused' | 'Discontinued' | 'Guest';
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  clubId: Types.ObjectId;
  clubRoles?: string[];
  playerType?: 'Coaching only' | 'Club Member' | 'Coaching and Club Member';
  skillMatrix: Record<string, Record<string, number>>;
  profilePicUrl: { type: String }, // Optional but useful
  skillGroupAverages?: { date: string; groupAverages: Record<string, number> }[];
  skillsHistory: {
    updatedBy: string;
    date: string;
    skills: Record<string, Record<string, number>>;
  }[];
  coachComment?: string;
  matchHistory: {
    matchId: string;
    matchDate: string;
    matchTime: string;
    result: 'Win' | 'Loss';
    matchType: 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
    team: {
      players: string[];
      gender: 'Male' | 'Female';
    };
    opponents: {
      names: string[];
      genders: ('Male' | 'Female')[];
    };
    points: number;
    duration: string;
    courtNo: number;
  };
  matchCount: { type: number, default: 0 };
averagePoints: { type: number, default: 0 }

  
  
}

const PlayerSchema: Schema = new Schema<IPlayer>({
  firstName: { type: String, required: true },
  surName: { type: String, required: true },
  dob: { type: Date, required: true },
  sex: { type: String, enum: ['Male', 'Female'], required: true },
  isJunior: { type: Boolean, required: true },
  isAdult: { type: Boolean, required: true },
  parentName: { type: String },
  parentPhone: { type: String },
  email: { type: String, required: true },
  emergencyContactname: { type: String, required: true },
  emergencyContactphonenumber: { type: String, required: true },
  joinDate: { type: Date, required: true },
  coachName: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Due', 'Partial'],
    default: 'Due'
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Paused', 'Discontinued', 'Guest'],
    default: 'Active'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  clubRoles: [{ type: String }],
  profilePicUrl: { type: String }, // Optional but useful
  playerType: {
    type: String,
    enum: ['Coaching only', 'Club Member', 'Coaching and Club Member']
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  skillMatrix: {
    type: Object,
    default: {},
  },
  skillsHistory: [
    {
      updatedBy: String,
      date: String,
      skills: {
        type: Object, // ✅ Use Object to store plain nested values
      }
    }
  ],
  skillGroupAverages: [
    {
      date: { type: String, required: true },
      groupAverages: {
        type: Object,
        required: true,
        default: {},
      },
    },
  ],
  coachComment: { type: String, default: '' },
  matchHistory: [
    {
      matchId: { type: String, required: true },
      matchDate: { type: String, required: true },       // Format: 'YYYY-MM-DD'
      matchTime: { type: String, required: true },       // Format: 'HH:mm:ss'
      result: { type: String, enum: ['Win', 'Loss'], required: true },
      matchType: { type: String, enum: ['MS', 'WS', 'MD', 'WD', 'XD'], required: true },
      team: {
        players: [{ type: String, required: true }],     // Your name + partner
        gender: { type: String, enum: ['Male', 'Female'], required: true }
      },
      opponents: {
        names: [{ type: String, required: true }],
        genders: [{ type: String, enum: ['Male', 'Female'], required: true }]
      },
      points: { type: Number, required: true },          // Points scored by player's team
      duration: { type: String, required: true },        // e.g., '08:45'
      courtNo: { type: Number, required: true }
    }
  ],
  
  
  matchCount: { type: Number, default: 0 },
averagePoints: { type: Number, default: 0 }

  
  
},
{ timestamps: true });

export default mongoose.model<IPlayer>('Player', PlayerSchema);






