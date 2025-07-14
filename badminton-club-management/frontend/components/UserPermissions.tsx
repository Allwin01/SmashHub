'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UserTable from '@/components/UserAccess/UserTable';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash.debounce';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function UserPermissions() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [financeCount, setFinanceCount] = useState(0);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUserIndex, setLoginUserIndex] = useState(null);
  const [juniorMembers, setJuniorMembers] = useState([]);
  const [adultMembers, setAdultMembers] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [isExternalCoach, setIsExternalCoach] = useState(false);
  const [externalCoachDetails, setExternalCoachDetails] = useState({ name: '', phone: '' });
  const [password, setPassword] = useState('');
  const [parentInfo, setParentInfo] = useState({});

  const togglePermission = (index, key) => {
    setUsers(prev => prev.map((u, i) => {
      if (i !== index) return u;
      const updatedPermissions = { ...u.permissions };

      if (key === 'finance' && !u.permissions.finance) {
        const currentFinance = prev.filter(u => u.permissions.finance).length;
        if (currentFinance >= 3) {
          toast.warning('Finance access limit (3 users) reached.');
          return u;
        }
      }

      updatedPermissions[key] = !updatedPermissions[key];
      setLogs(logs => [...logs, `${u.name} permission changed: ${key} -> ${updatedPermissions[key]}`]);
      return { ...u, permissions: updatedPermissions };
    }));
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      const clubId = localStorage.getItem('clubId');
      const token = localStorage.getItem('token');
      if (!clubId || !token) return;

      try {
        const res = await fetch(`http://localhost:5050/api/players?clubId=${clubId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', data);
          return;
        }

        const formatted = data.map(player => ({
          name: `${player.firstName} ${player.surName}`,
          email: player.email,
          age: player.age,
          playerType: player.playerType || 'Unknown',
          role: 'None',
          status: 'Inactive',
          permissions: {
            pegBoard: false,
            playerProfile: false,
            skillMatrix: false,
            attendance: false,
            finance: false,
            parentDashboard: false,
          },
        }));
        setUsers(formatted);
        setJuniorMembers(formatted.filter(p => p.age < 18));
        setAdultMembers(formatted.filter(p => p.age >= 18));
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    fetchPlayers();
  }, []);

  const handleRoleChange = async (index, newRole) => {
    const confirmed = confirm(`Are you sure you want to change ${users[index].name}'s role to ${newRole}?`);
    if (!confirmed) return;
    const updated = [...users];
    updated[index].role = newRole;
    setUsers(updated);
    setLogs(prev => [...prev, `${users[index].name} role changed to ${newRole}`]);

    await fetch('/api/users/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[index].email, newRole })
    });
  };

  const handleToggleStatus = async (index) => {
    const newStatus = users[index].status === 'Active' ? 'Disabled' : 'Active';
    const confirmed = confirm(`Are you sure you want to set ${users[index].name}'s status to ${newStatus}?`);
    if (!confirmed) return;
    const updated = [...users];
    updated[index].status = newStatus;
    setUsers(updated);
    setLogs(prev => [...prev, `${users[index].name} status changed to ${newStatus}`]);

    await fetch('/api/users/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[index].email, newStatus })
    });
  };

  const handleSavePermissions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users/save-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(users),
      });

      if (!res.ok) throw new Error('Failed to save permissions');
      toast.success('Permissions saved successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('An error occurred while saving permissions');
    }
  };

  const handleCreateLogin = (index) => {
    setLoginUserIndex(index);
    setPassword('');
    setShowLoginModal(true);
  };

  const debouncedSearch = debounce((val) => setSearch(val), 300);

  const handleSubmitLogin = async () => {
    const user = users[loginUserIndex];

    const payload = {
      email: user.email,
      password,
      role: user.role,
      childLinked: user.role === 'Parent' ? selectedChildId : undefined,
      coachLinked: user.role === 'Coach' ? (!isExternalCoach ? selectedCoachId : null) : undefined,
      externalCoach: user.role === 'Coach' && isExternalCoach ? externalCoachDetails : undefined,
      permissions: user.role === 'Parent' ? { parentDashboard: true } : user.permissions
    };

    try {
      const res = await fetch('/api/users/create-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Login creation failed');
      toast.success('Login created successfully');
      setShowLoginModal(false);
    } catch (err) {
      console.error('Login creation error:', err);
      toast.error('Failed to create login');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-700">User Access & Permissions</h2>

      <Tabs defaultValue="parent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="parent">Parent Access</TabsTrigger>
          <TabsTrigger value="member">Member Access</TabsTrigger>
          <TabsTrigger value="admin">Admin Access</TabsTrigger>
        </TabsList>

        <TabsContent value="parent">
          <UserTable 
            users={users.filter(u => u.age < 18 || u.playerType === 'Coaching only' || u.playerType === 'Junior club member')}
            type="parent"
            onRoleChange={handleRoleChange}
            onTogglePermission={togglePermission}
            onToggleStatus={handleToggleStatus}
            onCreateLogin={handleCreateLogin}
          />
        </TabsContent>

        <TabsContent value="member">
          <UserTable 
            users={users.filter(u => (u.age >= 18 || u.playerType === 'Club Member' || u.playerType === 'Adult club member') && (u.role === 'Coach' || u.role === 'Team Captain' || u.role === 'None'))}
            type="member"
            onRoleChange={handleRoleChange}
            onTogglePermission={togglePermission}
            onToggleStatus={handleToggleStatus}
            onCreateLogin={handleCreateLogin}
          />
        </TabsContent>

        <TabsContent value="admin">
          <UserTable 
            users={users.filter(u => u.age >= 18 || u.playerType === 'Club Member' || u.playerType === 'Adult club member')}
            type="admin"
            onRoleChange={handleRoleChange}
            onTogglePermission={togglePermission}
            onToggleStatus={handleToggleStatus}
            onCreateLogin={handleCreateLogin}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSavePermissions} className="mt-2">Save All Changes</Button>
      </div>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Change Log</h3>
          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
            {logs.length > 0 ? logs.map((log, i) => <li key={i}>{log}</li>) : <li>No changes made yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
