'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// === Types ===
type SliderType = '1-10' | 'emoji' | 'label';

interface SkillGroup {
  groupName: string;
  skills: string[];
}

interface SkillTemplate {
  _id: string;
  name: string;
  sliderType: SliderType;
  category?: string;
  isDefaultForClub: boolean;
  clubId: string | null;
  groups?: Record<string, string[]> | SkillGroup[]; // API may return record or array
  // legacy field (older API). We read it if groups is missing
  skillGroups?: SkillGroup[];
  lastSyncedAt?: string | null;
}

// === Helpers to normalize shapes ===
const toArray = (g: unknown): SkillGroup[] => {
  if (Array.isArray(g)) {
    return (g as any[])
      .map((x) => ({
        groupName: x?.groupName ?? '',
        skills: Array.isArray(x?.skills) ? x.skills.filter(Boolean) : [],
      }))
      .filter((x) => x.groupName);
  }
  if (g && typeof g === 'object') {
    return Object.entries(g as Record<string, any>).map(([k, v]) => ({
      groupName: k,
      skills: Array.isArray(v) ? (v as string[]) : Object.keys(v || {}),
    }));
  }
  return [];
};

const toRecord = (arr: SkillGroup[]): Record<string, string[]> => {
  return (arr || []).reduce((acc, g) => {
    const name = (g?.groupName || '').trim();
    if (!name) return acc;
    acc[name] = (g.skills || []).map((s) => String(s).trim()).filter(Boolean);
    return acc;
  }, {} as Record<string, string[]>);
};

// === Component ===
export default function SkillTemplateManager({ clubId }: { clubId: string }) {
  const [allTemplates, setAllTemplates] = useState<SkillTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [sliderType, setSliderType] = useState<SliderType>('1-10');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [affectedPlayersCount, setAffectedPlayersCount] = useState<number | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const skipUnsavedPrompt = useRef(false);

  // derived
  const selected = useMemo(
    () => allTemplates.find((t) => t._id === selectedTemplateId) || null,
    [allTemplates, selectedTemplateId]
  );
  const isSystemDefault = selected ? selected.clubId === null : false;
  const isCustomClubTemplate = selected ? selected.clubId === clubId : false;

  // ---- Load list ----
  useEffect(() => {
    if (!clubId) return;
    (async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${baseUrl}/api/skillTemplate/${clubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SkillTemplate[] = await res.json();

        // ensure groups present for editor shape
        const normalized = (data || []).map((t) => ({
          ...t,
          groups: t.groups ?? t.skillGroups ?? [],
        }));
        setAllTemplates(normalized);

        // pick club default as active; if none, fall back to lastSyncedAt for badge only
        const clubDefault = normalized.find((t) => t.isDefaultForClub && t.clubId === clubId) || null;
const systemDefault = normalized.find((t) => t.isDefaultForClub && t.clubId === null) || null;
        setActiveTemplateId((clubDefault?._id || systemDefault?._id) || null);

        // auto-select template on first load
        if (!selectedTemplateId) {
          const initial = clubDefault || systemDefault || normalized[0] || null;
          if (initial) loadTemplate(initial, { force: true });
        }
      } catch (e) {
        console.error('fetchTemplates error', e);
        toast.error('Failed to fetch skill templates');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // ---- Loader for one template into the editor ----
  const loadTemplate = (template: SkillTemplate, opts?: { force?: boolean }) => {
    if (unsavedChanges && !opts?.force && !skipUnsavedPrompt.current) {
      const confirmLeave = window.confirm('You have unsaved changes. Discard them?');
      if (!confirmLeave) return;
    }

    setSelectedTemplateId(template._id);
    setTemplateName(template.name || '');
    setCategory(template.category || 'Uncategorized');
    setSliderType((template.sliderType as SliderType) || '1-10');

    // normalize groups -> array for editor
    const groupsArray = toArray(template.groups ?? template.skillGroups ?? []);
    setSkillGroups(groupsArray);

    setEditMode(false);
    setUnsavedChanges(false);
    skipUnsavedPrompt.current = false; // reset one-shot bypass
  };

  // --- Handlers for editing groups/skills ---
  const handleGroupNameChange = (gIndex: number, value: string) => {
    setSkillGroups((prev) => prev.map((g, i) => (i === gIndex ? { ...g, groupName: value } : g)));
    setUnsavedChanges(true);
  };

  const handleSkillChange = (gIndex: number, sIndex: number, value: string) => {
    setSkillGroups((prev) =>
      prev.map((g, i) => (i === gIndex ? { ...g, skills: g.skills.map((s, j) => (j === sIndex ? value : s)) } : g))
    );
    setUnsavedChanges(true);
  };

  const addSkillToGroup = (gIndex: number) => {
    setSkillGroups((prev) => prev.map((g, i) => (i === gIndex ? { ...g, skills: [...g.skills, ''] } : g)));
    setUnsavedChanges(true);
  };

  const removeSkill = (gIndex: number, sIndex: number) => {
    setSkillGroups((prev) =>
      prev.map((g, i) => (i === gIndex ? { ...g, skills: g.skills.filter((_, j) => j !== sIndex) } : g))
    );
    setUnsavedChanges(true);
  };

  const removeGroup = (gIndex: number) => {
    setSkillGroups((prev) => prev.filter((_, i) => i !== gIndex));
    setUnsavedChanges(true);
  };

  const addGroup = () => {
    setSkillGroups((prev) => [...prev, { groupName: '', skills: [] }]);
    setUnsavedChanges(true);
  };

  const handleCloneTemplate = () => {
    if (!selected) return;
    const clone: SkillTemplate = {
      ...selected,
      _id: '', // new
      name: `${selected.name} (Copy)`,
      isDefaultForClub: false,
    };
    // put into editor
    setTemplateName(clone.name);
    setCategory(clone.category || 'Uncategorized');
    setSliderType(clone.sliderType || '1-10');
    setSkillGroups(toArray(clone.groups));
    setSelectedTemplateId('');
    setEditMode(true);
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required.');
      return;
    }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const token = localStorage.getItem('token') || '';
      const payload = {
        name: templateName.trim(),
        category: category || 'Uncategorized',
        sliderType,
        templateId: selectedTemplateId || undefined, // undefined => create
        groups: toRecord(skillGroups),               // server normalizes this
      };
  
      // ✅ PUT (no `/list`)
      const res = await fetch(`${baseUrl}/api/skillTemplate/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      toast.success('Skill template saved');
      setUnsavedChanges(false);
      setEditMode(false);
      skipUnsavedPrompt.current = true;
  
      // ✅ reload list (no `/list`)
      const listRes = await fetch(`${baseUrl}/api/skillTemplate/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const list: SkillTemplate[] = await listRes.json();
  
      const normalized = (list || []).map(t => ({ ...t, groups: (t as any).groups ?? (t as any).skillGroups ?? [] }));
      setAllTemplates(normalized);
  
      const newest = normalized.find(t => t.name === payload.name) || null;
      if (newest) loadTemplate(newest, { force: true });
    } catch (e) {
      console.error('save template error', e);
      toast.error('Failed to save skill template');
    }
  };
  

  // --- Sync to players ---
  const handleConfirmSync = async () => {
    if (!selectedTemplateId) return toast.error('Select a template first');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${baseUrl}/api/skillTemplate/sync-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId: selectedTemplateId, clubId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAffectedPlayersCount(Number(data?.affectedPlayers ?? 0));
      setShowSyncDialog(true);
    } catch (e) {
      console.error('sync preview error', e);
      toast.error('Failed to prepare sync');
    }
  };

  const handleSyncToPlayers = async () => {
    if (!selectedTemplateId) return toast.error('Select a template first');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${baseUrl}/api/skillTemplate/sync-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId: selectedTemplateId, clubId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Template applied to players and set as club default');
      setShowSyncDialog(false);

      // refresh list to update badges/flags
      const listRes = await fetch(`${baseUrl}/api/skillTemplate/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list: SkillTemplate[] = await listRes.json();
      const normalized = (list || []).map((t) => ({ ...t, groups: t.groups ?? t.skillGroups ?? [] }));
      setAllTemplates(normalized);
      const clubDefault = normalized.find((t) => t.isDefaultForClub && t.clubId === clubId) || null;
const systemDefault = normalized.find((t) => t.isDefaultForClub && t.clubId === null) || null;
      setActiveTemplateId((clubDefault?._id || systemDefault?._id) || null);
    } catch (e) {
      console.error('sync players error', e);
      toast.error('Failed to sync players');
    }
  };

  if (loading) return <p className="p-4">Loading skill templates…</p>;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Skill Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Select Template</label>
                <Select
                  value={selectedTemplateId || ''}
                  onValueChange={(id) => {
                    const tpl = allTemplates.find((t) => t._id === id);
                    if (tpl) loadTemplate(tpl);
                  }}
                >
                  <SelectTrigger className="w-full">
                    {selected ? selected.name : 'Select'}
                  </SelectTrigger>
                  <SelectContent>
                    {allTemplates.map((t) => (
                      <SelectItem key={t._id} value={t._id} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span>
                            {t.name}
                            {t.clubId === null ? ' (System Default)' : ''}
                            {t.isDefaultForClub && t.clubId === clubId ? ' (Club Default)' : ''}
                          </span>
                          {activeTemplateId === t._id && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Active
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={handleCloneTemplate} disabled={!selected}>🧬 Clone</Button>
                {!editMode && isCustomClubTemplate && (
                  <Button onClick={() => setEditMode(true)}>✏️ Edit</Button>
                )}
                {editMode && (
                  <Button onClick={handleSave} className="bg-green-600 text-white hover:bg-green-700">💾 Save Template</Button>
                )}
                {!editMode && selected && (
                  <Button
                    onClick={handleConfirmSync}
                    variant={selectedTemplateId === activeTemplateId ? 'default' : 'outline'}
                    title={selectedTemplateId === activeTemplateId ? 'This template is currently applied' : 'Apply this template to all skill-tracking players'}
                  >
                    🔄 {selectedTemplateId === activeTemplateId ? 'Re-sync to Players' : 'Sync to Players'}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block mt-4 mb-1 text-sm font-medium">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setUnsavedChanges(true);
                }}
                disabled={!editMode || isSystemDefault}
              />
            </div>

            {/* Groups editor */}
            {skillGroups.length === 0 ? (
              <div className="text-sm text-muted-foreground">No groups yet. Add one below.</div>
            ) : (
              skillGroups.map((group, gIndex) => (
                <div key={gIndex} className="border p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={group.groupName}
                      onChange={(e) => handleGroupNameChange(gIndex, e.target.value)}
                      placeholder="Group Name"
                      disabled={!editMode || isSystemDefault}
                    />
                    <Button
                      variant="ghost"
                      onClick={() => removeGroup(gIndex)}
                      disabled={!editMode || isSystemDefault}
                    >
                      <Trash2 className="text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {group.skills.map((skill, sIndex) => (
                      <div key={sIndex} className="flex items-center gap-2">
                        <Input
                          value={skill}
                          onChange={(e) => handleSkillChange(gIndex, sIndex, e.target.value)}
                          placeholder="Skill name"
                          disabled={!editMode || isSystemDefault}
                        />
                        <Button
                          variant="ghost"
                          onClick={() => removeSkill(gIndex, sIndex)}
                          disabled={!editMode || isSystemDefault}
                        >
                          <Trash2 className="text-red-500" size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => addSkillToGroup(gIndex)}
                      disabled={!editMode || isSystemDefault}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                    </Button>
                  </div>
                </div>
              ))
            )}

            <Button onClick={addGroup} disabled={!editMode || isSystemDefault}>➕ Add New Group</Button>
          </CardContent>
        </Card>

        {/* Sync dialog */}
        <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Sync</DialogTitle>
            </DialogHeader>
            <p>This will apply the template to all players with skill tracking enabled.</p>
            {affectedPlayersCount !== null && (
              <p className="text-sm text-gray-700">{affectedPlayersCount} player(s) will be affected.</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowSyncDialog(false)}>Cancel</Button>
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSyncToPlayers}>Confirm & Sync</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}



{/*}
// components/SkillTemplateManager.tsx
'use client';

import { useEffect, useState,useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SkillGroup {
  groupName: string;
  skills: string[];
}

interface SkillTemplate {
  _id: string;
  name: string;
  sliderType: string;
  category: string;
  isDefaultForClub: boolean;
  clubId: string | null;
  skillGroups: SkillGroup[];
  lastSyncedAt?: string;
  affectedPlayersCount?: number;
}

export default function SkillTemplateManager({ clubId }: { clubId: string }) {
  const [allTemplates, setAllTemplates] = useState<SkillTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('');
  const [sliderType, setSliderType] = useState<'1-10' | 'emoji' | 'label'>('1-10');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [affectedPlayersCount, setAffectedPlayersCount] = useState<number | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const skipUnsavedPrompt = useRef(false);


  type SkillGroup = { groupName: string; skills: string[] };

const toArray = (g: unknown): SkillGroup[] => {
  if (Array.isArray(g)) {
    // [{groupName, skills}] -> keep
    return (g as any[])
      .map(x => ({
        groupName: x?.groupName ?? "",
        skills: Array.isArray(x?.skills) ? x.skills.filter(Boolean) : [],
      }))
      .filter(x => x.groupName);
  }
  if (g && typeof g === "object") {
    // { Group: ["s1","s2"] } OR { Group: { skill: number } }
    return Object.entries(g as Record<string, any>).map(([k, v]) => ({
      groupName: k,
      skills: Array.isArray(v) ? (v as string[]) : Object.keys(v || {}),
    }));
  }
  return [];
};




// --- Handlers for editing groups/skills ---
const handleGroupNameChange = (gIndex: number, value: string) => {
  setSkillGroups(prev =>
    prev.map((g, i) => (i === gIndex ? { ...g, groupName: value } : g))
  );
};

const handleSkillChange = (gIndex: number, sIndex: number, value: string) => {
  setSkillGroups(prev =>
    prev.map((g, i) =>
      i === gIndex
        ? { ...g, skills: g.skills.map((s, j) => (j === sIndex ? value : s)) }
        : g
    )
  );
};

const addSkillToGroup = (gIndex: number) => {
  setSkillGroups(prev =>
    prev.map((g, i) => (i === gIndex ? { ...g, skills: [...g.skills, ''] } : g))
  );
};

const removeSkill = (gIndex: number, sIndex: number) => {
  setSkillGroups(prev =>
    prev.map((g, i) =>
      i === gIndex ? { ...g, skills: g.skills.filter((_, j) => j !== sIndex) } : g
    )
  );
};

const removeGroup = (gIndex: number) => {
  setSkillGroups(prev => prev.filter((_, i) => i !== gIndex));
};

const loadTemplate = (template: SkillTemplate, opts?: { force?: boolean }) => {
  if (unsavedChanges && !opts?.force && !skipUnsavedPrompt.current) {
    const confirmLeave = window.confirm('You have unsaved changes. Do you want to discard them?');
    if (!confirmLeave) return;
  }

  setSkillGroups(template.skillGroups);
  setTemplateName(template.name);
  setCategory(template.category);
  setSliderType(template.sliderType as '1-10' | 'emoji' | 'label');
  setEditMode(false);
  setUnsavedChanges(false);

  // one-shot bypass gets cleared after use
  skipUnsavedPrompt.current = false;
};

  useEffect(() => {
    if (!clubId) return;
    fetchTemplates();
  }, [clubId]);

  const fetchTemplates = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/skillTemplate/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const renamed = data.map((template: SkillTemplate) =>
          template.name === 'System Default - Visual Skill Matrix'
            ? { ...template, name: 'Skill Matrix - Default' }
            : template
        );
        setAllTemplates(renamed);

        // NEW: figure out which template was most recently synced
    const mostRecent = renamed
    .filter((t: SkillTemplate) => t.lastSyncedAt)
    .sort(
      (a: SkillTemplate, b: SkillTemplate) =>
        new Date(b.lastSyncedAt!).getTime() - new Date(a.lastSyncedAt!).getTime()
    )[0];
  setActiveTemplateId(mostRecent?._id ?? null);

        const clubDefault = renamed.find((t: SkillTemplate) => t.isDefaultForClub && t.clubId === clubId);
        const globalDefault = renamed.find((t: SkillTemplate) => t.name === 'Skill Matrix - Default');

        if (clubDefault) {
          loadTemplate(clubDefault, { force: true }); // skip unsaved confirm
          setSelectedTemplateId(clubDefault._id);
        } else if (globalDefault) {
          loadTemplate(globalDefault, { force: true }); // skip unsaved confirm
          setSelectedTemplateId(globalDefault._id);
        }
         else if (renamed.length > 0) {
          toast.info('No default template set. Please select or create one.');
        } else {
          toast.warning('No skill templates found. Please create one.');
        }
      } else {
        toast.error('Failed to fetch skill templates from server.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch skill templates');
    } finally {
      setLoading(false);
    }
  };


  const handleCloneTemplate = () => {
    const cloned = allTemplates.find(t => t._id === selectedTemplateId);
    if (cloned) {
      loadTemplate({ ...cloned, _id: '', name: `${cloned.name} (Copy)`, isDefaultForClub: false });
      setSelectedTemplateId(null);
      setEditMode(true);
      setUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    if (!templateName) {
      toast.error('Template name is required.');
      return;
    }
  
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/skillTemplate/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: templateName, skillGroups, sliderType, category, templateId: selectedTemplateId })
      });
  
      if (res.ok) {
        toast.success('Skill template saved');
  
        // ✅ mark no unsaved changes BEFORE refetch triggers loadTemplate
        setUnsavedChanges(false);
        setEditMode(false);
  
        // ✅ one-shot bypass of the discard prompt during the refresh
        skipUnsavedPrompt.current = true;
  
        await fetchTemplates(); // this will call loadTemplate(...)

      
        
        // loadTemplate will reset skipUnsavedPrompt.current = false
      } else {
        toast.error('Failed to save skill template');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };
  
{/*}
  const handleSetDefault = async () => {
    if (isDefault) {
      toast.info('This template is already the default.');
      return;
    }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/skillTemplate/set-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: selectedTemplateId, clubId })
      });

      if (res.ok) {
        toast.success('Template set as default for club');
        await fetchTemplates();
      } else {
        toast.error('Failed to update default setting');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };  *

  const handleSyncToPlayers = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token');
  
      const res = await fetch(`${baseUrl}/api/skillTemplate/sync-players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // <-- must be present
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,   // <-- must be present
          clubId,                           // <-- must be present
        }),
      });
  
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('sync-players failed:', res.status, errText);
        return toast.error(`Failed to sync players (${res.status})`);
      }
  
      toast.success('Synced and set as club default');
      setShowSyncDialog(false);
      await fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };
  
  const handleConfirmSync = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/skillTemplate/sync-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: selectedTemplateId, clubId })
      });
      if (res.ok) {
        const data = await res.json();
        setAffectedPlayersCount(data.affectedPlayers);
        setShowSyncDialog(true);
      } else {
        toast.error('Failed to prepare sync preview');
      }
    } catch (err) {
      console.error(err);
      toast.error('Preview request failed');
    }
  };

  const addGroup = () => {
    setSkillGroups([...skillGroups, { groupName: '', skills: [] }]);
    setUnsavedChanges(true);
  };

  const selected = allTemplates.find(t => t._id === selectedTemplateId);
  const isDefault = selected?.isDefaultForClub && selected?.clubId === clubId;
  const isGlobalDefault = selected?.name === 'Skill Matrix - Default';
  const isCustomClubTemplate = selected?.clubId === clubId && !isGlobalDefault;

  if (loading) return <p>Loading skill template...</p>;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Skill Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Select Template</label>
                <Select value={selectedTemplateId || ''} onValueChange={(id) => {
                  const selected = allTemplates.find(t => t._id === id);
                  if (selected) {
                    setSelectedTemplateId(id);
                    loadTemplate(selected);
                  }
                }}>
                  <SelectTrigger className="w-full">
                    {selectedTemplateId ? selected?.name : 'Select'}
                  </SelectTrigger>
                  <SelectContent>
                    {allTemplates.map(template => {
                      const isSystemDefault = template.name === 'Skill Matrix - Default';
                      const isCurrent = template._id === selectedTemplateId;
                      const isSynced = !!template.lastSyncedAt;
                      const isCustomClubTemplate = template.clubId === clubId && !isSystemDefault;

                      return (
                        <SelectItem key={template._id} value={template._id} className={`${isCurrent ? 'bg-blue-100 font-bold' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span>
                            {template.name}
                            {isSystemDefault ? ' (System Default)' : ''}
                            {template.isDefaultForClub && template.clubId === clubId ? ' (Club Default)' : ''}
                          </span>
                      
                          {/* existing synced clock/check tooltip *
                          {isCustomClubTemplate && (
                            <Tooltip>
                              <TooltipTrigger>{template.lastSyncedAt ? '✅' : '🕓'}</TooltipTrigger>
                              <TooltipContent>
                                {template.lastSyncedAt
                                  ? `Last Synced: ${new Date(template.lastSyncedAt).toLocaleString()}`
                                  : 'Not yet synced'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                      
                          {/* NEW: active badge (most recently synced for the club) *
                          {activeTemplateId === template._id && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Active
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>


              <div className="flex items-end gap-2">
  <Button variant="outline" onClick={handleCloneTemplate}>🧬 Clone</Button>

  {isCustomClubTemplate && !editMode && (
  <Button onClick={() => setEditMode(true)}>✏️ Edit</Button>
)}

{/*}
  {!editMode && !isGlobalDefault && !isDefault && (
    <Button onClick={handleSetDefault} disabled={!selectedTemplateId}>⭐ Set As Default</Button>
  )}  *

  {editMode && (
    <Button onClick={handleSave} className="bg-green-600 text-white hover:bg-green-700">💾 Save Template</Button>
  )}

  {/* NEW: Sync button is shown for ANY selected template (system default or custom) *
  {!editMode && selectedTemplateId && (
    <Button
      onClick={handleConfirmSync}
      variant={selectedTemplateId === activeTemplateId ? 'default' : 'outline'}
      title={selectedTemplateId === activeTemplateId ? 'This template is currently applied to players' : 'Apply this template to all skill-tracking players'}
    >
      🔄 {selectedTemplateId === activeTemplateId ? 'Re-sync to Players' : 'Sync to Players'}
    </Button>
  )}
</div>
            </div>
            <div>
              <label className="block mt-4 mb-1">Template Name</label>
              <Input value={templateName} onChange={e => { setTemplateName(e.target.value); setUnsavedChanges(true); }} disabled={!editMode || isGlobalDefault} />
            </div>

            {skillGroups.map((group, gIndex) => (
              <div key={gIndex} className="border p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={group.groupName}
                    onChange={e => { handleGroupNameChange(gIndex, e.target.value); setUnsavedChanges(true); }}
                    placeholder="Group Name"
                    disabled={isGlobalDefault}
                  />
                  <Button variant="ghost" onClick={() => removeGroup(gIndex)} disabled={isGlobalDefault}>
                    <Trash2 className="text-red-500" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {group.skills.map((skill, sIndex) => (
                    <div key={sIndex} className="flex items-center gap-2">
                      <Input
                        value={skill}
                        onChange={e => { handleSkillChange(gIndex, sIndex, e.target.value); setUnsavedChanges(true); }}
                        placeholder="Skill name"
                        disabled={isGlobalDefault}
                      />
                      <Button variant="ghost" onClick={() => removeSkill(gIndex, sIndex)} disabled={!editMode || isGlobalDefault}
>
                        <Trash2 className="text-red-500" size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => { addSkillToGroup(gIndex); setUnsavedChanges(true); }} disabled={!editMode || isGlobalDefault}
>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                  </Button>
                </div>
              </div>
            ))}

            <Button onClick={addGroup} disabled={!editMode || isGlobalDefault}>➕ Add New Group</Button>
          </CardContent>
        </Card>

        <Dialog open={showSyncDialog}>
<DialogContent>
  <DialogHeader>
    <DialogTitle>Confirm Sync</DialogTitle>
  </DialogHeader>
  <p>This will apply the template to all players with skill tracking enabled.</p>
  {affectedPlayersCount !== null && (
    <p className="text-sm text-gray-700">{affectedPlayersCount} player(s) will be affected.</p>
  )}
  <div className="flex justify-end gap-2 mt-4">
    <Button variant="outline" onClick={() => setShowSyncDialog(false)}>Cancel</Button>
    <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSyncToPlayers}>Confirm & Sync</Button>
  </div>
</DialogContent>
</Dialog>

      </div>
    </TooltipProvider>
  );
}



*/}

