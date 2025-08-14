// models/skillTemplate.model.ts
import mongoose, { Schema } from 'mongoose';

const SkillTemplateSchema = new Schema({
  name: { type: String, required: true },
  clubId: { type: Schema.Types.ObjectId, ref: 'Club', default: null }, // null = system default
  category: { type: String, default: 'Uncategorized' },
  sliderType: { type: String, enum: ['1-10', 'emoji', 'label'], default: '1-10' },
  isDefaultForClub: { type: Boolean, default: false },

  // CANONICAL (fast) representation
  groups: { type: Schema.Types.Mixed, default: {} }, // Record<string, string[]>

  // book-keeping
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastSyncedAt: { type: Date, default: null },
}, { timestamps: true });

// one default per club
SkillTemplateSchema.index(
  { clubId: 1, isDefaultForClub: 1 },
  { unique: true, partialFilterExpression: { isDefaultForClub: true } }
);

// Virtual legacy view (optional)
SkillTemplateSchema.virtual('skillGroups').get(function () {
  const rec = (this as any).groups || {};
  return Object.entries(rec).map(([groupName, skills]) => ({
    groupName,
    skills: Array.isArray(skills) ? skills : [],
  }));
});

// Ensure virtuals are serialized if you rely on them
SkillTemplateSchema.set('toJSON', { virtuals: true });
SkillTemplateSchema.set('toObject', { virtuals: true });

export default mongoose.models.SkillTemplate ||
  mongoose.model('SkillTemplate', SkillTemplateSchema);
