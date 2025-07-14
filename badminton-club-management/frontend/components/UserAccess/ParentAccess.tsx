'use client';

import { useEffect, useState } from 'react';
import UserTable from '@/components/UserAccess/UserTable';
import { filterParentUsers } from '@/utils/permissions';

export default function ParentAccess({ showName = true, formatName }) {
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
        const filtered = filterParentUsers(data).map(player => ({
          ...player,
          name: formatName ? formatName(player) : '',
          role: 'Parent',
          status: 'Pending',
          permissions: {
            dashboard: false,
          },
        }));
        setUsers(filtered);
      } catch (err) {
        console.error('Failed to load parent users:', err);
      }
    };

    fetchPlayers();
  }, [formatName]);

  return <UserTable users={users} type="parent" showName={showName} />;
}
