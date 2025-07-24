import mongoose from 'mongoose';

const playerRefSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  name: { type: String, required: true },
  sex: { type: String, enum: ['Male', 'Female'], required: true }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  matchDate: { type: String, required: true },        // e.g., '2025-07-21'
  matchTime: { type: String, required: true },        // e.g., '18:30'
  duration: { type: String, required: true },         // e.g., '25m'

  courtNo: { type: Number },
  matchType: { type: String, enum: ['MS', 'WS', 'MD', 'WD', 'XD'], required: true },

  team1: {
    players: [playerRefSchema],                       // 1 or 2 players
    score: { type: String, required: true }           // e.g., '21'
  },
  team2: {
    players: [playerRefSchema],
    score: { type: String, required: true }
  },

  winnerTeam: { type: Number, enum: [1, 2], required: true }, // who won: 1 or 2
  matchId: { type: String, required: true, unique: true }     // custom or UUID
}, { timestamps: true });

export default mongoose.model('Match', matchSchema);
