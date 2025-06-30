
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
//import { Card, CardContent } from '@/components/ui/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import ShuttleSlider from '@/components/ui/ShuttleSlider';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SkillReportCardWrapper from '@/components/SkillReportCardWrapper';


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
}

export default function PlayerDetailPage() {
  const [player, setPlayer] = useState<PlayerDetails | null>(null);   //Stores the full player object fetched from the backend.
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
  
{/*This useEffect runs whenever player changes, and its job is to:
Populate the editable form fields (setForm) excluding skillMatrix
Initialize the skill slider state with values from the database (setSkills) */} 


useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5050/api/players/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch player');
        const data = await res.json();
        setPlayer(data);
        const flatSkills = flattenSkills(data.skillMatrix);       // - This stores the entire player object fetched from the database into state.
            setSkills(flatSkills);    //This stores the current skill ratings from the database into the skills state, which is bound to your sliders in the UI.
            setInitialSkills(flatSkills);  //This stores a snapshot of the original skills when the profile loads.Detect changes in slider values
  
        setForm({
          _id: data._id,
          firstName: data.firstName,
          surName: data.surName || '',
          email: data.email,
          dob: data.dob || '',
          sex: data.sex,
          isJunior: data.isJunior,
          parentName: data.parentName || '',
          parentPhone: data.parentPhone || '',
          emergencyContactname: data.emergencyContactname || '',
          emergencyContactphonenumber: data.emergencyContactphonenumber || '',
          joiningDate: data.joiningDate,
          paymentStatus: data.paymentStatus,
          membershipStatus: data.membershipStatus || 'Active',
          coachName: data.coachName || '',
          playerType: data.playerType,
          clubRoles: data.clubRoles || [],
          level: data.level || '',
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
        const res = await fetch('http://localhost:5050/api/coaches', {
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
    setForm((prev) => prev ? { ...prev, [name]: value } : prev);
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
      const res = await fetch(`http://localhost:5050/api/players/${player._id}`, {
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
    const res = await fetch(`http://localhost:5050/api/players/${player?._id}`, {
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
      const res = await fetch(`http://localhost:5050/api/players/${id}/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skillMatrix: groupSkillsByCategory(changedSkills) }),
      });

      if (!res.ok) throw new Error('Failed to save skills');

      setInitialSkills(skills);
      setUnsavedChanges(false);
      toast.success('✅ Skill matrix updated successfully!');
    } catch (err) {
      console.error('❌ Failed to update skill matrix:', err);
      toast.error('❌ Failed to update skill matrix!');
    }
  };

  if (!player || !form) return <div className="p-6">Loading...</div>;

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

  const skillGroups: Record<string, string[]> = {
    'Movement Phases': ['Split-Step', 'Chasse Step', 'Lunging', 'Jumping'],
    'Grips & Grip Positions': ['Basic Grip', 'Panhandle', 'Bevel', 'Thumb Grip', 'Grip Adjustment'],
    'Forehand Strokes': ['Clear', 'Drop Shot', 'Smash', 'Slice Drop', 'Lift (Underarm)', 'Net Drop (Underarm)'],
    'Backhand Strokes': ['Clear (Backhand)', 'Drop Shot (Backhand)', 'Lift (Backhand)', 'Net Drop (Backhand)'],
    'Serve Techniques': ['Low Serve', 'High Serve', 'Flick Serve', 'Drive Serve'],
    'Footwork & Speed': ['6-Corner Footwork', 'Shadow Footwork', 'Pivot & Rotation', 'Recovery Steps'],
  };

  console.log('🧪 userRole:', userRole);

  const handleSkillReportOpen = () => {
    localStorage.setItem('selectedPlayerId', player._id); // 👈 Add this
    setShowSkillReport(true);
  };
  

  return (
    <div className="p-6 space-y-8">
      <section className="flex items-center gap-6">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-blue-600">
          <Image
            src={player.profileImage || (player.sex === 'Female' ? '/Avatar-female.png' : '/Avatar-male.png')}
            alt={player.firstName || 'Profile'}
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{form.firstName} {form.surName}</h2>
          <p className="text-sm text-gray-600">Level: {form.level || 'N/A'}</p>
          <p className="text-sm text-gray-700">Membership Status: {form.membershipStatus}</p>
          {(form.playerType === 'Coaching and Club Member' || form.playerType === 'Coaching only') && (
            <p className="text-sm text-gray-700">Coach Name: {form.coachName || 'N/A'}</p>
          )}
        </div>
      </section>

      <div className="flex justify-end flex-wrap gap-2 mt-4">
  <Button onClick={() => setShowDialog(true)}>Edit Personal Details</Button>
  <Button className="ml-2" onClick={handleSkillMatrixSave}>Save Skill Matrix</Button>
  <Button className="ml-2" onClick={handleSkillReportOpen}>
  Skill Export View
</Button>

{(normalizedRole === 'ClubAdmin' || normalizedRole === 'SuperAdmin') && (
  <Button variant="destructive" className="ml-2" onClick={() => setShowDeleteConfirm(true)}>
    Delete Player
  </Button>
)}

</div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Personal Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(form).map(([key, val]) => {
              if (excludedKeys.includes(key)) return null;
              if (key === 'isJunior') return (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-sm font-medium">Is Junior</label>
                  <Checkbox checked={form.isJunior} onCheckedChange={(val) => handleCheckboxChange('isJunior', !!val)} />
                </div>
              );
              if (key === 'coachName' && (form.playerType !== 'Coaching and Club Member' && form.playerType !== 'Coaching only')) return null;
              if (key === 'coachName') return (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium capitalize">Coach Name</label>
                  <Select value={form.coachName} onValueChange={(value) => handleSelectChange('coachName', value)}>
                    <SelectTrigger>{form.coachName || 'Select Coach'}</SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );

  // Delete Dialog            


  
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

      {(player.playerType === 'Coaching and Club Member' || player.playerType === 'Coaching only') && (
        <section>
          <h3 className="text-xl font-semibold mb-4 text-blue-700">Skill Matrix</h3>
          {Object.entries(skillGroups).map(([group, skillsInGroup]) => (

            <Card key={group} className="mb-4">
              <CardContent className="p-4">
                <h4 className="font-bold text-gray-800 mb-2">{group}</h4>
                <div className="space-y-6">
                  
                    {skillsInGroup.map((skill) => {
                        console.log('Skill:', skill, '→ Value:', skills[skill]);
                      
                        return (
                          <div key={skill} className="space-y-1">
                            <ShuttleSlider
                              label={skill}
                              value={skills[skill] || 1}
                              onChange={(val) => handleSkillChange(skill, val)}
                              disabled={userRole === 'Parent' || userRole === 'Tournament Organiser'}
                            />
                          </div>
                        );
                      })}
                  
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
   
      {console.log('🟢 showSkillReport value:', showSkillReport)}

   


      {showSkillReport && (
 <SkillReportCardWrapper player={player} onClose={() => setShowSkillReport(false)} />

)}


<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
    </DialogHeader>
    <p>This action will permanently delete this player. Are you sure?</p>
    <textarea
      className="w-full mt-2 p-2 border rounded"
      placeholder="Optional: reason for deleting this player"
      value={deleteReason}
      onChange={(e) => setDeleteReason(e.target.value)}
    />
    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDeletePlayer}>Yes, Delete Player</Button>
    </div>
  </DialogContent>
</Dialog>

      <ToastContainer />
    </div>
  );
}



/* 


 //with toastify
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import ShuttleSlider from '@/components/ui/ShuttleSlider';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface PlayerDetails {
  _id: string;
  firstName: string;
  surname: string;
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
}

export default function PlayerDetailPage() {
  const [player, setPlayer] = useState<PlayerDetails | null>(null);   //Stores the full player object fetched from the backend.
  const [coaches, setCoaches] = useState<string[]>([]);  //Stores a list of coach names as strings.
  const { id } = useParams();   // Extracts the id from the URL — e.g., /players/[id]
  const [form, setForm] = useState<Omit<PlayerDetails, 'skillMatrix' | 'skillHistory'> | null>(null); // Stores a copy of player data used specifically for the "Edit Personal Details" form.Separate from player to allow edits without affecting the original until saved
  const [showDialog, setShowDialog] = useState(false);   // Controls visibility of the "Edit Personal Details" dialog (modal).
  const [skills, setSkills] = useState<Record<string, number>>({});  //Stores the player's skill matrix (e.g., { "Jumping": 3, "Smash": 7 })
  const [initialSkills, setInitialSkills] = useState<Record<string, number>>({});
  const [userRole, setUserRole] = useState<string>('');  // Holds the logged-in user's role (Coach, Parent, etc.)
  const [unsavedChanges, setUnsavedChanges] = useState(false);  //Flags whether the user has made changes (e.g., to skill sliders) that haven’t been saved yet.

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
  
{/*This useEffect runs whenever player changes, and its job is to:
Populate the editable form fields (setForm) excluding skillMatrix
Initialize the skill slider state with values from the database (setSkills)  *


  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5050/api/players/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch player');
        const data = await res.json();
        setPlayer(data);
        const flatSkills = flattenSkills(data.skillMatrix);       // - This stores the entire player object fetched from the database into state.
            setSkills(flatSkills);    //This stores the current skill ratings from the database into the skills state, which is bound to your sliders in the UI.
            setInitialSkills(flatSkills);  //This stores a snapshot of the original skills when the profile loads.Detect changes in slider values
  
        setForm({
          _id: data._id,
          firstName: data.firstName,
          surname: data.surname || '',
          email: data.email,
          dob: data.dob || '',
          sex: data.sex,
          isJunior: data.isJunior,
          parentName: data.parentName || '',
          parentPhone: data.parentPhone || '',
          emergencyContactname: data.emergencyContactname || '',
          emergencyContactphonenumber: data.emergencyContactphonenumber || '',
          joiningDate: data.joiningDate,
          paymentStatus: data.paymentStatus,
          membershipStatus: data.membershipStatus || 'Active',
          coachName: data.coachName || '',
          playerType: data.playerType,
          clubRoles: data.clubRoles || [],
          level: data.level || '',
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
        const res = await fetch('http://localhost:5050/api/coaches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCoaches(data.map((coach: any) => `${coach.firstName} ${coach.lastName}`));
      } catch (err) {
        console.error('Failed to fetch coaches:', err);
      }
    };
    fetchCoaches();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => prev ? { ...prev, [name]: value } : prev);
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => prev ? { ...prev, [name]: value } : prev);
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setForm((prev) => prev ? { ...prev, [name]: checked } : prev);
  };

  const handleSave = async () => {
    if (!form || !player) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5050/api/players/${player._id}`, {
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
      const res = await fetch(`http://localhost:5050/api/players/${id}/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skillMatrix: groupSkillsByCategory(changedSkills) }),
      });

      if (!res.ok) throw new Error('Failed to save skills');

      setInitialSkills(skills);
      setUnsavedChanges(false);
      toast.success('✅ Skill matrix updated successfully!');
    } catch (err) {
      console.error('❌ Failed to update skill matrix:', err);
      toast.error('❌ Failed to update skill matrix!');
    }
  };

  if (!player || !form) return <div className="p-6">Loading...</div>;

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

  const skillGroups: Record<string, string[]> = {
    'Movement Phases': ['Split-Step', 'Chasse Step', 'Lunging', 'Jumping'],
    'Grips & Grip Positions': ['Basic Grip', 'Panhandle', 'Bevel', 'Thumb Grip', 'Grip Adjustment'],
    'Forehand Strokes': ['Clear', 'Drop Shot', 'Smash', 'Slice Drop', 'Lift (Underarm)', 'Net Drop (Underarm)'],
    'Backhand Strokes': ['Clear (Backhand)', 'Drop Shot (Backhand)', 'Lift (Backhand)', 'Net Drop (Backhand)'],
    'Serve Techniques': ['Low Serve', 'High Serve', 'Flick Serve', 'Drive Serve'],
    'Footwork & Speed': ['6-Corner Footwork', 'Shadow Footwork', 'Pivot & Rotation', 'Recovery Steps'],
  };

  return (
    <div className="p-6 space-y-8">
      <section className="flex items-center gap-6">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-blue-600">
          <Image
            src={player.profileImage || (player.sex === 'Female' ? '/Avatar-female.png' : '/Avatar-male.png')}
            alt={player.firstName || 'Profile'}
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{form.firstName} {form.surname}</h2>
          <p className="text-sm text-gray-600">Level: {form.level || 'N/A'}</p>
          <p className="text-sm text-gray-700">Membership Status: {form.membershipStatus}</p>
          {(form.playerType === 'Coaching and Club Member' || form.playerType === 'Coaching only') && (
            <p className="text-sm text-gray-700">Coach Name: {form.coachName || 'N/A'}</p>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={() => setShowDialog(true)}>Edit Personal Details</Button>
        <Button className="ml-4" onClick={handleSkillMatrixSave}>Save Skill Matrix</Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Personal Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(form).map(([key, val]) => {
              if (excludedKeys.includes(key)) return null;
              if (key === 'isJunior') return (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-sm font-medium">Is Junior</label>
                  <Checkbox checked={form.isJunior} onCheckedChange={(val) => handleCheckboxChange('isJunior', !!val)} />
                </div>
              );
              if (key === 'coachName' && (form.playerType !== 'Coaching and Club Member' && form.playerType !== 'Coaching only')) return null;
              if (key === 'coachName') return (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium capitalize">Coach Name</label>
                  <Select value={form.coachName} onValueChange={(value) => handleSelectChange('coachName', value)}>
                    <SelectTrigger>{form.coachName || 'Select Coach'}</SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
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

      {(player.playerType === 'Coaching and Club Member' || player.playerType === 'Coaching only') && (
        <section>
          <h3 className="text-xl font-semibold mb-4 text-blue-700">Skill Matrix</h3>
          {Object.entries(skillGroups).map(([group, skillsInGroup]) => (

            <Card key={group} className="mb-4">
              <CardContent className="p-4">
                <h4 className="font-bold text-gray-800 mb-2">{group}</h4>
                <div className="space-y-6">
                  
                    {skillsInGroup.map((skill) => {
                        console.log('Skill:', skill, '→ Value:', skills[skill]);
                      
                        return (
                          <div key={skill} className="space-y-1">
                            <ShuttleSlider
                              label={skill}
                              value={skills[skill] || 1}
                              onChange={(val) => handleSkillChange(skill, val)}
                              disabled={userRole === 'Parent' || userRole === 'Tournament Organiser'}
                            />
                          </div>
                        );
                      })}
                  
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <ToastContainer />
    </div>
  );
}


*/
