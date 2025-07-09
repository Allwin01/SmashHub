'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  RadarController,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  RadarController,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
);
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const skillGroups: Record<string, string[]> = {
  'Movement Phases': ['Split-Step', 'Chasse Step', 'Lunging', 'Jumping'],
  'Grips & Grip Positions': ['Basic Grip', 'Panhandle', 'Bevel', 'Thumb Grip', 'Grip Adjustment'],
  'Forehand Strokes': ['Clear', 'Drop Shot', 'Smash', 'Slice Drop', 'Lift (Underarm)', 'Net Drop (Underarm)'],
  'Backhand Strokes': ['Clear (Backhand)', 'Drop Shot (Backhand)', 'Lift (Backhand)', 'Net Drop (Backhand)'],
  'Serve Techniques': ['Low Serve', 'High Serve', 'Flick Serve', 'Drive Serve'],
  'Footwork & Speed': ['6-Corner Footwork', 'Shadow Footwork', 'Pivot & Rotation', 'Recovery Steps'],
};

const getLevelLabel = (value: number): JSX.Element => {
  let label = 'Beginner';
  let badge = '🥉';

  if (value >= 7) {
    label = 'Advanced';
    badge = '🥇';
  } else if (value >= 5) {
    label = 'Intermediate';
    badge = '🥈';
  }

  const level = value % 1 >= 0.5 ? Math.ceil(value) : Math.floor(value);

  return (
    <span className="font-semibold">
      Lvl {level} – {label}
    </span>
  );
};

interface SkillProgressVisualProps {
  player: any;
}

const SkillProgressVisual: React.FC<SkillProgressVisualProps> = ({ player }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [groupedAverages, setGroupedAverages] = useState<{ name: string; value?: number }[]>([]);
  const [lineData, setLineData] = useState<any>({});
  const [coachComment, setCoachComment] = useState(player.comments || '');
  const reportRef = useRef<HTMLDivElement>(null);
  const [updatedPlayer, setPlayer] = useState(player);
  const isExporting = useRef(false);

  {/*
  const groupColors = [
    'bg-indigo-600',   // Movement Phases
    'bg-red-600',      // Grips & Grip Positions
    'bg-amber-500',    // Forehand Strokes
    'bg-emerald-500',  // Backhand Strokes
    'bg-violet-600',   // Serve Techniques
    'bg-orange-500',   // Footwork & Speed
  ];


  const barColors = [
    '#4f46e5', // Movement Phases – Indigo
    '#dc2626', // Grips & Grip Positions – Red
    '#f59e0b', // Forehand Strokes – Amber
    '#10b981', // Backhand Strokes – Emerald
    '#8b5cf6', // Serve Techniques – Violet
    '#f97316', // Footwork & Speed – Orange
  ];

*/}

  const groupColors = [
    'bg-blue-200', 'bg-teal-200', 'bg-orange-200', 'bg-red-200', 'bg-yellow-200', 'bg-purple-200',
  ];
  const barColors = ['#3b82f6', '#0d9488', '#ea580c', '#dc2626', '#eab308', '#9333ea'];

  

  const radarColors = [
    '79, 70, 229',   // Indigo
    '220, 38, 38',   // Red
    '245, 158, 11',  // Amber
    '16, 185, 129',  // Emerald
    '139, 92, 246',  // Violet
    '249, 115, 22',  // Orange
  ];
  

  useEffect(() => {
    if (!updatedPlayer) return;

    const matrix = updatedPlayer.skillMatrix || {};
    const averages: { name: string; value?: number }[] = [];

    for (const groupName in skillGroups) {
      const skills = skillGroups[groupName];
      const values = skills
        .map(skill => {
          for (const group in matrix) {
            if (matrix[group]?.[skill] !== undefined) return matrix[group][skill];
          }
          return null;
        })
        .filter((v): v is number => v !== null);

      if (values.length) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        averages.push({ name: groupName, value: parseFloat(avg.toFixed(1)) });
      } else {
        averages.push({ name: groupName });
      }
    }

    setGroupedAverages(averages);

    const dates = updatedPlayer.skillGroupAverages?.map((entry: any) => entry.date) || [];
    const lineDatasets = Object.keys(skillGroups).map((group, i) => ({
      label: group,
      data: updatedPlayer.skillGroupAverages.map((entry: any) => entry.groupAverages?.[group] ?? 0),
      borderColor: barColors[i % barColors.length],
      backgroundColor: 'transparent',
      spanGaps: true,
    }));
    setLineData({ labels: dates, datasets: lineDatasets });
  }, [updatedPlayer]);

 

  useEffect(() => {
    const refreshPlayerData = async () => {
      const token = localStorage.getItem('token');
      const playerId = player?._id;
      if (!playerId || !token) return;
      try {
        const refreshed = await fetch(`/api/players/${playerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const freshData = await refreshed.json();
        setPlayer(freshData);
      } catch (err) {
        console.error('Error fetching updated player:', err);
      }
    };
    refreshPlayerData();
  }, [player._id]);




  
  
  

  if (!updatedPlayer) return <div className="p-6">Loading...</div>;

  return (
    <div ref={reportRef} className={`p-6 space-y-6 text-sm ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="text-blue-900 text-xl font-bold uppercase tracking-wide">{updatedPlayer.clubName}</div>
  <div className="flex justify-between items-center" id="controls">
    <h2 className="text-3xl font-bold">Badminton Skill Progress Report</h2>
    <div className="flex gap-2">  
    </div>
      </div>
      {/* Profile */}
      <div className="flex items-center gap-6">
        <Image src={updatedPlayer.profileImage || '/Avatar-female.png'} alt={updatedPlayer.firstName} width={72} height={72} className="rounded-full border" />
        <div>
          <h2 className="text-2xl font-bold">{updatedPlayer.firstName} {updatedPlayer.surName}</h2>
          <p className="text-base">Level: {updatedPlayer.level || 'N/A'}</p>
          <p className="text-base">Coach: {updatedPlayer.coachName || 'N/A'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-xl">Skill Cards</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {groupedAverages.map((group, i) => (
            <div key={group.name} className={`${groupColors[i % groupColors.length]} text-white p-4 rounded-lg aspect-[1/1.2] max-h-48 flex flex-col justify-between`}>
              <h4 className="font-semibold mb-1 text-black text-sm sm:text-base">{group.name}</h4>
              {group.value !== undefined ? (
                <>
                  <div className="w-full h-2 bg-white bg-opacity-20 rounded">
                    <div className="h-2 rounded" style={{ width: `${group.value * 10}%`, backgroundColor: barColors[i % barColors.length] }} />
                  </div>
                  <div className="text-sm font-medium mt-2 flex items-center gap-2 text-black">
                   {getLevelLabel(group.value)}
                  </div>
                </>
              ) : <p className="text-sm text-red-400 italic">🚫 No data recorded</p>}
            </div>
          ))}
        </CardContent>
      </Card>
             

      {/* Radar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
        {Object.entries(skillGroups).map(([groupName, skills], i) => {
          const trimmedLabels = skills.map(skill => skill.replace(/\s*\(.*?\)\s*/g, '').trim());
          const values = skills.map(skill => updatedPlayer.skillMatrix?.[groupName]?.[skill] ?? 0);
          return (
            <div key={groupName} className="bg-white p-4 rounded shadow">
              <h4 className="text-lg font-bold text-center mb-2">{groupName}</h4>
              <div className="h-[300px] w-full">
                <Radar
                  data={{
                    labels: trimmedLabels,
                    datasets: [{
                      label: 'Current Skill Level',
                      data: values,
                      backgroundColor: `rgba(${radarColors[i % radarColors.length]}, 0.2)`,
                      borderColor: `rgba(${radarColors[i % radarColors.length]}, 1)`,
                      borderWidth: 2,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `${context.dataset.label}: ${context.formattedValue}`,
                        },
                      },
                    },
                    scales: {
                      r: {
                        min: 0,
                        max: 10,
                        ticks: { display: false },
                        pointLabels: {
                          font: { size: 12, weight: '600' },
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                          callback: function (label: string) {
                            const words = label.split(' ');
                            return words.length > 1 ? [words[0], words.slice(1).join(' ')] : label;
                          },
                        },
                        grid: { color: theme === 'dark' ? '#4b5563' : '#d1d5db' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Line Chart */}
      <div className="bg-white p-4 rounded shadow h-[400px]">
        <h4 className="text-lg font-semibold text-center mb-2">Skill Progress Over Time</h4>
        {lineData?.labels?.length ? (
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    font: { size: 12 },
                    color: theme === 'dark' ? '#fff' : '#000',
                  },
                },
              },
              scales: {
                y: {
                  min: 0,
                  max: 10,
                  ticks: {
                    stepSize: 1,
                    color: theme === 'dark' ? '#fff' : '#000',
                  },
                  grid: {
                    color: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                  },
                },
                x: {
                  ticks: {
                    color: theme === 'dark' ? '#fff' : '#000',
                  },
                  grid: {
                    color: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                  },
                },
              },
            }}
          />
        ) : (
          <p className="text-gray-400 text-center py-4">No data available</p>
        )}
      </div>

   
    </div>
  );
};

export default SkillProgressVisual;
