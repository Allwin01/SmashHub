import { Request, Response } from 'express';
import { Types } from 'mongoose';

import SkillTemplate from '../control/models/skillTemplate';
import Player from '../control/models/Player';
import { AuthRequest } from '../types/AuthRequest';

// =========================
// Types
// =========================
export type SliderType = '1-10' | 'emoji' | 'label';

type SkillGroup = { groupName: string; skills: string[] };

interface SkillTemplateDoc {
  _id: Types.ObjectId;
  name: string;
  clubId: Types.ObjectId | null;
  category?: string;
  sliderType?: SliderType;
  isDefaultForClub: boolean;
  groups?: Record<string, string[]> | SkillGroup[]; // tolerate both shapes
  skillGroups?: SkillGroup[]; // legacy
  lastSyncedAt?: Date | null;
}

interface PlayerLean {
  _id: Types.ObjectId;
  clubId: Types.ObjectId;
  skillTracking?: boolean;
  skillMatrix?: any;
  skillScores?: Record<string, number>;
}

// =========================
// Helpers (single source of truth)
// =========================
/** Normalize groups (record OR array OR undefined) -> record { [group]: string[] } */
function normalizeGroupsToRecord(g: unknown): Record<string, string[]> {
  if (!g) return {};
  if (Array.isArray(g)) {
    const out: Record<string, string[]> = {};
    (g as any[]).forEach((x) => {
      const name = (x?.groupName || x?.name || '').trim();
      if (!name) return;
      let skills: string[] = [];
      if (Array.isArray(x?.skills)) {
        skills = (x.skills as any[])
          .map((s: any) => String(s).trim())
          .filter(Boolean) as string[];
      }
      out[name] = skills;
    });
    return out;
  }
  if (typeof g === 'object') {
    const out: Record<string, string[]> = {};
    Object.entries(g as Record<string, any>).forEach(([k, v]) => {
      const name = String(k).trim();
      if (!name) return;
      const skills = Array.isArray(v)
        ? (v as any[]).map((s: any) => String(s).trim()).filter(Boolean)
        : v && typeof v === 'object'
        ? Object.keys(v as Record<string, any>)
        : [];
      out[name] = skills;
    });
    return out;
  }
  return {};
}

/** Record {Group:[s]} -> matrix {Group:{s:1}} */
function recordToMatrix(rec: Record<string, string[]>): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  Object.entries(rec).forEach(([group, skills]) => {
    const bucket: Record<string, number> = {};
    (skills || []).forEach((s) => (bucket[s] = 1));
    matrix[group] = bucket;
  });
  return matrix;
}

/** Record {Group:[s]} -> array [{groupName,skills}] (for legacy consumers) */
function recordToArray(rec: Record<string, string[]>): SkillGroup[] {
  return Object.entries(rec).map(([groupName, skills]) => ({ groupName, skills: skills || [] }));
}

/** Extract groups from request body that may contain either `groups` or `skillGroups` */
function extractGroupsFromBody(body: any): Record<string, string[]> {
  // Prefer `groups` if provided; else fallback to `skillGroups`
  if (body && body.groups !== undefined) return normalizeGroupsToRecord(body.groups);
  if (body && body.skillGroups !== undefined) return normalizeGroupsToRecord(body.skillGroups);
  return {};
}

// =========================
// Controllers
// =========================

// GET /api/skillTemplate/:clubId
export const getSkillTemplate = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    const clubObjId = new Types.ObjectId(String(clubId));

    // Only return:
    // 1) This club's own templates, and
    // 2) The single system default (clubId: null, isDefaultForClub: true)
    const templates = await SkillTemplate.find({
      $or: [
        { clubId: clubObjId },
        { clubId: null, isDefaultForClub: true },
      ],
    })
      .sort({ clubId: 1, name: 1 })
      .lean<SkillTemplateDoc[]>();

    // Ensure all documents expose a `groups` field in the response
    const shaped = (templates || []).map((t) => ({
      ...t,
      groups: t.groups ?? t.skillGroups ?? [],
    }));

    res.json(shaped);
  } catch (err) {
    console.error('Error fetching skill templates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// PUT /api/skillTemplate/:clubId  (create or update)
export const updateSkillTemplate = async (req: AuthRequest, res: Response) => {
  const tag = '🛠️ [updateSkillTemplate]';
  try {
    const { clubId } = req.params;
    const { name, sliderType, category, templateId } = req.body as {
      name: string;
      sliderType?: SliderType;
      category?: string;
      templateId?: string;
    };

    // Raw diagnostics
    console.log(tag, 'params:', req.params);
    console.log(tag, 'raw body keys:', Object.keys(req.body || {}));
    console.log(tag, 'templateId:', templateId, 'clubId:', clubId);

    // Canonical groups shape (accept `groups` or legacy `skillGroups`)
    const groupsRec = extractGroupsFromBody(req.body);
    const groupsCount = Object.keys(groupsRec).length;
    const skillsCount = Object.values(groupsRec).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
    console.log(tag, 'normalized groups -> groupsCount:', groupsCount, 'skillsCount:', skillsCount);

    const userId = (req.user as any)?._id;

    if (!name || !name.trim()) {
      console.warn(tag, 'missing name');
      return res.status(400).json({ message: 'Template name is required' });
    }

    let template: SkillTemplateDoc | null = null;

    if (templateId) {
      console.log(tag, 'mode: UPDATE');
      // Prevent edits to the system default on the server side
      const existing = await SkillTemplate.findById(templateId).lean<SkillTemplateDoc | null>();
      if (!existing) {
        console.warn(tag, 'update target not found:', templateId);
        return res.status(404).json({ message: 'Template not found' });
      }
      if (!existing.clubId) {
        console.warn(tag, 'attempted to edit system default; rejecting');
        return res.status(403).json({
          message: 'System default is read-only. Clone it to customise your club.',
        });
      }

      template = await SkillTemplate.findByIdAndUpdate(
        templateId,
        {
          name: name.trim(),
          clubId,                                    // mongoose will cast to ObjectId
          sliderType: sliderType ?? '1-10',
          category: category ?? 'Uncategorized',
          groups: groupsRec,                         // canonical record
          skillGroups: recordToArray(groupsRec),     // legacy/back-compat array
          updatedAt: new Date(),
        },
        { new: true }
      ).lean<SkillTemplateDoc | null>();
    } else {
      console.log(tag, 'mode: CREATE');
      // Create new club template
      template = await (SkillTemplate as any).create({
        name: name.trim(),
        clubId,
        sliderType: sliderType ?? '1-10',
        category: category ?? 'Uncategorized',
        groups: groupsRec,
        skillGroups: recordToArray(groupsRec),
        createdBy: userId,
      });
    }

    // Post-save summary
    console.log(tag, 'saved =>', {
      _id: (template as any)?._id,
      name: (template as any)?.name,
      clubId: (template as any)?.clubId,
      isDefaultForClub: (template as any)?.isDefaultForClub,
      groupsCount,
      skillsCount,
    });

    return res.json(template);
  } catch (err: any) {
    console.error('❌', tag, err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/skillTemplate/prepare-sync (preview)
export const prepareSyncPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, clubId } = req.body as { templateId?: string; clubId?: string };

    const template = await SkillTemplate.findById(templateId).lean<SkillTemplateDoc | null>();
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const affectedPlayers = await Player.countDocuments({ clubId, skillTracking: true });

    res.json({ affectedPlayers });
  } catch (err) {
    console.error('Error in prepareSyncPreview:', err);
    res.status(500).json({ message: 'Server error during preview' });
  }
};

// POST /api/skillTemplate/sync-players
export const syncTemplateToPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, clubId } = req.body as { templateId?: string; clubId?: string };

    console.log('🔧 syncTemplateToPlayers body:', { templateId, clubId });

    if (!templateId || !clubId) {
      return res.status(400).json({ message: 'templateId and clubId are required' });
    }

    const tpl = await SkillTemplate.findById(templateId).lean<SkillTemplateDoc | null>();
    if (!tpl) return res.status(404).json({ message: 'Template not found' });

    // Normalize groups once
    const groupsRec = normalizeGroupsToRecord(tpl.groups ?? tpl.skillGroups ?? []);
    if (!Object.keys(groupsRec).length) {
      return res.status(400).json({ message: 'Template has no groups to sync' });
    }

    const clubObjId = new Types.ObjectId(String(clubId));
    const isSystemDefault = !tpl.clubId; // clubId === null => global system default

    // Security/ownership rule: custom club templates cannot be applied to other clubs
    if (!isSystemDefault && String(tpl.clubId) !== String(clubObjId)) {
      return res.status(403).json({ message: 'Cannot apply another club\'s custom template. Clone the system default or create a club template.' });
    }

    // Compute scores & matrix
    const allowedSkills = new Set<string>(Object.values(groupsRec).flatMap((arr) => arr));
    const DEFAULT_SCORE = 1;
    const skillMatrix = recordToMatrix(groupsRec);

    // Update all skill-tracking players in this club
    const players = await Player.find({ clubId: clubObjId, skillTracking: true }).lean<PlayerLean[]>();
    console.log(`👥 Players to sync: ${players.length}`);

    const ops = players.map((p) => {
      const prevScores = p.skillScores ?? {};
      const nextScores: Record<string, number> = {};
      allowedSkills.forEach((s) => (nextScores[s] = prevScores[s] ?? DEFAULT_SCORE));

      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              skillMatrix,
              skillScores: nextScores,
              skillMatrixTemplateId: tpl._id, // always reference the original template
            },
          },
        },
      };
    });

    if (ops.length) await (Player as any).bulkWrite(ops);

    // === Default handling ===
    if (isSystemDefault) {
      // Do NOT clone the system default. Just clear any existing club defaults.
      await SkillTemplate.updateMany(
        { clubId: clubObjId, isDefaultForClub: true },
        { $set: { isDefaultForClub: false } }
      );

      return res.json({
        ok: true,
        templateId: String(tpl._id),
        affectedPlayers: ops.length,
        message: 'Applied system default to players (no club-level clone created).',
      });
    }

    // Belongs to this club: mark as the club default and stamp lastSyncedAt
    await SkillTemplate.updateMany(
      { clubId: clubObjId, _id: { $ne: tpl._id } },
      { $set: { isDefaultForClub: false } }
    );

    await SkillTemplate.updateOne(
      { _id: tpl._id },
      {
        $set: {
          isDefaultForClub: true,
          groups: groupsRec,
          skillGroups: recordToArray(groupsRec),
          lastSyncedAt: new Date(),
        },
      }
    );

    return res.json({
      ok: true,
      templateId: String(tpl._id),
      affectedPlayers: ops.length,
      message: 'Applied club template to players and set as club default.',
    });
  } catch (err: any) {
    console.error('❌ Sync error:', err?.message || err);
    return res.status(500).json({ message: 'Server error during sync' });
  }
};

// GET /api/skill-templates/active?clubId=...
export async function getActiveTemplateForClub(req: Request, res: Response) {
  try {
    const clubIdRaw = (req.query.clubId as string) || '';
    if (!clubIdRaw) return res.status(400).json({ code: 'MISSING_CLUB_ID', message: 'clubId is required.' });

    const clubId = new Types.ObjectId(clubIdRaw);

    // 1) Try club default
    let tpl = await SkillTemplate.findOne({ clubId, isDefaultForClub: true })
      .lean<SkillTemplateDoc | null>()
      .exec();

    // 2) Fallback to system default (clubId === null)
    if (!tpl) {
      tpl = await SkillTemplate.findOne({ clubId: null, isDefaultForClub: true })
        .lean<SkillTemplateDoc | null>()
        .exec();

      if (!tpl) {
        return res.status(404).json({
          code: 'NO_DEFAULT_TEMPLATE',
          message: 'No system default template is configured.',
        });
      }
    }

    const groupsRec = normalizeGroupsToRecord(tpl.groups ?? tpl.skillGroups ?? []);

    return res.json({
      _id: tpl._id,
      name: tpl.name,
      clubId: tpl.clubId,
      isDefaultForClub: !!tpl.isDefaultForClub,
      groups: groupsRec, // always a record for the client
    });
  } catch (err) {
    console.error('getActiveTemplateForClub error:', err);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Failed to load active template.' });
  }
}


{/*}
import { Request, Response } from 'express';
import { Types } from 'mongoose';

import SkillTemplate from '../control/models/skillTemplate';
import Player from '../control/models/Player';
import { AuthRequest } from '../types/AuthRequest';

// =========================
// Types
// =========================
export type SliderType = '1-10' | 'emoji' | 'label';

type SkillGroup = { groupName: string; skills: string[] };

interface SkillTemplateDoc {
  _id: Types.ObjectId;
  name: string;
  clubId: Types.ObjectId | null;
  category?: string;
  sliderType?: SliderType;
  isDefaultForClub: boolean;
  groups?: Record<string, string[]> | SkillGroup[]; // tolerate both shapes
  skillGroups?: SkillGroup[]; // legacy
  lastSyncedAt?: Date | null;
}

interface PlayerLean {
  _id: Types.ObjectId;
  clubId: Types.ObjectId;
  skillTracking?: boolean;
  skillMatrix?: any;
  skillScores?: Record<string, number>;
}

// =========================
// Helpers (single source of truth)
// =========================
/** Normalize groups (record OR array OR undefined) -> record { [group]: string[] } *
function normalizeGroupsToRecord(g: unknown): Record<string, string[]> {
  if (!g) return {};
  if (Array.isArray(g)) {
    const out: Record<string, string[]> = {};
    (g as any[]).forEach((x) => {
      const name = (x?.groupName || x?.name || '').trim();
      if (!name) return;
      let skills: string[] = [];
      if (Array.isArray(x?.skills)) {
        skills = (x.skills as any[])
          .map((s: any) => String(s).trim())
          .filter(Boolean) as string[];
      }
      out[name] = skills;
    });
    return out;
  }
  if (typeof g === 'object') {
    const out: Record<string, string[]> = {};
    Object.entries(g as Record<string, any>).forEach(([k, v]) => {
      const name = String(k).trim();
      if (!name) return;
      const skills = Array.isArray(v)
        ? (v as any[]).map((s: any) => String(s).trim()).filter(Boolean)
        : v && typeof v === 'object'
        ? Object.keys(v as Record<string, any>)
        : [];
      out[name] = skills;
    });
    return out;
  }
  return {};
}

/** Record {Group:[s]} -> matrix {Group:{s:1}} *
function recordToMatrix(rec: Record<string, string[]>): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  Object.entries(rec).forEach(([group, skills]) => {
    const bucket: Record<string, number> = {};
    (skills || []).forEach((s) => (bucket[s] = 1));
    matrix[group] = bucket;
  });
  return matrix;
}

/** Record {Group:[s]} -> array [{groupName,skills}] (for legacy consumers) *
function recordToArray(rec: Record<string, string[]>): SkillGroup[] {
  return Object.entries(rec).map(([groupName, skills]) => ({ groupName, skills: skills || [] }));
}

/** Extract groups from request body that may contain either `groups` or `skillGroups` *
function extractGroupsFromBody(body: any): Record<string, string[]> {
  // Prefer `groups` if provided; else fallback to `skillGroups`
  if (body && body.groups !== undefined) return normalizeGroupsToRecord(body.groups);
  if (body && body.skillGroups !== undefined) return normalizeGroupsToRecord(body.skillGroups);
  return {};
}

// =========================
// Controllers
// =========================

// GET /api/skillTemplate/:clubId
export const getSkillTemplate = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    const clubObjId = new Types.ObjectId(String(clubId)); // cast once

    const templates = await SkillTemplate.find({
      $or: [{ clubId: clubObjId }, { clubId: null }],      // include global default
    })
      .sort({ clubId: 1, name: 1 })
      .lean<SkillTemplateDoc[]>();

    const shaped = (templates || []).map((t) => ({
      ...t,
      groups: t.groups ?? t.skillGroups ?? [],
    }));

    res.json(shaped);
  } catch (err) {
    console.error('Error fetching skill templates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// PUT /api/skillTemplate/:clubId  (create or update)
export const updateSkillTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const { name, sliderType, category, templateId } = req.body as {
      name: string;
      sliderType?: SliderType;
      category?: string;
      templateId?: string;
    };

    // Canonical groups shape (accept `groups` or legacy `skillGroups`)
    const groupsRec = extractGroupsFromBody(req.body);
    const userId = (req.user as any)?._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    let template: SkillTemplateDoc | null = null;

    if (templateId) {
      // Prevent edits to the system default on the server side
      const existing = await SkillTemplate.findById(templateId).lean<SkillTemplateDoc | null>();
      if (!existing) return res.status(404).json({ message: 'Template not found' });
      if (!existing.clubId) {
        return res.status(403).json({
          message: 'System default is read-only. Clone it to customise your club.',
        });
      }

      template = await SkillTemplate.findByIdAndUpdate(
        templateId,
        {
          name: name.trim(),
          clubId,                                    // mongoose will cast to ObjectId
          sliderType: sliderType ?? '1-10',
          category: category ?? 'Uncategorized',
          groups: groupsRec,                         // canonical record
          skillGroups: recordToArray(groupsRec),     // legacy/back-compat array
          updatedAt: new Date(),
        },
        { new: true }
      ).lean<SkillTemplateDoc | null>();
    } else {
      // Create new club template
      template = await (SkillTemplate as any).create({
        name: name.trim(),
        clubId,
        sliderType: sliderType ?? '1-10',
        category: category ?? 'Uncategorized',
        groups: groupsRec,
        skillGroups: recordToArray(groupsRec),
        createdBy: userId,
      });
    }

    return res.json(template);
  } catch (err) {
    console.error('Error saving skill template:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/skillTemplate/prepare-sync (preview)
export const prepareSyncPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, clubId } = req.body as { templateId?: string; clubId?: string };

    const template = await SkillTemplate.findById(templateId).lean<SkillTemplateDoc | null>();
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const affectedPlayers = await Player.countDocuments({ clubId, skillTracking: true });

    res.json({ affectedPlayers });
  } catch (err) {
    console.error('Error in prepareSyncPreview:', err);
    res.status(500).json({ message: 'Server error during preview' });
  }
};

// POST /api/skillTemplate/sync-players
export const syncTemplateToPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, clubId } = req.body as { templateId?: string; clubId?: string };

    console.log('🔧 syncTemplateToPlayers body:', { templateId, clubId });

    if (!templateId || !clubId) {
      return res.status(400).json({ message: 'templateId and clubId are required' });
    }

    const tpl = await SkillTemplate.findById(templateId).lean<SkillTemplateDoc | null>();
    if (!tpl) return res.status(404).json({ message: 'Template not found' });

    // Normalize groups once
    const groupsRec = normalizeGroupsToRecord(tpl.groups ?? tpl.skillGroups ?? []);
    if (!Object.keys(groupsRec).length) {
      return res.status(400).json({ message: 'Template has no groups to sync' });
    }

    const clubObjId = new Types.ObjectId(String(clubId));
    const isSystemDefault = !tpl.clubId; // clubId === null => global system default

    // Security/ownership rule: custom club templates cannot be applied to other clubs
    if (!isSystemDefault && String(tpl.clubId) !== String(clubObjId)) {
      return res.status(403).json({ message: 'Cannot apply another club\'s custom template. Clone the system default or create a club template.' });
    }

    // Compute scores & matrix
    const allowedSkills = new Set<string>(Object.values(groupsRec).flatMap((arr) => arr));
    const DEFAULT_SCORE = 1;
    const skillMatrix = recordToMatrix(groupsRec);

    // Update all skill-tracking players in this club
    const players = await Player.find({ clubId: clubObjId, skillTracking: true }).lean<PlayerLean[]>();
    console.log(`👥 Players to sync: ${players.length}`);

    const ops = players.map((p) => {
      const prevScores = p.skillScores ?? {};
      const nextScores: Record<string, number> = {};
      allowedSkills.forEach((s) => (nextScores[s] = prevScores[s] ?? DEFAULT_SCORE));

      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              skillMatrix,
              skillScores: nextScores,
              skillMatrixTemplateId: tpl._id, // always reference the original template
            },
          },
        },
      };
    });

    if (ops.length) await (Player as any).bulkWrite(ops);

    // === Default handling ===
    if (isSystemDefault) {
      // Do NOT clone the system default. Just clear any existing club defaults.
      await SkillTemplate.updateMany(
        { clubId: clubObjId, isDefaultForClub: true },
        { $set: { isDefaultForClub: false } }
      );

      return res.json({
        ok: true,
        templateId: String(tpl._id),
        affectedPlayers: ops.length,
        message: 'Applied system default to players (no club-level clone created).',
      });
    }

    // Belongs to this club: mark as the club default and stamp lastSyncedAt
    await SkillTemplate.updateMany(
      { clubId: clubObjId, _id: { $ne: tpl._id } },
      { $set: { isDefaultForClub: false } }
    );

    await SkillTemplate.updateOne(
      { _id: tpl._id },
      {
        $set: {
          isDefaultForClub: true,
          groups: groupsRec,
          skillGroups: recordToArray(groupsRec),
          lastSyncedAt: new Date(),
        },
      }
    );

    return res.json({
      ok: true,
      templateId: String(tpl._id),
      affectedPlayers: ops.length,
      message: 'Applied club template to players and set as club default.',
    });
  } catch (err: any) {
    console.error('❌ Sync error:', err?.message || err);
    return res.status(500).json({ message: 'Server error during sync' });
  }
};

// GET /api/skill-templates/active?clubId=...
export async function getActiveTemplateForClub(req: Request, res: Response) {
  try {
    const clubIdRaw = (req.query.clubId as string) || '';
    if (!clubIdRaw) return res.status(400).json({ code: 'MISSING_CLUB_ID', message: 'clubId is required.' });

    const clubId = new Types.ObjectId(clubIdRaw);

    // 1) Try club default
    let tpl = await SkillTemplate.findOne({ clubId, isDefaultForClub: true })
      .lean<SkillTemplateDoc | null>()
      .exec();

    // 2) Fallback to system default (clubId === null)
    if (!tpl) {
      tpl = await SkillTemplate.findOne({ clubId: null, isDefaultForClub: true })
        .lean<SkillTemplateDoc | null>()
        .exec();

      if (!tpl) {
        return res.status(404).json({
          code: 'NO_DEFAULT_TEMPLATE',
          message: 'No system default template is configured.',
        });
      }
    }

    const groupsRec = normalizeGroupsToRecord(tpl.groups ?? tpl.skillGroups ?? []);

    return res.json({
      _id: tpl._id,
      name: tpl.name,
      clubId: tpl.clubId,
      isDefaultForClub: !!tpl.isDefaultForClub,
      groups: groupsRec, // always a record for the client
    });
  } catch (err) {
    console.error('getActiveTemplateForClub error:', err);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Failed to load active template.' });
  }
}


*/}