
'use client';


import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MultiSelect } from '@/components/ui/multiselect';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Users, User, User2,UserRound, Venus, Mars,Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";




  const [stats, setStats] = useState({
    totalMembers: 0,
    juniors: 0,
    adults: 0,
    males: 0,
    females: 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5050/api/players', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
  
      const totalPlayers = data.length;
      const juniors = data.filter(p => p.isJunior).length;
      const adults = totalPlayers - juniors;
      const males = data.filter(p => p.sex === 'Male').length;
      const females = data.filter(p => p.sex === 'Female').length;
  
      setStats({ totalMembers: totalPlayers, juniors, adults, males, females });
    };
  
    fetchStats();
  }, []);
  
  const StatCard = ({ label, value, icon, color }: { label: string, value: number | string, icon: React.ReactNode, color: string }) => (
    <div className={`rounded-xl shadow-md p-4 flex items-center gap-4 ${color}`}>
      <div className="bg-white rounded-full p-6 shadow-sm">{icon}</div>
      <div>
      <h4 className="text-4xl font-bold text-gray-900">{label}</h4>

        <p className="text-4xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

 
  
     




  return (
    <div className="p-6 w-full">
      <ToastContainer position="top-right" autoClose={2000} />

         {/* Player Statistics */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Members" value={stats.totalMembers} icon={<Users className="w-12 h-12 text-blue-600" />} />
        <StatCard label="Junior : Adult" value={`${stats.juniors} / ${stats.adults}`} icon={<Users className="w-12 h-12 text-green-600" />} />
        <StatCard label="Male : Female" value={`${stats.males} / ${stats.females}`} icon={<Users className="w-12 h-12 text-pink-500" />} />
      </div>
   
      </div>
  
  );


