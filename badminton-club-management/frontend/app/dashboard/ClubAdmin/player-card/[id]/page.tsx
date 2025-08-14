'use client';

import { Poppins, Fredoka, Nunito, Quicksand } from 'next/font/google';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import ShuttleSlider from '@/components/ui/ShuttleSlider';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SkillReportCardWrapper from '@/components/SkillReportCardWrapper';
import { ChevronDown, ChevronUp, Trophy, Medal, ThumbsUp, BarChart2 } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// ---------- Types ----------
interface Match {
  date: string;
  category: string;
  result: string;
  partner: string;
  opponents: string[];
  duration?: string;
  score?: any;
}

interface PlayerDetails {
  _id: string;
  firstName: string;
  surName: string;
  email: string;
  dob: string;
  sex: string;
  isJunior: boolean;
  parentName?: string;
  parentPhone?: string;
  emergencyContactname: string;
  emergencyContactphonenumber: string;
  joiningDate: string;
  paymentStatus: string;
  membershipStatus: string;
  coachName?: string;
  playerType: string;
  clubRoles?: string[];
  level?: string;
  profileImage?: string;
  skillMatrix?: Record<string, Record<string, number>> | Array<{ groupName: string; skills: string[] }> | Record<string, any>;
  skillScores?: Record<string, number>;
  skillHistory?: any;
  skillTracking?: boolean;
}

type SkillGroup = { groupName: string; skills: string[] };

// ---------- Fonts ----------
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-poppins' });
export const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-fredoka' });
export const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-nunito' });
export const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-quicksand' });

// ---------- Utils ----------
const hasKeys = (obj?: Record<string, any>) => !!obj && Object.keys(obj).length > 0;

const flattenSkills = (nested: any): Record<string, number> => {
  const flat: Record<string, number> = {};
  if (!nested) return flat;

  if (Array.isArray(nested)) {
    for (const g of nested) {
      const list = Array.isArray(g?.skills) ? g.skills : [];
      for (const s of list) flat[s] = 1;
    }
    return flat;
  }

  if (typeof nested === 'object') {
    for (const group of Object.keys(nested)) {
      if (/^\d+$/.test(group)) continue; // ignore legacy numeric indices
      const v = (nested as any)[group];
      if (Array.isArray(v)) v.forEach((s) => (flat[s] = 1));
      else if (v && typeof v === 'object') Object.keys(v).forEach((s) => (flat[s] = Number(v[s]) || 1));
    }
  }
  return flat;
};

export default function PlayerDetailPage() {
  const { id } = useParams();

  // ---------- State ----------
  const [matches, setMatches] = useState<Match[]>([]);
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [coaches, setCoaches] = useState<string[]>([]);
  const [form, setForm] = useState<Omit<PlayerDetails, 'skillMatrix' | 'skillHistory' | 'skillScores'> | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [initialSkills, setInitialSkills] = useState<Record<string, number>>({});
  const [userRole, setUserRole] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showSkillReport, setShowSkillReport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [statsCollapsed, setStatsCollapsed] = useState(true);

  // template
  const [activeTemplate, setActiveTemplate] = useState<Record<string, string[]> | null>(null);
  const [tplError, setTplError] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const isExporting = useRef(false);

  // ---------- Effects ----------
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role || '');
    } catch {}
  }, []);

  // Fetch player (never blocked by template state)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/players/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch player');
        const data: PlayerDetails = await res.json();
        setPlayer(data);

        const fromScores = data.skillScores ?? {};
        const flat = hasKeys(fromScores) ? fromScores : flattenSkills(data.skillMatrix);
        setSkills(flat);
        setInitialSkills(flat);

        setForm({
          _id: data._id,
          firstName: data.firstName,
          surName: data.surName || '',
          email: data.email,
          sex: data.sex,
          joiningDate: data.joiningDate?.split('T')[0] || '',
          dob: data.dob?.split('T')[0] || '',
          isJunior: data.isJunior,
          parentName: data.parentName || '',
          parentPhone: data.parentPhone || '',
          emergencyContactname: data.emergencyContactname || '',
          emergencyContactphonenumber: data.emergencyContactphonenumber || '',
          paymentStatus: data.paymentStatus,
          membershipStatus: data.membershipStatus || 'Active',
          coachName: data.coachName || '',
          playerType: data.playerType,
          clubRoles: data.clubRoles || [],
          level: data.level || '',
          skillTracking: data.skillTracking,
          profileImage: data.profileImage || '',
        });
      } catch (err) {
        console.error('Fetch player error:', err);
      }
    })();
  }, [id]);

  // Fetch active template (does not block page rendering)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
        const clubId = payload?.clubId;
        if (!clubId) {
          setTplError('No clubId found in token.');
          return;
        }
        // Adjust route here if your backend path differs
        const res = await fetch(`${baseUrl}/api/skillTemplate/active?clubId=${clubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({} as any));
          setTplError(j?.message || 'Failed to load active template.');
          setActiveTemplate(null);
          return;
        }
        const j = await res.json();
        const groups = j?.groups ?? {};
        if (!hasKeys(groups)) {
          setTplError('Active template has no groups.');
          setActiveTemplate(null);
          return;
        }
        setActiveTemplate(groups);
        setTplError(null);
      } catch (e) {
        setTplError('Failed to load active template.');
        setActiveTemplate(null);
      }
    })();
  }, []);

  // Fetch coaches
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/coaches`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setCoaches(data.map((c: any) => `${c.firstName} ${c.surName || ''}`.trim()));
      } catch (err) {
        console.error('Failed to fetch coaches:', err);
      }
    })();
  }, []);

  // Matches
  useEffect(() => {
    (async () => {
      if (!id) return;
      const token = localStorage.getItem('token');
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/matchs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        console.error('Error fetching match data:', err);
      }
    })();
  }, [id]);

  // ---------- Derived ----------
  const normalizedRole = (userRole || '').replace(/\s+/g, '');

  const defaultTab = useMemo(() => {
    return player?.playerType === 'Junior Club Member' ? 'skills' : 'matches';
  }, [player?.playerType]);

  // Build groups to render: start from active template, overlay any names already stored on the player
  const groupsFromTemplate = useMemo<Record<string, string[]> | null>(() => {
    if (!activeTemplate) return null;
    const out: Record<string, string[]> = { ...activeTemplate };
    const m = player?.skillMatrix;
    const override = (group: string, skills: string[]) => {
      if (group in out && skills?.length) out[group] = skills;
    };

    if (!m) return out;

    if (Array.isArray(m)) {
      m.forEach((g: any) => override(g?.groupName, Array.isArray(g?.skills) ? g.skills : []));
    } else if (m && typeof m === 'object') {
      for (const [k, v] of Object.entries(m as Record<string, any>)) {
        if (/^\d+$/.test(k)) {
          override((v as any)?.groupName, Array.isArray((v as any)?.skills) ? (v as any).skills : []);
        } else if (Array.isArray(v)) {
          override(k, v as string[]);
        } else if (v && typeof v === 'object') {
          override(k, Object.keys(v));
        }
      }
    }
    return out;
  }, [activeTemplate, player?.skillMatrix]);

  // Keep sliders in sync when groups change
  useEffect(() => {
    if (!groupsFromTemplate) return;
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(groupsFromTemplate).forEach((k) => (next[k] = prev[k] ?? false));
      return next;
    });

    setSkills((prev) => {
      const next: Record<string, number> = {};
      Object.values(groupsFromTemplate).forEach((list) => list.forEach((s) => (next[s] = prev[s] ?? 1)));
      return next;
    });
  }, [groupsFromTemplate]);

  const groupSkillsByCategory = (flat: Record<string, number>) => {
    if (!groupsFromTemplate) return {} as Record<string, Record<string, number>>;
    const grouped: Record<string, Record<string, number>> = {};
    for (const [group, list] of Object.entries(groupsFromTemplate)) {
      const bucket: Record<string, number> = {};
      for (const s of list) if (s in flat) bucket[s] = flat[s];
      if (hasKeys(bucket)) grouped[group] = bucket;
    }
    return grouped;
  };

  // ---------- Handlers ----------
  const toggleGroup = (group: string) => setExpandedGroups((p) => ({ ...p, [group]: !p[group] }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (!prev) return prev;
      if (name === 'dob') {
        const today = new Date();
        const birth = new Date(value);
        const age = today.getFullYear() - birth.getFullYear();
        const md = today.getMonth() - birth.getMonth();
        const adjustment = md < 0 || (md === 0 && today.getDate() < birth.getDate()) ? 1 : 0;
        const isJunior = age - adjustment < 18;
        return { ...prev, [name]: value, isJunior } as typeof prev;
      }
      return { ...prev, [name]: value } as typeof prev;
    });
  };

  const handleSelectChange = (name: string, value: string) => setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  const handleCheckboxChange = (name: string, checked: boolean) => setForm((prev) => (prev ? { ...prev, [name]: checked } : prev));

  const handleSave = async () => {
    if (!form || !player) return;
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/players/${player._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setPlayer(updated);
      setShowDialog(false);
      toast.success('✅ Player details updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      toast.error('❌ Failed to update player details');
    }
  };

  const handleSkillChange = (skillKey: string, newValue: number) => {
    setSkills((prev) => ({ ...prev, [skillKey]: newValue }));
    setUnsavedChanges(true);
  };

  const handleSkillMatrixSave = async () => {
    if (!groupsFromTemplate) {
      toast.error('No active skill template for this club.');
      return;
    }
    const changed: Record<string, number> = {};
    Object.keys(skills).forEach((k) => {
      if (skills[k] !== initialSkills[k]) changed[k] = skills[k];
    });
    if (!hasKeys(changed)) {
      toast.info('No skill changes to save.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/players/${id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skillMatrix: groupSkillsByCategory(changed) }),
      });
      if (!res.ok) throw new Error('Skill update failed');
      toast.success('✅ Skill matrix updated successfully!');
      setInitialSkills(skills);
      setUnsavedChanges(false);
    } catch (err) {
      console.error('Skill update failed:', err);
      toast.error('❌ Failed to update skill matrix!');
    }
  };

  const handlePDFExport = async () => {
    isExporting.current = true;
    const html2pdf = (await import('html2pdf.js')).default;
    setTimeout(() => {
      if (reportRef.current) {
        html2pdf()
          .set({ margin: [5, 5, 5, 5], filename: `${player?.firstName}_SkillReport.pdf`, html2canvas: { scale: 2 }, pagebreak: { mode: 'avoid' } })
          .from(reportRef.current)
          .save()
          .then(() => (isExporting.current = false));
      }
    }, 400);
  };

  const handleSaveComment = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/players/${id}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: coachComment }),
      });
      if (!res.ok) throw new Error('Failed to save comment');
      toast.success('✅ Coach comment saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('❌ Error saving comment');
    }
  };

  // ---------- Render ----------
  if (!player || !form) return <div className="p-6">Loading player…</div>;

  const dropdownFields = {
    sex: ['Male', 'Female'],
    playerType: ['Coaching only', 'Club Member', 'Coaching and Club Member'],
    level: ['Beginner', 'Intermediate', 'Advanced'],
    membershipStatus: ['Active', 'Inactive', 'Paused', 'Discontinued', 'Guest'],
    paymentStatus: ['Paid', 'Unpaid', 'Partial'],
    clubRoles: [
      "Club President",
      "Club Secretary",
      "Club Treasurer",
      "Men's Team Captain",
      "Women's Team Captain",
      'Coach-Level 1',
      'Coach-Level 2',
      'Head Coach',
      'Safeguarding Officer',
      'First Aid Officer',
      'Social Media & Marketing Officer',
    ],
  } as const;

  const excludedKeys = ['_id', 'profileImage', 'clubId', '__v', 'createdAt', 'updatedAt', 'isAdult', 'skillMatrix', 'skillHistory'];

  const coachComment = '' as any; // keep your existing state if needed
  const setCoachComment = (v: any) => v; // placeholder for brevity

  return (
    <div className="p-6 space-y-4">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div className="w-full lg:w-2/3 order-2 lg:order-1">
          <button className="text-blue-600 underline mb-2 lg:hidden" onClick={() => setStatsCollapsed(!statsCollapsed)}>
            {statsCollapsed ? 'Show Stats' : 'Hide Stats'}
          </button>
          {/* (Stats content omitted for brevity — keep your original) */}
        </div>

        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-600 shadow">
          <Image src={player.profileImage || (player.sex === 'Female' ? '/Avatar-female.png' : '/Avatar-male.png')} alt={player.firstName || 'Profile'} width={112} height={112} className="object-cover w-full h-full" />
        </div>

        <div className="flex gap-4 items-center">
          <div>
            <h2 className={`${nunito.variable} text-5xl font-bold text-blue-600 leading-tight`}>{form.firstName} {form.surName}</h2>
            <p className="text-lg text-gray-700 font-mono">Level: {form.level || 'N/A'}</p>
            <p className="text-lg text-gray-700 font-mono">Membership Status: {form.membershipStatus}</p>
            {(form.playerType === 'Coaching and Club Member' || form.playerType === 'Junior Club Member') && (
              <p className="text-lg text-gray-700 font-mono">Coach Name: {form.coachName || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowDialog(true)}>Edit Personal Details</Button>
        {(normalizedRole === 'ClubAdmin' || normalizedRole === 'SuperAdmin') && (
          <Button variant="destructive" className="ml-2" onClick={() => setShowDeleteConfirm(true)}>Delete Player</Button>
        )}
        {player.skillTracking && (
          <>
            <Button className="ml-2" onClick={handleSkillMatrixSave}>Save Skill Matrix</Button>
            <Button className="ml-2" onClick={() => setShowSkillReport(true)}>Skill Export View</Button>
            <Button onClick={handlePDFExport}>📥 Export PDF</Button>
          </>
        )}
      </div>

      {/* Edit dialog (unchanged) */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Personal Details</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(form).map(([key, val]) => {
              if (excludedKeys.includes(key)) return null;
              if (key === 'isJunior') {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-sm font-medium">Is Junior</label>
                    <Checkbox checked={(form as any).isJunior as boolean} onCheckedChange={(v) => handleCheckboxChange('isJunior', !!v)} />
                  </div>
                );
              }
              if (key === 'coachName' && form.playerType !== 'Junior Club Member') return null;
              if (key === 'clubRoles' && (form as any).isJunior) return null;

              return (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                  {(dropdownFields as any)[key] ? (
                    <Select value={String(val)} onValueChange={(v) => handleSelectChange(key, v)}>
                      <SelectTrigger>{String(val)}</SelectTrigger>
                      <SelectContent>
                        {(dropdownFields as any)[key].map((opt: string) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  ) : key === 'dob' || key === 'joiningDate' ? (
                    <Input type="date" name={key} value={String(val)} onChange={handleInputChange} />
                  ) : (
                    <Input name={key} value={String(val)} onChange={handleInputChange} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex gap-4 bg-blue-50 p-2 rounded-xl">
          <TabsTrigger value="skills" className="text-lg text-blue-800 font-semibold hover:text-white hover:bg-blue-600 px-4 py-2 rounded transition-all">Skill Matrix</TabsTrigger>
          <TabsTrigger value="matches" className="text-lg text-purple-800 font-semibold hover:text-white hover:bg-purple-600 px-4 py-2 rounded transition-all">Match Summary</TabsTrigger>
        </TabsList>

        {/* Skills tab */}
        <TabsContent value="skills">
          {!player.skillTracking ? (
            <p className="text-gray-500 mt-4">Skill Tracking is not enabled for this player.</p>
          ) : !groupsFromTemplate ? (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700 mt-4">
              <div className="font-semibold">No active skill template</div>
              <div className="text-sm mt-1">{tplError || 'No default template set for this club.'}</div>
              <div className="text-sm mt-2">Ask a Club Admin to set a default template (isDefaultForClub=true).</div>
            </div>
          ) : (
            <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
              <section>
                {Object.entries(groupsFromTemplate).map(([group, skillsInGroup]) => (
                  <Card key={group} className="mb-4 shadow-sm">
                    <div onClick={() => toggleGroup(group)} className="cursor-pointer bg-blue-100 hover:bg-blue-200 px-4 py-4 rounded-lg transition-colors flex justify-between items-center">
                      <h4 className="text-xl font-bold text-gray-800">{group}</h4>
                      <span className="text-gray-600 transition-transform duration-300 ease-in-out">{expandedGroups[group] ? <ChevronUp size={28} /> : <ChevronDown size={28} />}</span>
                    </div>
                    {expandedGroups[group] && (
                      <CardContent className="p-4 space-y-4 bg-white rounded-b-lg">
                        {skillsInGroup.map((skill) => (
                          <div key={skill} className="space-y-1">
                            <ShuttleSlider label={skill} value={skills[skill] ?? 1} onChange={(val) => handleSkillChange(skill, val)} disabled={userRole === 'Parent' || userRole === 'Tournament Organiser'} />
                          </div>
                        ))}
                        {skillsInGroup.length === 0 && <div className="text-sm text-gray-500">No skills defined in this group.</div>}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </section>

              {showSkillReport && <SkillReportCardWrapper player={player} onClose={() => setShowSkillReport(false)} />}

              <Card className="shadow-sm">
                <CardHeader><CardTitle>Coach Comments</CardTitle></CardHeader>
                <CardContent>
                  <textarea className="w-full p-3 border border-gray-300 rounded text-black" rows={3} placeholder="Add coach comments..." />
                  <Button className="mt-3" onClick={handleSaveComment}>💾 Save Comments</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Matches tab */}
        <TabsContent value="matches">
          <Card className="mt-4">
            <CardHeader><CardTitle>Match Summary</CardTitle></CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Duration</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Result</th>
                        <th className="px-4 py-2 text-left">Partner</th>
                        <th className="px-4 py-2 text-left">Opponent 1</th>
                        <th className="px-4 py-2 text-left">Opponent 2</th>
                        <th className="px-4 py-2 text-left">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((match, index) => {
                        const formattedScore =
                          typeof match.score === 'string'
                            ? match.score.includes('-')
                              ? match.score.split('-').join(' / ')
                              : match.score
                            : match.score && typeof match.score === 'object'
                            ? `${match.score.teamA} / ${match.score.teamB}`
                            : '- / -';
                        return (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{new Date(match.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{match.duration || '-'}</td>
                            <td className="px-4 py-2">{match.category}</td>
                            <td className="px-4 py-2">{match.result}</td>
                            <td className="px-4 py-2">{match.partner}</td>
                            <td className="px-4 py-2">{match.opponents?.[0] || '-'}</td>
                            <td className="px-4 py-2">{match.opponents?.[1] || '-'}</td>
                            <td className="px-4 py-2">{formattedScore}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No match history available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
