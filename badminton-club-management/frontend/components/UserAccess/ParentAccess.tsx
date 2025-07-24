'use client';

import { useEffect, useState } from 'react';
import UserTable from '@/components/UserAccess/UserTable';
import { initializePermissions } from '@/utils/permissions';
import { toast } from 'react-toastify';

export default function ParentAccess() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const clubId = localStorage.getItem('clubId');
      const token = localStorage.getItem('token');
      if (!clubId || !token) return;

      try {
        const resPlayers = await fetch(`http://localhost:5050/api/players?clubId=${clubId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const players = await resPlayers.json();

        console.log('🎯 Players fetched:', players);

        const filtered = players.filter(u => u.age < 18 || u.playerType === 'Coaching only' || u.playerType === 'Junior Club Member');

        const initialized = filtered.map(player => {
          const email = player?.email ?? player?.guardianEmail ?? '';
          return initializePermissions({
            ...player,
            status: 'Not Created',
            permissions: { parentDashboard: false },
            role: 'Parents',
            email,
            linkedUserExists: false,
            firstName: player.firstName,
            surName: player.surName,
          });
        });

        setUsers(initialized);
      } catch (err) {
        console.error('Failed to fetch players:', err);
        toast.error('Failed to load player data');
      }
    };

    fetchPlayers();
  }, []);

  const handleCreateLogin = async (user, password) => {
    console.log('🧪 handleCreateLogin →', { user });

    if (!user?.email) {
      console.warn('⚠️ No email found in user:', user);
      toast.error('No email found for this user');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5050/api/users?email=${user.email}`);
      const existingUser = await res.json();

      if (existingUser && existingUser.email) {
        toast.info('User already exists with this email');
        return;
      }

      const payload = {
        email: user.email,
        password,
        role: 'Parents',
        permissions: { parentDashboard: true },
        linkedPlayerId: user._id,
      };

      const createRes = await fetch('http://localhost:5050/api/users/create-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) throw new Error('Request failed');

      toast.success('Login created successfully');

      const updated = [...users];
      const idx = updated.findIndex(u => u._id === user._id);
      updated[idx].status = 'Active';
      updated[idx].linkedUserExists = true;
      updated[idx].permissions = payload.permissions;
      setUsers(updated);
    } catch (err) {
      console.error('Login creation error:', err);
      toast.error('Failed to create login');
    }
  };

  const handleToggleStatus = async (idx) => {
    const updatedUsers = [...users];
    const user = updatedUsers[idx];
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';

    try {
      const res = await fetch('http://localhost:5050/api/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newStatus }),
      });

      if (!res.ok) throw new Error('Request failed');
      updatedUsers[idx].status = newStatus;
      setUsers(updatedUsers);
      toast.success('Status updated');
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
    }
  };

  const handleSavePermissions = async (idx) => {
    const user = users[idx];
    try {
      const res = await fetch('http://localhost:5050/api/users/save-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, permissions: user.permissions }),
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success('Permissions saved');
    } catch (err) {
      console.error('Permissions save error:', err);
      toast.error('Failed to save permissions');
    }
  };

  const handleRoleChange = (idx, newRole) => {
    const updated = [...users];
    updated[idx].role = newRole;
    setUsers(updated);
  };

  const handleTogglePermission = (idx, key) => {
    const updatedUsers = [...users];
    const current = updatedUsers[idx]?.permissions?.[key] ?? false;

    if (!updatedUsers[idx].permissions) {
      updatedUsers[idx].permissions = {};
    }

    updatedUsers[idx].permissions[key] = !current;
    setUsers(updatedUsers);
  };

  return (
    <UserTable
      users={users}
      type="parent"
      onCreateLogin={handleCreateLogin}
      onToggleStatus={handleToggleStatus}
      onSavePermissions={handleSavePermissions}
      onRoleChange={handleRoleChange}
      onTogglePermission={handleTogglePermission}
      showName={true}
      formatName={(player) => `${player.firstName} ${player.surName}`}
    />
  );
}
