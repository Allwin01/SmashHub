// models/AuditLog.ts
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  model: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  changedBy: { type: String, required: true },
  role: { type: String, required: true },
  context: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
