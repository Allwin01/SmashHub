'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import Image from 'next/image';

interface Player {
  _id: string;
  firstName: string;
  surname: string;
  profilePicUrl?: string;
}

export default function PlayerAttendance() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendanceType, setAttendanceType] = useState('Club Night');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch('http://localhost:5050/api/players/by-club', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        

        if (!res.ok) throw new Error('Failed to fetch players');

        const data: Player[] = await res.json();
        const sorted = data.sort((a, b) =>
          (a.firstName + a.surname).localeCompare(b.firstName + b.surname)
        );
        setPlayers(sorted);
      } catch (err) {
        console.error('Error loading players:', err);
      }
    }

    fetchPlayers();
  }, []);

  const handleChange = (playerId: string, value: string) => {
    setAttendance(prev => ({ ...prev, [playerId]: value }));
  };

  const handleSave = async () => {
    const today = new Date(date);
    const weekday = format(today, 'EEEE');

    // Only include entries where attendance is marked
    const records = Object.entries(attendance)
      .filter(([_, status]) => status === 'Present' || status === 'Absent')
      .map(([playerId, status]) => ({
        playerId,
        date,
        day: weekday,
        type: attendanceType,
        status,
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

  
     
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save attendance');
      }

      alert('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving attendance:', err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <Select value={attendanceType} onValueChange={setAttendanceType}>
            <SelectTrigger className="w-[160px]">
              <span>{attendanceType}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Club Night">Club Night</SelectItem>
              <SelectItem value="Tournament">Tournament</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <Button onClick={handleSave}>Save Attendance</Button>
      </div>

      {/* Player List */}
      <Card>
        <CardContent className="space-y-4">
          {players.map(player => (
            <div key={player._id} className="flex items-center justify-between border-b py-3">
              <div className="flex items-center gap-4">
                <Image
                  src={player.profilePicUrl || '/default-profile.png'}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="font-medium">
                  {player.firstName} {player.surname}
                </span>
              </div>

              <RadioGroup
                value={attendance[player._id] || ''}
                onValueChange={(value) => handleChange(player._id, value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Present" id={`${player._id}-present`} />
                  <label htmlFor={`${player._id}-present`}>Present</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Absent" id={`${player._id}-absent`} />
                  <label htmlFor={`${player._id}-absent`}>Absent</label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
