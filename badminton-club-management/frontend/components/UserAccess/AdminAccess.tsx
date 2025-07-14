'use client';

import { useEffect, useState } from 'react';
import UserTable from '@/components/UserAccess/UserTable';
import { filterAdminUsers } from '@/utils/permissions';

export default function AdminAccess({ showName = true, formatName }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const clubId = localStorage.getItem('clubId');
      const token = localStorage.getItem('token');
      if (!clubId || !token) return;

      try {
        const res = await fetch(`http://localhost:5050/api/players?clubId=${clubId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const filtered = filterAdminUsers(data).map(player => ({
          ...player,
          name: formatName ? formatName(player) : '',
          role: 'ClubAdmin',
          status: 'Pending',
          permissions: {
            dashboard: false,
            finance: false,
          },
        }));
        setUsers(filtered);
      } catch (err) {
        console.error('Failed to load admin users:', err);
      }
    };

    fetchPlayers();
  }, [formatName]);

  return <UserTable users={users} type="admin" showName={showName} />;
}
