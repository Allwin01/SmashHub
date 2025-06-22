/*// ClubAdminDashboard.tsx
'use client';

import React from 'react';

export default function ClubAdminDashboard() {
  return (
    <div className="p-6 text-center text-2xl font-bold text-blue-700">
      ✅ Club Admin Dashboard is working!
    </div>
  );
}

*/

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, UserPlus, Users, BarChart2, CalendarCheck2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClubAdminDashboard() {
  const [clubName, setClubName] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Fetch club info from API or token/session storage
    const storedClub = localStorage.getItem('clubName');
    if (storedClub) {
      setClubName(storedClub);
    }
  }, []);

  const navItems = [
    { label: 'Home', icon: Home, route: '/club-admin/home' },
    { label: 'Add Player', icon: UserPlus, route: '/club-admin/add-player' },
    { label: 'Player Card', icon: Users, route: '/club-admin/player-card' },
    { label: 'Smart Pegboard', icon: BarChart2, route: '/club-admin/pegboard' },
    { label: 'Organise Tournament', icon: CalendarCheck2, route: '/club-admin/tournament' },
  ];

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <motion.h1
        className="text-3xl font-bold text-center text-blue-800 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Welcome to {clubName || 'Club'} Admin Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => router.push(item.route)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <item.icon size={40} className="text-blue-700 mb-4" />
                <p className="text-lg font-semibold text-blue-900">{item.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


