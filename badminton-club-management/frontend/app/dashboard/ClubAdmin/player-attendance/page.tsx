// Cleaned + Enhanced Player Attendance Page with improved chart visuals and dual line chart
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BadgeCheck, XCircle } from 'lucide-react';

interface Player {
  _id: string;
  firstName: string;
  surname: string;
  profilePicUrl?: string;
  playerType?: string;
}

interface AttendanceStats {
  period: string;
  clubMember?: number;
  coachingOnly?: number;
}

export default function PlayerAttendance() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [lastFetchedDate, setLastFetchedDate] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [selectedType, setSelectedType] = useState('Club Member');
  const [selectedTab, setSelectedTab] = useState('Club Member');
  const [presentOnly, setPresentOnly] = useState(false);

  useEffect(() => {
    fetchPlayers();
    fetchStats();
    fetchAttendanceForDate(date);
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/players/by-club', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch players');
      const data: Player[] = await res.json();
      const sorted = data.sort((a, b) => (a.firstName + a.surname).localeCompare(b.firstName + b.surname));
      setPlayers(sorted.map(p => ({ ...p, playerType: p.playerType?.trim() })));
    } catch (err) {
      console.error('Error loading players:', err);
    }
  };

  const fetchAttendanceForDate = async (targetDate: string) => {
    try {
      const token = localStorage.getItem('token');
      const clubId = localStorage.getItem('clubId');
      if (!token || !clubId) throw new Error('Missing token or clubId');

      const res = await fetch(`http://localhost:5050/api/players/attendances?date=${targetDate}&clubId=${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      const mapped: Record<string, boolean> = {};
      data.forEach((entry: any) => {
        mapped[entry.id] = entry.status === 'Present';
      });
      setAttendance(mapped);
      setLastFetchedDate(targetDate);
    } catch (err) {
      console.error('❌ Failed to fetch attendance:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const clubId = localStorage.getItem('clubId');
      const res = await fetch(`http://localhost:5050/api/attendance/stats-daily?clubId=${clubId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Failed with ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('❌ Failed to fetch stats:', err);
    }
  };

  const handleToggle = (playerId: string, checked: boolean | string) => {
    setAttendance(prev => ({ ...prev, [playerId]: !!checked }));
  };

  const handleMarkAllPresent = () => {
    const newAttendance = { ...attendance };
    players.forEach(p => {
      if (p.playerType === selectedType) newAttendance[p._id] = true;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    const weekday = format(new Date(date), 'EEEE');
    const records = Object.entries(attendance).map(([playerId, isPresent]) => ({
      playerId,
      date,
      day: weekday,
      status: isPresent ? 'Present' : 'Absent',
    }));

    try {
      const res = await fetch('http://localhost:5050/api/players/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ attendance: records, clubId: localStorage.getItem('clubId') }),
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      toast.success('✅ Attendance saved!');
      await fetchStats();
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('❌ Failed to save attendance');
    }
  };

  const renderPlayers = (typeFilter: string) => {
    const filtered = players.filter(p => (p.playerType?.trim().toLowerCase() === typeFilter.toLowerCase()));
    const finalList = presentOnly ? filtered.filter(p => attendance[p._id]) : filtered;
    const presentCount = filtered.filter(p => attendance[p._id]).length;

    if (filtered.length === 0) return <div className="text-center text-sm text-gray-400 py-4">No players found for {typeFilter}.</div>;

    return (
      <>
        <div className="text-right text-xs text-gray-500 italic pb-1">
          {presentCount} marked Present — Showing {finalList.length} {typeFilter} players
        </div>
        {finalList.map(player => (
          <div key={player._id} className={`flex items-center justify-between border-b py-2 ${attendance[player._id] === false ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              {player.profilePicUrl ? (
                <Image src={player.profilePicUrl} alt="Profile" width={40} height={40} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                  {player.firstName?.[0] || ''}{player.surname?.[0] || ''}
                </div>
              )}
              <span className="font-medium text-base md:text-lg">{player.firstName} {player.surname}</span>
            </div>
            <div className="flex items-center gap-2">
              {attendance[player._id] ? (
                <BadgeCheck className="text-green-500" />
              ) : (
                <XCircle className="text-gray-400" />
              )}
              <Checkbox
                checked={attendance[player._id] || false}
                onChange={(e) => handleToggle(player._id, e.target.checked)}
                className={`w-6 h-6 ${attendance[player._id] ? 'border-green-600 ring-1 ring-green-500 animate-pulse' : 'border-gray-300'}`}
              />
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Club Attendance Trend</h2>
      </div>

      <div className="h-64 mb-6">
        {stats.length === 0 ? (
          <div className="text-center text-sm text-gray-500 pt-10">No attendance data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={(val) => format(parseISO(val), 'dd MMM')} tick={{ angle: -20, dy: 10 }} />
              <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                formatter={(value: any, name: string) => [`${value}%`, name]}
                contentStyle={{ backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '14px' }} />
              <Line type="monotone" dataKey="clubMember" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Club Member" isAnimationActive={true} />
              <Line type="monotone" dataKey="coachingOnly" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 2" name="Coaching Only" isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <Input type="date" value={date} onChange={async (e) => {
          const newDate = e.target.value;
          setDate(newDate);
          if (newDate !== lastFetchedDate) {
            setAttendance({});
            await fetchAttendanceForDate(newDate);
          }
        }} className="w-[180px]" />
        <div className="flex gap-2">
          <Button onClick={handleMarkAllPresent}>Mark All Present</Button>
          <Button variant={presentOnly ? 'default' : 'outline'} onClick={() => setPresentOnly(p => !p)}>
            {presentOnly ? 'Show All' : 'Show Present Only'}
          </Button>
          <Button onClick={handleSave}>Save Attendance</Button>
        </div>
      </div>

      <Tabs defaultValue="Club Member" onValueChange={(val) => {
        setSelectedTab(val);
        setSelectedType(val);
      }}>
        <TabsList className="mb-4 text-base md:text-lg">
          <TabsTrigger value="Club Member">Club Member</TabsTrigger>
          <TabsTrigger value="Coaching only">Coaching Only</TabsTrigger>
        </TabsList>

        <TabsContent value="Club Member">
          <Card><CardContent>{renderPlayers('Club Member')}</CardContent></Card>
        </TabsContent>

        <TabsContent value="Coaching only">
          {players.filter(p => p.playerType === 'Coaching only').length === 0 && (
            <div className="text-red-500 text-sm px-4 py-2 font-medium">⚠️ No players labeled as 'Coaching Only' found in database.</div>
          )}
          <Card><CardContent>{renderPlayers('Coaching only')}</CardContent></Card>
        </TabsContent>
      </Tabs>
      <ToastContainer />
    </div>
  );
}



{/*}

// Cleaned + Enhanced Player Attendance Page with requested UX features
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { BadgeCheck, XCircle } from 'lucide-react';

interface Player {
  _id: string;
  firstName: string;
  surname: string;
  profilePicUrl?: string;
  playerType?: string;
}

interface AttendanceStats {
  period: string;
  percentage: number;
  type?: string;
}

export default function PlayerAttendance() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [lastFetchedDate, setLastFetchedDate] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [selectedType, setSelectedType] = useState('Club Member');
  const [selectedTab, setSelectedTab] = useState('Club Member');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [presentOnly, setPresentOnly] = useState(false);

  useEffect(() => {
    fetchPlayers();
    fetchStats();
    fetchAttendanceForDate(date);
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/players/by-club', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch players');
      const data: Player[] = await res.json();
      const sorted = data.sort((a, b) => (a.firstName + a.surname).localeCompare(b.firstName + b.surname));
      setPlayers(sorted.map(p => ({ ...p, playerType: p.playerType?.trim() })));
    } catch (err) {
      console.error('Error loading players:', err);
    }
  };

  const fetchAttendanceForDate = async (targetDate: string) => {
    try {
      const token = localStorage.getItem('token');
      const clubId = localStorage.getItem('clubId');
      if (!token || !clubId) throw new Error('Missing token or clubId');

      const res = await fetch(`http://localhost:5050/api/players/attendances?date=${targetDate}&clubId=${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      const mapped: Record<string, boolean> = {};
      data.forEach((entry: any) => {
        mapped[entry.id] = entry.status === 'Present';
      });
      setAttendance(mapped);
      setLastFetchedDate(targetDate);
    } catch (err) {
      console.error('❌ Failed to fetch attendance:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const clubId = localStorage.getItem('clubId');
      const res = await fetch(`http://localhost:5050/api/attendance/stats?clubId=${clubId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Failed with ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('❌ Failed to fetch stats:', err);
    }
  };

  const handleToggle = (playerId: string, checked: boolean | string) => {
    setAttendance(prev => ({ ...prev, [playerId]: !!checked }));
  };

  const handleMarkAllPresent = () => {
    const newAttendance = { ...attendance };
    players.forEach(p => {
      if (p.playerType === selectedType) newAttendance[p._id] = true;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    const weekday = format(new Date(date), 'EEEE');
    const records = Object.entries(attendance).map(([playerId, isPresent]) => ({
      playerId,
      date,
      day: weekday,
      status: isPresent ? 'Present' : 'Absent',
    }));

    try {
      const res = await fetch('http://localhost:5050/api/players/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ attendance: records, clubId: localStorage.getItem('clubId') }),
      });

      if (!res.ok) throw new Error('Failed to save attendance');
      toast.success('✅ Attendance saved!');
      await fetchStats();
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('❌ Failed to save attendance');
    }
  };

  const renderPlayers = (typeFilter: string) => {
    const filtered = players.filter(p => (p.playerType?.trim().toLowerCase() === typeFilter.toLowerCase()));
    const finalList = presentOnly ? filtered.filter(p => attendance[p._id]) : filtered;
    const presentCount = filtered.filter(p => attendance[p._id]).length;

    if (filtered.length === 0) return <div className="text-center text-sm text-gray-400 py-4">No players found for {typeFilter}.</div>;

    return (
      <>
        <div className="text-right text-xs text-gray-500 italic pb-1">
          {presentCount} marked Present — Showing {finalList.length} {typeFilter} players
        </div>
        {finalList.map(player => (
          <div key={player._id} className={`flex items-center justify-between border-b py-2 ${attendance[player._id] === false ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              {player.profilePicUrl ? (
                <Image src={player.profilePicUrl} alt="Profile" width={40} height={40} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                  {player.firstName?.[0] || ''}{player.surname?.[0] || ''}
                </div>
              )}
              <span className="font-medium text-base md:text-lg">{player.firstName} {player.surname}</span>
            </div>
            <div className="flex items-center gap-2">
              {attendance[player._id] ? (
                <BadgeCheck className="text-green-500" />
              ) : (
                <XCircle className="text-gray-400" />
              )}
              <Checkbox
                checked={attendance[player._id] || false}
                onChange={(e) => handleToggle(player._id, e.target.checked)}
                className={`w-6 h-6 ${attendance[player._id] ? 'border-green-600 ring-1 ring-green-500 animate-pulse' : 'border-gray-300'}`}
              />
            </div>
          </div>
        ))}
      </>
    );
  };

  const filteredStats = Array.isArray(stats) ? stats : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Club Attendance Trend</h2>
        <div className="space-x-2">
          <Button variant={chartType === 'line' ? 'default' : 'outline'} onClick={() => setChartType('line')}>Line</Button>
          <Button variant={chartType === 'bar' ? 'default' : 'outline'} onClick={() => setChartType('bar')}>Bar</Button>
        </div>
      </div>

      <div className="h-52 mb-6">
        {filteredStats.length === 0 ? (
          <div className="text-center text-sm text-gray-500 pt-10">No attendance data available for {selectedType}.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={filteredStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} tickFormatter={val => `${val}%`} />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            ) : (
              <BarChart data={filteredStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} tickFormatter={val => `${val}%`} />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <Input type="date" value={date} onChange={async (e) => {
          const newDate = e.target.value;
          setDate(newDate);
          if (newDate !== lastFetchedDate) {
            setAttendance({});
            await fetchAttendanceForDate(newDate);
          }
        }} className="w-[180px]" />
        <div className="flex gap-2">
          <Button onClick={handleMarkAllPresent}>Mark All Present</Button>
          <Button variant={presentOnly ? 'default' : 'outline'} onClick={() => setPresentOnly(p => !p)}>
            {presentOnly ? 'Show All' : 'Show Present Only'}
          </Button>
          <Button onClick={handleSave}>Save Attendance</Button>
        </div>
      </div>

      <Tabs defaultValue="Club Member" onValueChange={(val) => {
        setSelectedTab(val);
        setSelectedType(val);
      }}>
        <TabsList className="mb-4 text-base md:text-lg">
          <TabsTrigger value="Club Member">Club Member</TabsTrigger>
          <TabsTrigger value="Coaching only">Coaching Only</TabsTrigger>
        </TabsList>

        <TabsContent value="Club Member">
          <Card><CardContent>{renderPlayers('Club Member')}</CardContent></Card>
        </TabsContent>

        <TabsContent value="Coaching only">
          {players.filter(p => p.playerType === 'Coaching only').length === 0 && (
            <div className="text-red-500 text-sm px-4 py-2 font-medium">⚠️ No players labeled as 'Coaching Only' found in database.</div>
          )}
          <Card><CardContent>{renderPlayers('Coaching only')}</CardContent></Card>
        </TabsContent>
      </Tabs>
      <ToastContainer />
    </div>
  );
}

*/}
