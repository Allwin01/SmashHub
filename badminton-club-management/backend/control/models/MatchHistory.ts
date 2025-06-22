// models/MatchHistory.ts
import mongoose from 'mongoose';

const matchHistorySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  matchId: { type: String, required: true },
  matchDate: { type: String, required: true },
  matchTime: { type: String, required: true },
  result: { type: String, enum: ['Win', 'Loss'], required: true },
  matchType: { type: String, enum: ['MS', 'WS', 'MD', 'WD', 'MX'], required: true },
  partner: String,
  partnerSex: String,
  opponents: [
    {
      name: String,
      gender: { type: String, enum: ['Male', 'Female'] }
    }
  ],
  points: { type: Number, required: true },
  duration: String,
  courtNo: Number
});

export default mongoose.model('MatchHistory', matchHistorySchema);
