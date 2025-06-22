// models/Attendance.ts
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  date: { type: String, required: true }, // Store as 'yyyy-MM-dd'
  type: { type: String, enum: ['Club Night', 'Tournament'], required: true },
  status: { type: String, enum: ['Present', 'Absent'], required: true },
});

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
