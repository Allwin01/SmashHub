'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  UserPlus,
  Users,
  BarChart2,
  CalendarCheck2,
  LogOut,
  Settings,
  CalendarClock,
  DollarSign,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function ClubAdminLayout({ children }: { children: ReactNode }) {
  const [clubName, setClubName] = useState('');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('clubName');
    if (name) setClubName(name);
  }, []);

  if (!mounted) return null;

  const navItems = [
    { label: 'Dashboard', icon: Home, route: '/dashboard/clubadmin' },
    { label: 'Add Player', icon: UserPlus, route: '/dashboard/clubadmin/add-player' },
    { label: 'Player Card', icon: Users, route: '/dashboard/clubadmin/player-card' },
    { label: 'Smart Pegboard', icon: BarChart2, route: '/dashboard/clubadmin/pegboard' },
    { label: 'Tournament', icon: CalendarCheck2, route: '/dashboard/clubadmin/tournament' },
    { label: 'Player Attendance', icon: CalendarClock, route: '/dashboard/clubadmin/player-attendance' },
    { label: 'Financial Dashboard', icon: DollarSign, route: '/dashboard/clubadmin/financials' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-600 text-white flex flex-col p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">{clubName || 'Your Club'}</h2>
          <div className="mt-4 flex items-center gap-2">
            <Image
              src="/Avatar-male.png"
              alt="Admin profile"
              width={40}
              height={40}
              className="rounded-full border"
            />
            <div>
              <p className="font-semibold">Club Admin</p>
              <p className="text-xs text-blue-100">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {navItems.map(({ label, icon: Icon, route }) => (
            <button
              key={label}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors hover:bg-blue-700 ${
                pathname === route ? 'bg-blue-900' : ''
              }`}
              onClick={() => router.push(route)}
            >
              <Icon className="mr-3" size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <Button variant="ghost" className="text-white w-full justify-start px-3" onClick={() => alert('Settings')}>
            <Settings size={18} className="mr-2" /> Settings
          </Button>
          <Button variant="destructive" className="w-full justify-start px-3" onClick={() => alert('Logging out...')}>
            <LogOut size={18} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
