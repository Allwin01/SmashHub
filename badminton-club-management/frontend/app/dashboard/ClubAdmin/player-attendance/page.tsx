// Enhanced Player Attendance Page with Attendance Trend Chart Per Tab and Date Range Filter
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { format, parseISO, differenceInYears, subMonths } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BadgeCheck, XCircle } from 'lucide-react';

interface Player {
  _id: string;
  firstName: string;
  surname: string;
  dob: string;
  profilePicUrl?: string;
  playerType?: string;
}

interface AttendanceStats {
  period: string;
  adultClubMember?: number;
  juniorClubMember?: number;
}

export default function PlayerAttendance() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [lastFetchedDate, setLastFetchedDate] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [selectedType, setSelectedType] = useState('Adult Club Member');
  const [selectedTab, setSelectedTab] = useState('Adult Club Member');
  const [presentOnly, setPresentOnly] = useState(false);
  const [rangeOption, setRangeOption] = useState('3m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    fetchPlayers();
    const [from, to] = calculateRange();
    fetchStats(from, to);
    fetchAttendanceForDate(date);
  }, []);

  const calculateRange = () => {
    const now = new Date();
    switch (rangeOption) {
      case '3m': return [format(subMonths(now, 3), 'yyyy-MM-dd'), format(now, 'yyyy-MM-dd')];
      case '6m': return [format(subMonths(now, 6), 'yyyy-MM-dd'), format(now, 'yyyy-MM-dd')];
      case '12m': return [format(subMonths(now, 12), 'yyyy-MM-dd'), format(now, 'yyyy-MM-dd')];
      case 'custom': return [customFrom, customTo];
      default: return [format(subMonths(now, 3), 'yyyy-MM-dd'), format(now, 'yyyy-MM-dd')];
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/players/by-club', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch players');
      const data: Player[] = await res.json();
      const today = new Date();
      const updated = data.map(p => {
        if (!p.dob || isNaN(new Date(p.dob).getTime())) {
          console.warn('⚠️ Missing or invalid DOB:', p);
          return { ...p, playerType: 'Adult Club Member' };
        }
        const age = differenceInYears(today, new Date(p.dob));
        const playerType = age < 18 ? 'Junior Club Member' : 'Adult Club Member';
        return { ...p, playerType };
      });
      const sorted = updated.sort((a, b) => (a.firstName + a.surname).localeCompare(b.firstName + b.surname));
      setPlayers(sorted);
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

  const fetchStats = async (from: string, to: string) => {
    try {
      const clubId = localStorage.getItem('clubId');
      const res = await fetch(`http://localhost:5050/api/attendance/stats-daily?clubId=${clubId}&from=${from}&to=${to}`, {
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
      const [from, to] = calculateRange();
      await fetchStats(from, to);
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('❌ Failed to save attendance');
    }
  };

  const renderPlayers = (typeFilter: string) => {
    const filtered = players.filter(p => p.playerType === typeFilter);
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

  const renderChart = (type: 'Adult Club Member' | 'Junior Club Member') => {
    const dataKey = type === 'Adult Club Member' ? 'adultClubMember' : 'juniorClubMember';
    const strokeColor = type === 'Adult Club Member' ? '#2563eb' : '#10b981';
    return (
      <div className="h-56 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tickFormatter={(val) => format(parseISO(val), 'dd MMM')} />
            <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
            <Tooltip formatter={(value: any) => `${value}%`} />
            <Line dataKey={dataKey} stroke={strokeColor} strokeWidth={2} name={type} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

      <div className="flex gap-3 mb-4 items-center">
        <select value={rangeOption} onChange={e => setRangeOption(e.target.value)} className="border px-2 py-1 rounded">
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="12m">Last 12 Months</option>
          <option value="custom">Custom Range</option>
        </select>
        {rangeOption === 'custom' && (
          <>
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </>
        )}
        <Button onClick={() => {
          const [from, to] = calculateRange();
          fetchStats(from, to);
        }}>Apply</Button>
      </div>

      <Tabs defaultValue="Adult Club Member" onValueChange={(val) => {
        setSelectedTab(val);
        setSelectedType(val);
      }}>
        <TabsList className="mb-4 text-base md:text-lg">
          <TabsTrigger value="Adult Club Member">Adult Club Member</TabsTrigger>
          <TabsTrigger value="Junior Club Member">Junior Club Member</TabsTrigger>
        </TabsList>

        <TabsContent value="Adult Club Member">
          <Card className="mb-4"><CardContent>{renderChart('Adult Club Member')}</CardContent></Card>
          <Card><CardContent>{renderPlayers('Adult Club Member')}</CardContent></Card>
        </TabsContent>

        <TabsContent value="Junior Club Member">
          <Card className="mb-4"><CardContent>{renderChart('Junior Club Member')}</CardContent></Card>
          <Card><CardContent>{renderPlayers('Junior Club Member')}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <ToastContainer />
    </div>
  );
}
