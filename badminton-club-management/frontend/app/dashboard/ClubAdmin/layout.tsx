// ClubAdminLayout.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  UserPlus, Users, BarChart2, CalendarCheck2, LogOut, CalendarClock, DollarSign, ShieldCheck, LayoutDashboard, Settings
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent
} from '@/components/ui/tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { saveSidebarTheme } from '@/utils/saveSidebarTheme';

export default function ClubAdminLayout({ children }: { children: ReactNode }) {
  const [clubName, setClubName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarColor, setSidebarColor] = useState('blue');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('clubName');
    const storedColor = localStorage.getItem('sidebarColor');
    if (name) setClubName(name);
    if (storedColor) setSidebarColor(storedColor);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('clubId');
      localStorage.removeItem('clubName');
      toast.success('✅ Logged out successfully');
      window.location.href = '/';
    }
  };

  const handleColorChange = (color: string) => {
    setSidebarColor(color);
    localStorage.setItem('sidebarColor', color);
  };

  const handleSaveTheme = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No token found. Please login again.');
      return;
    }
    const result = await saveSidebarTheme(sidebarColor, token);
    if (result.success) {
      toast.success('🎉 Preferences saved to your profile!');
      setSettingsOpen(false);
    } else {
      toast.error('❌ Failed to save preferences.');
    }
  };

  const getSidebarGradient = () => {
    switch (sidebarColor) {
      case 'green': return 'from-green-800 to-green-600';
      case 'purple': return 'from-purple-800 to-purple-600';
      case 'red': return 'from-red-800 to-red-600';
      case 'orange': return 'from-orange-700 to-orange-500';
      case 'teal': return 'from-teal-700 to-teal-500';
      case 'indigo': return 'from-indigo-800 to-indigo-600';
      case 'pinkviolet': return 'from-pink-600 via-purple-500 to-violet-600';
      case 'amberlime': return 'from-amber-600 via-lime-500 to-lime-300';
      case 'slatezinc': return 'from-slate-700 via-zinc-500 to-neutral-300';
      default: return 'from-blue-800 to-blue-600';
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard/clubadmin' },
    { label: 'Add Player', icon: UserPlus, route: '/dashboard/clubadmin/add-player' },
    { label: 'Player Card', icon: Users, route: '/dashboard/clubadmin/player-card' },
    { label: 'Smart Pegboard', icon: BarChart2, route: '/dashboard/clubadmin/pegboard' },
    { label: 'Tournament', icon: CalendarCheck2, route: '/dashboard/clubadmin/tournament' },
    { label: 'Player Attendance', icon: CalendarClock, route: '/dashboard/clubadmin/player-attendance' },
    { label: 'Club Ledger', icon: DollarSign, route: '/dashboard/clubadmin/finance' },
    { label: 'Access Control', icon: ShieldCheck, route: '/dashboard/clubadmin/UserPermission' },
    { label: 'Captains Squard', icon: ShieldCheck, route: '/dashboard/clubadmin/captainsquard' },
  ];

  if (!mounted) return null;

  const renderSidebar = (
    <motion.aside
      initial={{ width: 80 }}
      animate={{ width: isSidebarExpanded ? 240 : 80 }}
      transition={{ duration: 0.3 }}
      className={`h-screen overflow-y-auto bg-gradient-to-b transition-[background] duration-500 ${getSidebarGradient()} text-white flex flex-col justify-between`}
    >
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {isSidebarExpanded && <span className="font-semibold text-lg">Club Admin</span>}
          </div>
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="text-2xl font-bold">
            {isSidebarExpanded ? '«' : '»'}
          </button>
        </div>
        <nav className="flex-1 flex flex-col space-y-2 mt-6 px-2 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, route }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(route)}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/20 ${
                    pathname === route ? 'bg-white/20' : ''
                  }`}
                >
                  <Icon size={22} />
                  {isSidebarExpanded && <span>{label}</span>}
                </button>
              </TooltipTrigger>
              {!isSidebarExpanded && (
                <TooltipContent side="right" className="bg-white text-black px-2 py-1 rounded shadow">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </div>

      <div className={`flex flex-col space-y-2 mb-4 px-2 ${isSidebarExpanded ? 'items-start' : 'items-center'}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20"
            >
              <Settings size={22} />
              {isSidebarExpanded && <span>Settings</span>}
            </button>
          </TooltipTrigger>
          {!isSidebarExpanded && (
            <TooltipContent side="right" className="bg-white text-black px-2 py-1 rounded shadow">
              Settings
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleLogout} className="flex items-center gap-3 p-2 hover:bg-red-600 rounded-lg">
              <LogOut size={22} />
              {isSidebarExpanded && <span>Logout</span>}
            </button>
          </TooltipTrigger>
          {!isSidebarExpanded && (
            <TooltipContent side="right" className="bg-white text-black px-2 py-1 rounded shadow">
              Logout
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </motion.aside>
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <div className="hidden md:flex">{renderSidebar}</div>
        <main className="flex-1 bg-gray-50 p-6 overflow-auto w-full">{children}</main>
        <ToastContainer position="top-right" autoClose={2000} />

        <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-80 rounded bg-white p-4 shadow-lg">
              <h2 className="text-lg font-bold mb-4">Choose Theme</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Blue', value: 'blue', class: 'from-blue-800 to-blue-600' },
                  { name: 'Green', value: 'green', class: 'from-green-800 to-green-600' },
                  { name: 'Purple', value: 'purple', class: 'from-purple-800 to-purple-600' },
                  { name: 'Red', value: 'red', class: 'from-red-800 to-red-600' },
                  { name: 'Orange', value: 'orange', class: 'from-orange-700 to-orange-500' },
                  { name: 'Teal', value: 'teal', class: 'from-teal-700 to-teal-500' },
                  { name: 'Indigo', value: 'indigo', class: 'from-indigo-800 to-indigo-600' },
                  { name: 'Pink & Violet', value: 'pinkviolet', class: 'from-pink-600 via-purple-500 to-violet-600' },
                  { name: 'Amber & Lime', value: 'amberlime', class: 'from-amber-600 via-lime-500 to-lime-300' },
                  { name: 'Slate & Zinc', value: 'slatezinc', class: 'from-slate-700 via-zinc-500 to-neutral-300' }
                ].map(({ name, value, class: bg }) => (
                  <button
                    key={value}
                    onClick={() => handleColorChange(value)}
                    className={`h-10 w-full rounded shadow-md transition-all border-2 border-white/10 hover:scale-105 ${
                      sidebarColor === value ? 'ring-2 ring-blue-500' : ''
                    } bg-gradient-to-r ${bg}`}
                    title={name + ' Theme'}
                  />
                ))}
              </div>
              <button
                onClick={handleSaveTheme}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Save Preference
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </TooltipProvider>
  );
}
