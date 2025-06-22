// app/dashboard/clubadmin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, UserPlus, Users, BarChart2, CalendarCheck2, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const navItems = [
  { label: 'Home', icon: Home, route: '/dashboard/clubadmin' },
  { label: 'Add Player', icon: UserPlus, route: '/dashboard/clubadmin/add-player' },
  { label: 'Player Card', icon: Users, route: '/dashboard/clubadmin/player-card' },
  { label: 'Pegboard', icon: BarChart2, route: '/dashboard/clubadmin/pegboard' },
  { label: 'Tournament', icon: CalendarCheck2, route: '/dashboard/clubadmin/tournament' },
];

export default function ClubAdminDashboard() {
  const [clubName, setClubName] = useState('');
  const [userRole, setUserRole] = useState('Club Admin');
  const router = useRouter();

  useEffect(() => {
    const storedClub = localStorage.getItem('clubName');
    const storedRole = localStorage.getItem('role');
    if (storedClub) setClubName(storedClub);
    if (storedRole) setUserRole(storedRole);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b text-xl font-bold text-blue-600">
            {clubName || 'Your Club'}
          </div>
          <nav className="mt-6 space-y-2 px-4">
            {navItems.map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(item.route)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-blue-100 transition"
              >
                <item.icon size={20} className="text-blue-500" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Profile section */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Image
              src="/avatar-default.png"
              alt="profile"
              width={40}
              height={40}
              className="rounded-full border"
            />
            <div>
              <p className="font-semibold text-sm">{userRole}</p>
              <div className="flex gap-2 mt-1 text-xs text-gray-500">
                <Settings size={14} className="cursor-pointer hover:text-blue-500" />
                <LogOut size={14} className="cursor-pointer hover:text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <motion.h1
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Welcome to {clubName || 'Club'} Dashboard
        </motion.h1>

        {/* Additional content can go here */}
        <div className="text-gray-600">Select an option from the menu to get started.</div>
      </main>
    </div>
  );
}


/*


// app/dashboard/clubadmin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, UserPlus, Users, BarChart2, CalendarCheck2, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function ClubAdminDashboard() {
  const [clubName, setClubName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedClub = localStorage.getItem('clubName');
    if (storedClub) setClubName(storedClub);
  }, []);

  const navItems = [
    { label: 'Home', icon: Home, route: '/clubadmin/home' },
    { label: 'Add Player', icon: UserPlus, route: '/clubadmin/add-player' },
    { label: 'Player Card', icon: Users, route: '/clubadmin/player-card' },
    { label: 'Smart Pegboard', icon: BarChart2, route: '/clubadmin/pegboard' },
    { label: 'Organise Tournament', icon: CalendarCheck2, route: '/clubadmin/tournament' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      //  Top Navigation Bar 
      <div className="flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-700">🏸 {clubName || 'Club'} Admin Panel</h1>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/club-admin/settings')}>
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
            <Image
              src="/default-avatar.png" // Replace with user profile image if available
              alt="Profile"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      //  Main Content Grid 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {navItems.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="cursor-pointer hover:shadow-lg transition-transform"
              onClick={() => router.push(item.route)}
            >
              <CardContent className="flex flex-col items-center justify-center h-40">
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

*/

