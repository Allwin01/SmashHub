// models/MatchSummary.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchSummary extends Document {
  date: string; // YYYY-MM-DD
  clubId: string;
  totalMatches: number;
  winners: { playerId: string; wins: number }[];
  topPlayer: string | null;
  topMale: string | null;
  topFemale: string | null;
}

const MatchSummarySchema: Schema = new Schema({
    date: String,
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    totalMatches: Number,
    winners: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        wins: Number
      }
    ],
    topPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    topMale: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    topFemale: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }
});

MatchSummarySchema.index({ date: 1, clubId: 1 }, { unique: true });

const MatchSummary = mongoose.model<IMatchSummary>('MatchSummary', MatchSummarySchema);
export default MatchSummary;
