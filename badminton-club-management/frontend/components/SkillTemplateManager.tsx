
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ToastContainer,toast } from 'react-toastify';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import 'react-toastify/dist/ReactToastify.css';


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
      setShowSyncDialog(false);
      toast.success('Template applied to players and set as club default');
     

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
    <div className="space-y-6">
    <ToastContainer position="top-right" autoClose={2000} />

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
    </div>
  );
}

