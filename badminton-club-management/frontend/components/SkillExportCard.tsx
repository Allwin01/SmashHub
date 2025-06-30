// components/VisualSkillReport.tsx
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

  const groupColors = [
    'bg-blue-200', 'bg-teal-200', 'bg-orange-200', 'bg-red-200', 'bg-yellow-200', 'bg-purple-200',
  ];
  const barColors = ['#3b82f6', '#0d9488', '#ea580c', '#dc2626', '#eab308', '#9333ea'];
  const radarColors = ['54, 162, 235', '255, 99, 132', '255, 206, 86', '75, 192, 192', '153, 102, 255', '255, 159, 64'];

  useEffect(() => {
    if (!player) return;

    const matrix = player.skillMatrix || {};
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

    const history = [...(player.skillsHistory || [])]
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-4);

    const groupedRadar: Record<string, Record<string, Record<string, number>>> = {};
    const radarDates: string[] = [];
    const lastKnownSkillValues: Record<string, Record<string, number>> = {};

    history.forEach((entry: any) => {
      const { date, skills } = entry;
      radarDates.push(date);

      for (const group in skillGroups) {
        if (!groupedRadar[group]) groupedRadar[group] = {};
        if (!groupedRadar[group][date]) groupedRadar[group][date] = {};
        if (!lastKnownSkillValues[group]) lastKnownSkillValues[group] = {};

        for (const skill of skillGroups[group]) {
          const value = skills[group]?.[skill];
          if (value !== undefined) {
            lastKnownSkillValues[group][skill] = value;
          }
          groupedRadar[group][date][skill] = lastKnownSkillValues[group][skill] ?? 0;
        }
      }
    });

    console.log('🧠 Last known skill values:', lastKnownSkillValues);


    const lineDatasets = Object.keys(skillGroups).map((group, i) => {
      const data = radarDates.map(date => {
        const skillValues = skillGroups[group].map(skill => groupedRadar[group]?.[date]?.[skill] ?? 0);
        const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
        return parseFloat(avg.toFixed(2));
      });

      return {
        label: group,
        data,
        borderColor: barColors[i % barColors.length],
        backgroundColor: 'transparent',
        spanGaps: true,
      };
    });

    setLineData({ labels: radarDates, datasets: lineDatasets });
  }, [player]);

  const handlePDFExport = async () => {
    const controls = document.getElementById('controls');
    if (controls) controls.classList.add('hidden');
    const html2pdf = (await import('html2pdf.js')).default;
    setTimeout(() => {
      if (reportRef.current) {
        html2pdf().set({
          margin: 0.2,
          filename: `${player?.firstName}_SkillReport.pdf`,
          html2canvas: { scale: 2 },
          pagebreak: { mode: 'avoid-all' },
        }).from(reportRef.current).save().then(() => {
          if (controls) controls.classList.remove('hidden');
        });
      }
    }, 300);
  };

  const handleSaveComment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5050/api/players/${player._id}/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: coachComment }),
      });
      if (!res.ok) throw new Error('Failed to save comment');
      alert('✅ Coach comment saved successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ Error saving comment');
    }
  };

  if (!player) return <div className="p-6">Loading...</div>;


  const latestValueMap: Record<string, number> = {};

  (player.skillsHistory || []).forEach(entry => {
      const { skills } = entry;
      for (const group in skillGroups) {
        if (!latestValueMap[group]) latestValueMap[group] = {};
        for (const skill of skillGroups[group]) {
          const value = skills?.[group]?.[skill];
          if (value !== undefined) {
            latestValueMap[group][skill] = value;
            console.log(`✅ Found: ${group} > ${skill} = ${value}`);
          }
        }
      }
    });

    console.log("✅ Final latestValueMap:", latestValueMap);

 
  return (
    <div ref={reportRef} className={`p-6 space-y-6 text-sm ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="text-blue-900 text-xl font-bold uppercase tracking-wide">{player.clubName}</div>
  
      <div className="flex justify-between items-center" id="controls">
        <h2 className="text-3xl font-bold">Badminton Skill Progress Report</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle Theme</Button>
          <Button onClick={handlePDFExport}>📥 Export PDF</Button>
        </div>
      </div>
  
      {/* Player Profile */}
      <div className="flex items-center gap-6">
        <Image src={player.profileImage || '/Avatar-female.png'} alt={player.firstName} width={96} height={96} className="rounded-full border" />
        <div>
          <h2 className="text-2xl font-bold">{player.firstName} {player.surName}</h2>
          <p className="text-base">Level: {player.level || 'N/A'}</p>
          <p className="text-base">Coach: {player.coachName || 'N/A'}</p>
        </div>
      </div>
  
      {/* Skill Cards */}
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
                    <span className="text-2xl font-bold">{getLevelLabel(group.value)}</span>
                  </div>
                </>
              ) : <p className="text-sm text-red-200 italic">🚫 No data recorded</p>}
            </div>
          ))}
        </CardContent>
      </Card>
  
     {/* Radar Charts (Latest Only) */}

{/* Radar Charts */}
{/* Radar Charts */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
 

  {Object.entries(skillGroups).map(([groupName, skills], i) => {
    // 👉 Prepare labels (trim skill names)
    const trimmedLabels = skills.map(skill => skill.replace(/\s*\(.*?\)\s*/g, '').trim());
  
      // 👉 Get values from skillMatrix
      const values = skills.map(skill => {
        const group = player.skillMatrix?.[groupName];
        return group?.[skill] ?? 0;
      });

    const datasets = [
      {
        label: 'Current Skill Level',
        data: values,
        backgroundColor: `rgba(${radarColors[i % radarColors.length]}, 0.2)`,
        borderColor: `rgba(${radarColors[i % radarColors.length]}, 1)`,
        borderWidth: 2,
      },
    ];

    return (
      <div key={groupName} className="bg-white p-4 rounded shadow">


       <h4 className="text-lg font-bold text-center mb-2">{groupName}</h4>

        <div className="h-[300px] w-full">
          <Radar
           data={{ labels: trimmedLabels, datasets }}
           options={{
              responsive: true,
              maintainAspectRatio: false, 
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) =>
                      `${context.dataset.label}: ${context.formattedValue}`,
                  },
                },
              },
              scales: {
                r: {
                    min: 0,
                    max: 10, // 👈 ensures chart always uses full skill scale
                  ticks: { display: false },

                  pointLabels: {
                    font: {
                      size: 12, // 👈 increase font size
                      weight: '600',
                    },
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    callback: function (label: string) {
// ✅ Split label into multiple lines based on space
const words = label.split(' ');
if (words.length > 1) {
  return [words[0], words.slice(1).join(' ')]; // e.g., ["Shadow", "Footwork"]
}
return label;
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
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.raw}`,
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
  
      {/* Coach Comments */}
      <Card>
        <CardHeader><CardTitle>Coach Comments</CardTitle></CardHeader>
        <CardContent>
          <textarea className="w-full p-2 border rounded text-black" rows={3} placeholder="Add coach comments..." value={coachComment} onChange={e => setCoachComment(e.target.value)} />
          <Button className="mt-3" onClick={handleSaveComment}>💾 Save Comments</Button>
        </CardContent>
      </Card>
    </div>
  );
  };

  // ✅ Highlighted Fix:
  export default SkillProgressVisual;