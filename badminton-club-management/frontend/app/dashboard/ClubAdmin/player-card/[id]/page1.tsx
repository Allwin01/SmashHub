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
import { ChevronDown, ChevronUp,Trophy, Users, Medal, ThumbsUp,Percent,CirclePie,BarChart2 } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import 'react-toastify/dist/ReactToastify.css';
import { calculateStats } from '@/utils/playerStats';




interface Match {
  date: string;
  category: string;
  result: string;
  partner: string;
  opponents: string[];
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
  skillMatrix?: Record<string, number>;
  skillHistory?: any;
  skillTracking?: boolean;
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-poppins',
});

export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-fredoka',
});

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-nunito',
});

export const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-quicksand',
});

const skillGroups: Record<string, string[]> = {
  'Movement Phases': ['Split-Step', 'Chasse Step', 'Lunging', 'Jumping'],
  'Grips & Grip Positions': ['Basic Grip', 'Panhandle', 'Bevel', 'Thumb Grip', 'Grip Adjustment'],
  'Forehand Strokes': ['Clear', 'Drop Shot', 'Smash', 'Slice Drop', 'Lift (Underarm)', 'Net Drop (Underarm)'],
  'Backhand Strokes': ['Clear (Backhand)', 'Drop Shot (Backhand)', 'Lift (Backhand)', 'Net Drop (Backhand)'],
  'Serve Techniques': ['Low Serve', 'High Serve', 'Flick Serve', 'Drive Serve'],
  'Footwork & Speed': ['6-Corner Footwork', 'Shadow Footwork', 'Pivot & Rotation', 'Recovery Steps'],
};



export default function PlayerDetailPage() {

  const [matches, setMatches] = useState<Match[]>([]);
  const [player,  setPlayer] = useState<PlayerDetails | null>(null);   //Stores the full player object fetched from the backend.
  const [coaches, setCoaches] = useState<string[]>([]);  //Stores a list of coach names as strings.
  const { id } = useParams();   // Extracts the id from the URL — e.g., /players/[id]
  const [form, setForm] = useState<Omit<PlayerDetails, 'skillMatrix' | 'skillHistory'> | null>(null); // Stores a copy of player data used specifically for the "Edit Personal Details" form.Separate from player to allow edits without affecting the original until saved
  const [showDialog, setShowDialog] = useState(false);   // Controls visibility of the "Edit Personal Details" dialog (modal).
  const [skills, setSkills] = useState<Record<string, number>>({});  //Stores the player's skill matrix (e.g., { "Jumping": 3, "Smash": 7 })
  const [initialSkills, setInitialSkills] = useState<Record<string, number>>({});
  const [userRole, setUserRole] = useState<string>('');  // Holds the logged-in user's role (Coach, Parent, etc.)
  const [unsavedChanges, setUnsavedChanges] = useState(false);  //Flags whether the user has made changes (e.g., to skill sliders) that haven’t been saved yet.
  const [showSkillReport, setShowSkillReport] = useState(false);  // For Skill Report View
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const normalizedRole = userRole.replace(/\s+/g, '');
  const [coachComment, setCoachComment] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);
  const isExporting = useRef(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [statsCollapsed, setStatsCollapsed] = useState(true);


  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      } catch (err) {
        console.error('⚠️ Failed to decode token:', err);
      }
    }
  }, []);

    // Skill flatten and nested to send group header and skills when submitted
    const flattenSkills = (nested: any): Record<string, number> => {
      const flat: Record<string, number> = {};
      if (!nested || typeof nested !== 'object') return flat;
      for (const category in nested) {
        const group = nested[category];
        if (typeof group === 'object') {
          for (const skill in group) {
            flat[skill] = group[skill];
          }
        }
      }
      return flat;
    };

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch (`${baseUrl}/api/players/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
  
        console.log('🎯 Player fetched:', data); // 👈 Add this
        setPlayer(data);
       
        const flatSkills = flattenSkills(data.skillMatrix);       // - This stores the entire player object fetched from the database into state.
            setSkills(flatSkills);    //This stores the current skill ratings from the database into the skills state, which is bound to your sliders in the UI.
            setInitialSkills(flatSkills);  //This stores a snapshot of the original skills when the profile loads.Detect changes in slider values
  
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
          profileImage: data.profileImage || ''
        });
     
     
     
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayer();
  }, [id]);
  


  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch (`${baseUrl}/api/coaches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCoaches(data.map((coach: any) => `${coach.firstName} ${coach.surName || ''}`.trim()));

      } catch (err) {
        console.error('Failed to fetch coaches:', err);
      }
    };
    fetchCoaches();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    setForm((prev) => {
      if (!prev) return prev;
  
      // If DOB is changed, auto-set isJunior
      if (name === 'dob') {
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayAdjustment = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ? 1 : 0;
        const isJunior = (age - dayAdjustment) < 18;
  
        return {
          ...prev,
          [name]: value,
          isJunior,
        };
      }
  
      return { ...prev, [name]: value };
    });
  };
  

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => prev ? { ...prev, [name]: value } : prev);
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setForm((prev) => prev ? { ...prev, [name]: checked } : prev);
  };


  const groupSkillsByCategory = (flatSkills: Record<string, number>) => {
    const grouped: Record<string, Record<string, number>> = {};
  
    for (const [category, skillList] of Object.entries(skillGroups)) {
      const skillsInGroup: Record<string, number> = {};
  
      skillList.forEach((skill) => {
        if (flatSkills.hasOwnProperty(skill)) {
          skillsInGroup[skill] = flatSkills[skill];
        }
      });
  
      if (Object.keys(skillsInGroup).length > 0) {
        grouped[category] = skillsInGroup;
      }
    }
  
    return grouped;
  };
  


//Handle Save Button
  const handleSave = async () => {
    if (!form || !player) return;
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch (`${baseUrl}/api/players/${player._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setPlayer(updated);
      setShowDialog(false);
      toast.success('✅ Player details updated successfully!');
    } catch (err) {
      console.error('❌ Update error:', err);
      toast.error('❌ Failed to update player details');
    }
  };
// Handle Delete Button
const handleDeletePlayer = async () => {
  try {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch (`${baseUrl}/api/players/${player?._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: deleteReason,
      }),
    });

    const data = await res.json();
    console.log('🧾 Response:', data);

    if (!res.ok) throw new Error(data.message || 'Failed to delete player');

    toast.success('🗑️ Player deleted successfully');
    setShowDeleteConfirm(false);
    window.location.href = '/dashboard/clubadmin/player-card';
  } catch (err) {
    toast.error('❌ Failed to delete player');
    console.error('❌ Delete error:', err);
  }
};


  

  //{/* This useEffect block is used to warn the user if they try to leave the page with unsaved changes.  *
  
  const handleSkillChange = (skillKey: string, newValue: number) => {
    setSkills((prev) => ({ ...prev, [skillKey]: newValue }));
    setUnsavedChanges(true);
  };

  const handleSkillMatrixSave = async () => {
    const changedSkills: Record<string, number> = {};
    for (const key in skills) {
      if (skills[key] !== initialSkills[key]) {
        changedSkills[key] = skills[key];
      }
    }
    if (Object.keys(changedSkills).length === 0) {
      toast.info('No skill changes to save.');
      return;
    }

    const groupSkillsByCategory = (flatSkills: Record<string, number>) => {
        const grouped: Record<string, Record<string, number>> = {};
      
        for (const [category, skillList] of Object.entries(skillGroups)) {
          const skillsInGroup: Record<string, number> = {};
      
          skillList.forEach((skill) => {
            if (flatSkills.hasOwnProperty(skill)) {
              skillsInGroup[skill] = flatSkills[skill];
            }
          });
      
          if (Object.keys(skillsInGroup).length > 0) {
            grouped[category] = skillsInGroup;
          }
        }
      
        return grouped;
      };
      
  try {
    const token = localStorage.getItem('token');
  
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch (`${baseUrl}/api/players/${id}/skills`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ skillMatrix: groupSkillsByCategory(changedSkills) }),
    });
  
    if (!res.ok) throw new Error('❌ Skill update failed');
  
    toast.success('✅ Skill matrix updated successfully!');
    setInitialSkills(skills);
    setUnsavedChanges(false);
  } catch (err) {
    console.error('❌ Skill update failed:', err);
    toast.error('❌ Failed to update skill matrix!');
    return; // stop here if failed
  }
  
  try {
    const token = localStorage.getItem('token');
    const updatedPlayerRes = await fetch(`http://localhost:5050/api/players/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  
    if (!updatedPlayerRes.ok) throw new Error('❌ Fetch updated player failed');
  
    const updatedPlayerData = await updatedPlayerRes.json();
    setPlayer(updatedPlayerData);
  } catch (err) {
    console.error('❌ Error reloading updated player data:', err);
    toast.error('⚠️ Skills saved, but failed to reload updated view');
  }
};
  
//Export PDF

const handlePDFExport = async () => {
  isExporting.current = true;
  const html2pdf = (await import('html2pdf.js')).default;

  setTimeout(() => {
    if (reportRef.current) {
      html2pdf()
        .set({
          margin: [5, 5, 5, 5],
          filename: `${player?.firstName}_SkillReport.pdf`,
          html2canvas: { scale: 2 },
          pagebreak: { mode: 'avoid' },
        })
        .from(reportRef.current)
        .save()
        .then(() => {
          isExporting.current = false;
        });
    }
  }, 500);
};

//Coach Commant 

  const handleSaveComment = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch (`${baseUrl}/api/players/${id}/comments`, {

        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: coachComment }),
      });
      if (!res.ok) throw new Error('Failed to save comment');
      toast.success('✅ Coach comment saved successfully!');

    } catch (err) {
      console.error(err);
      toast.error('❌ Error saving comment');

    }
  };


  useEffect(() => {
    const fetchComment = async () => {
      if (!player?._id) return;
      const token = localStorage.getItem('token');
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch (`${baseUrl}/api/players/${id}/comment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.coachComment !== undefined) {
          setCoachComment(data.coachComment);
        }
      } catch (err) {
        console.error('❌ Error fetching coach comment:', err);
      }
    };
    fetchComment();
  }, [player?._id]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!id) return;
      const token = localStorage.getItem('token');
      console.log('📡 Fetching matches for ID:', id);  // ✅ extra debug
  
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch (`${baseUrl}/api/matchs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  
        const data = await res.json();
        console.log('🎯 Match history fetched:', data);  // ✅ debug
        setMatches(data);
      } catch (err) {
        console.error('❌ Error fetching match data:', err);
      }
    };
    fetchMatches();
  }, [id]);
  
  
  




  const dropdownFields = {
    sex: ['Male', 'Female'],
    playerType: ['Coaching only', 'Club Member', 'Coaching and Club Member'],
    level: ['Beginner', 'Intermediate', 'Advanced'],
    membershipStatus: ['Active', 'Inactive', 'Paused', 'Discontinued', 'Guest'],
    paymentStatus: ['Paid', 'Unpaid', 'Partial'],
    clubRoles: [
      'Club President', 'Club Secretary', 'Club Treasurer', 'Men\'s Team Captain',
      'Women\'s Team Captain', 'Coach-Level 1', 'Coach-Level 2', 'Head Coach',
      'Safeguarding Officer', 'First Aid Officer', 'Social Media & Marketing Officer'
    ]
  };

  const excludedKeys = ['_id', 'profileImage', 'clubId', '__v', 'createdAt', 'updatedAt', 'isAdult', 'skillMatrix', 'skillHistory'];



  console.log('🧪 userRole:', userRole);

  const handleSkillReportOpen = () => {
    localStorage.setItem('selectedPlayerId', player._id); // 👈 Add this
    setShowSkillReport(true);
  };
  

  const stats = useMemo(() => {
    if (!matches.length) return { totalMatches: 0, totalWins: 0, winPercent: 0, xdWins: 0, mdWins: 0, bestMdPartner: '-', bestXdPartner: '-' };
    const totalWins = matches.filter(m => m.result === 'Win').length;
    const xdWins = matches.filter(m => m.result === 'Win' && m.category === 'XD').length;
    const mdWins = matches.filter(m => m.result === 'Win' && m.category === 'MD').length;
    const bestMdPartner = 'Jason Acers'; // Replace with real logic
    const bestXdPartner = 'Jovan Allwin';
    return {
      totalMatches: matches.length,
      totalWins,
      winPercent: Math.round((totalWins / matches.length) * 100),
      xdWins,
      mdWins,
      bestMdPartner,
      bestXdPartner,
    };
  }, [matches]);

  const winPercent = stats.totalMatches > 0 ? Math.round((stats.totalWins / stats.totalMatches) * 100) : 0;

  if (!player) return <div className="p-6">Loading...</div>;

  const defaultTab = player.playerType === 'Junior Club Member' ? 'skills' : 'matches';


  return (
    <div className="p-6 space-y-4">
      <ToastContainer position="top-right" autoClose={2000} />

     {/*} <div className="flex flex-col lg:flex-row items-center gap-6"> */}


     <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        {/* 🆕 Stats block in 3 rows layout with center-aligned text */}
        <div className="w-full lg:w-2/3 order-2 lg:order-1">
          <button
            className="text-blue-600 underline mb-2 lg:hidden"
            onClick={() => setStatsCollapsed(!statsCollapsed)}
          >
            {statsCollapsed ? 'Show Stats' : 'Hide Stats'}
          </button>

          <div className={`bg-gradient-to-br from-blue-100 to-blue-300 text-blue-900 px-6 py-4 rounded-md shadow-md text-base ${statsCollapsed ? 'hidden' : ''} lg:block`}>
            <div className="space-y-4 text-center">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <p className="flex items-center gap-2 text-lg"><Trophy className="w-6 h-6 text-yellow-600" /><strong>Total Matches:</strong> {stats.totalMatches}</p>
                <p className="flex items-center gap-2 text-lg"><ThumbsUp className="w-6 h-6 text-green-600" /><strong>Total Wins:</strong> {stats.totalWins}</p>
                <p className="flex items-center gap-2 text-lg"><BarChart2 className="w-6 h-6 text-blue-600" /><strong>Win %:</strong> {winPercent}%</p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <p className="flex items-center gap-2 text-lg"><Medal className="w-6 h-6 text-indigo-600" /><strong>Wins in XD:</strong> {stats.xdWins}</p>
                <p className="flex items-center gap-2 text-lg"><Medal className="w-6 h-6 text-indigo-600" /><strong>Wins in MD:</strong> {stats.mdWins}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 animate-pulse">
                <p className="text-blue-800 text-lg"><strong>Best MD Partner:</strong> {stats.bestMdPartner || '-'}</p>
                <p className="text-blue-800 text-lg"><strong>Best XD Partner:</strong> {stats.bestXdPartner || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-600 shadow">
          <Image
            src={player.profileImage || (player.sex === 'Female' ? '/Avatar-female.png' : '/Avatar-male.png')}
            alt={player.firstName || 'Profile'}
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>
       
       {/* 👤 Profile + Meta */}
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


        {/* 🆕 Stats block moved to top-right, responsive and collapsible 
        <div className="w-full lg:w-1/2 lg:items-start">
          <button
            className="text-blue-600 underline mb-2 lg:hidden"
            onClick={() => setStatsCollapsed(!statsCollapsed)}
          >
            {statsCollapsed ? 'Show Stats' : 'Hide Stats'}
          </button>

          <div className={`bg-gradient-to-br from-blue-100 to-blue-300 text-blue-900 px-6 py-2 rounded-md shadow-md text-sm ${statsCollapsed ? 'hidden' : ''} lg:block`}> 
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center justify-start lg:justify-end">
              <p className="flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-600" /><strong>Total Matches:</strong> {stats.totalMatches}</p>
              <p className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-green-600" /><strong>Total Wins:</strong> {stats.totalWins}</p>
              <p className="flex items-center gap-1"><Percent className="w-4 h-4 text-blue-600" /><strong>Win %:</strong> {winPercent}%</p>
              <p className="flex items-center gap-1"><Medal className="w-4 h-4 text-indigo-600" /><strong>Wins in XD:</strong> {stats.xdWins}</p>
              <p className="flex items-center gap-1"><Medal className="w-4 h-4 text-indigo-600" /><strong>Wins in MD:</strong> {stats.mdWins}</p>
              <p className="animate-pulse text-blue-800"><strong>Best MD Partner:</strong> {stats.bestMdPartner || '-'}</p>
              <p className="animate-pulse text-blue-800"><strong>Best XD Partner:</strong> {stats.bestXdPartner || '-'}</p>
            </div>
          </div>
        </div>   */}
      </div>
      
      
      

      <div className="flex gap-2 flex-wrap">
      <Button onClick={() => setShowDialog(true)}>Edit Personal Details</Button>
      {(normalizedRole === 'ClubAdmin' || normalizedRole === 'SuperAdmin') && (
            <Button variant="destructive" className="ml-2" onClick={() => setShowDeleteConfirm(true)}>
              Delete Player
            </Button>
      )}
        {player.skillTracking && (
          <>
           
            {/* <Button onClick={() => setShowSkillReport(true)}>Skill Export View</Button> */}
            <Button className="ml-2" onClick={handleSkillMatrixSave}>Save Skill Matrix</Button>
          <Button className="ml-2" onClick={handleSkillReportOpen}>Skill Export View</Button>
            <Button onClick={handlePDFExport}>📥 Export PDF</Button>
          </>
        )}
      </div>  


      <Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Personal Details</DialogTitle>
    </DialogHeader>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 

    {Object.entries(form).map(([key, val]) => {
  if (excludedKeys.includes(key)) return null;

  // Handle isJunior as a checkbox (must go before the generic return)
  if (key === 'isJunior') {
    return (
      <div key={key} className="flex items-center gap-2">
        <label className="text-sm font-medium">Is Junior</label>
        <Checkbox
          checked={form.isJunior}
          onCheckedChange={(val) => handleCheckboxChange('isJunior', !!val)}
        />
      </div>
    );
  }

  // Hide coachName unless player is in a coaching role
  if (key === 'coachName' && (form.playerType !== 'Junior Club Member')) return null;

  // Hide clubRoles if player is a Junior
  if (key === 'clubRoles' && form.isJunior) return null;

  // Generic input or dropdown
  return (
    <div key={key} className="flex flex-col">
      <label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>

      {dropdownFields[key as keyof typeof dropdownFields] ? (
        <Select value={val as string} onValueChange={(value) => handleSelectChange(key, value)}>
          <SelectTrigger>{val}</SelectTrigger>
          <SelectContent>
            {dropdownFields[key as keyof typeof dropdownFields].map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : key === 'dob' || key === 'joiningDate' ? (
        <Input type="date" name={key} value={val as string} onChange={handleInputChange} />
      ) : (
        <Input name={key} value={val as string} onChange={handleInputChange} />
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


      <Tabs defaultValue={defaultTab} className="w-full">

      <TabsList className="flex gap-4 bg-blue-50 p-2 rounded-xl">
  <TabsTrigger
    value="skills"
    className="text-lg text-blue-800 font-semibold hover:text-white hover:bg-blue-600 px-4 py-2 rounded transition-all"
  >
    Skill Matrix
  </TabsTrigger>
  <TabsTrigger
    value="matches"
    className="text-lg text-purple-800 font-semibold hover:text-white hover:bg-purple-600 px-4 py-2 rounded transition-all"
  >
    Match Summary
  </TabsTrigger>
</TabsList>



<TabsContent value="skills">
  {player.skillTracking ? (
    <>
      {/* Scrollable Skill Matrix Section */}
      <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
        <section>
          {Object.entries(skillGroups).map(([group, skillsInGroup]) => (
            <Card key={group} className="mb-4 shadow-sm">
              <div
                onClick={() => toggleGroup(group)}
                className="cursor-pointer bg-blue-100 hover:bg-blue-200 px-4 py-4 rounded-lg transition-colors flex justify-between items-center"
              >
                <h4 className="text-xl font-bold text-gray-800">{group}</h4>
                <span className="text-gray-600 transition-transform duration-300 ease-in-out">
                  {expandedGroups[group] ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
                </span>
              </div>
              {expandedGroups[group] && (
                <CardContent className="p-4 space-y-4 bg-white rounded-b-lg">
                  {skillsInGroup.map(skill => (
                    <div key={skill} className="space-y-1">
                      <ShuttleSlider
                        label={skill}
                        value={skills[skill] || 1}
                        onChange={(val) => handleSkillChange(skill, val)}
                        disabled={userRole === 'Parent' || userRole === 'Tournament Organiser'}
                      />
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </section>

        {showSkillReport && (
          <SkillReportCardWrapper player={player} onClose={() => setShowSkillReport(false)} />
        )}

        {/* Coach Comments */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Coach Comments</CardTitle></CardHeader>
          <CardContent>
            <textarea
              className="w-full p-3 border border-gray-300 rounded text-black"
              rows={3}
              placeholder="Add coach comments..."
              value={coachComment}
              onChange={e => setCoachComment(e.target.value)}
            />
            <Button className="mt-3" onClick={handleSaveComment}>💾 Save Comments</Button>
          </CardContent>
        </Card>
      </div>
    </>
  ) : (
    <p className="text-gray-500 mt-4">Skill Tracking is not enabled for this player.</p>
  )}
</TabsContent>


       {/* 🔄 Replaced match card grid with tabular layout */}
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
                const formattedScore = typeof match.score === 'string'
                ? match.score.includes('-') ? match.score.split('-').join(' / ') : match.score
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
                          <td className="px-4 py-2">
                          {formattedScore}
                          </td>
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
    
  )};
      
    
