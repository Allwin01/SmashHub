/*
import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  firstName: string;
  lastName: string;
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
  clubId: string;
  clubRoles?: string[];
  playerType?: 'Coaching only' | 'Club Member' | 'Coaching and Club Member';
  skills: Map<string, number>;
  skillMatrix: Map<string, Map<string, number>>;
  skillsHistory: {
    updatedBy: string;
    date: string;
    skills: Map<string, number>;
  }[];
}

const PlayerSchema: Schema = new Schema<IPlayer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
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
  playerType: {
    type: String,
    enum: ['Coaching only', 'Club Member', 'Coaching and Club Member']
  },
  clubId: { type: String, required: true },
  skills: {
    type: Map,
    of: Number,
    default: {}
  },
  skillMatrix: {
    type: Map,
    of: {
      type: Map,
      of: Number
    },
    default: () => new Map([
      ['Movement Phases', new Map([
        ['Split-Step', 1],
        ['Chasse Step', 1],
        ['Lunging', 1],
        ['Jumping', 1]
      ])],
      ['Grips & Grip Positions', new Map([
        ['Basic Grip', 1],
        ['Panhandle', 1],
        ['Bevel', 1],
        ['Thumb Grip', 1],
        ['Grip Adjustment', 1]
      ])],
      ['Forehand Strokes', new Map([
        ['Clear', 1],
        ['Drop Shot', 1],
        ['Smash', 1],
        ['Slice Drop', 1],
        ['Lift (Underarm)', 1],
        ['Net Drop (Underarm)', 1]
      ])],
      ['Backhand Strokes', new Map([
        ['Clear (Backhand)', 1],
        ['Drop Shot (Backhand)', 1],
        ['Lift (Backhand)', 1],
        ['Net Drop (Backhand)', 1]
      ])],
      ['Serve Techniques', new Map([
        ['Low Serve', 1],
        ['High Serve', 1],
        ['Flick Serve', 1],
        ['Drive Serve', 1]
      ])],
      ['Footwork & Speed', new Map([
        ['6-Corner Footwork', 1],
        ['Shadow Footwork', 1],
        ['Pivot & Rotation', 1],
        ['Recovery Steps', 1]
      ])]
    ])
  },
  skillsHistory: [{
    updatedBy: String,
    date: String,
    skills: {
      type: Map,
      of: Number
    }
  }]
}, { timestamps: true });

export default mongoose.model<IPlayer>('Player', PlayerSchema);


*/

import mongoose, { Types, Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  firstName: string;
  surname: string;
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
  skillMatrix: Map<string, Map<string, number>>;
  profilePicUrl: { type: String }, // Optional but useful
  skillsHistory: {
    updatedBy: string;
    date: string;
    skills: Map<string, Map<string, number>>;
  }[];
}

const PlayerSchema: Schema = new Schema<IPlayer>({
  firstName: { type: String, required: true },
  surname: { type: String, required: true },
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
    type: Map,
    of: {
      type: Map,
      of: Number
    },
    default: new Map()
  },
  skillsHistory: [
    {
      updatedBy: { type: String, required: true },
      date: { type: String, required: true },
      skills: {
        type: Map,
        of: {
          type: Map,
          of: Number
        }
      }
    }
  ]
}, { timestamps: true });

export default mongoose.model<IPlayer>('Player', PlayerSchema);






