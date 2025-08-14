// AddPlayerPage.tsx - Enhanced with DOB-based Role Logic and Submit Handler
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
import { Users, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AddPlayerPage() {
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    const clubId = localStorage.getItem('clubId');
    if (!token || !clubId) {
      toast.error('Missing auth or club info');
      return;
    }
   

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clubId', clubId);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch (`${baseUrl}/api/players/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('✅ Bulk upload successful');
        const data = await response.json();
        console.log(data);
      } else {
        const error = await response.json();
        toast.error(error.message || '❌ Upload failed');
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      toast.error('❌ Upload failed');
    }
  };
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const clubId = localStorage.getItem('clubId');
      if (!token || !clubId) {
        toast.error('Missing authentication or club info');
        setIsSubmitting(false);
        return;
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch (`${baseUrl}/api/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, clubId })
      });

      if (response.ok) {
        toast.success('✅ Player added successfully');
        setTimeout(() => router.push('/dashboard/clubadmin'), 1500);
      } else {
        const data = await response.json();
        toast.error(data.message || '❌ Failed to save player');
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    surName: '',
    dob: '',
    sex: '',
    isJunior: false,
    parentName: '',
    parentPhone: '',
    email: '',
    emergencyContactname: '',
    emergencyContactphonenumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'Due',
    clubRoles: [],
    playerType: '',
    skillTracking: false
  
  });

  const [errors, setErrors] = useState<any>({});
  const [isDuplicate, setIsDuplicate] = useState(false);
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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch (`${baseUrl}/api/players`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      const totalPlayers = data.length;
      const juniors = data.filter(p => p.isJunior).length;
      const adults = totalPlayers - juniors;
      const males = data.filter(p => p.sex === 'Male').length;
      const females = data.filter(p => p.sex === 'Female').length;

      setStats({ totalMembers: totalPlayers, juniors, adults, males, females });
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (!formData.dob) return;
    const dobDate = new Date(formData.dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    const d = today.getDate() - dobDate.getDate();
    const isUnder18 = age < 18 || (age === 18 && (m < 0 || (m === 0 && d < 0)));

    setFormData((prev) => ({
      ...prev,
      isJunior: isUnder18,
      playerType: isUnder18 ? 'Junior Club Member' : 'Adult Club Member'
    }));
  }, [formData.dob]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
  
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      console.log('formData.skillTracking →', updated.skillTracking); // 👈 Debug goes here
      return updated;
    });
  };

  const handleMultiSelectChange = (selected: string[]) => {
    setFormData((prev) => ({ ...prev, clubRoles: selected }));
  };

  const inputClass = (field: string) =>
    `transition-all duration-300 border p-2 rounded-md w-full ${errors[field] ? 'border-red-500' : 'border-gray-300'}`;

  const renderError = (field: string) =>
    errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;

  const clubRoleOptions = [
    'Club President', 'Club Secretary', 'Club Treasurer', "Men's Team Captain",
    "Women's Team Captain", 'Coach-Level 1', 'Coach-Level 2', 'Head Coach',
    'Safeguarding Officer', 'First Aid Officer', 'Social Media & Marketing Officer'
  ];

  return (
    <div className="p-6 w-full">
      <div className="mb-6 bg-yellow-50 p-4 rounded-md border border-yellow-300">
        <h3 className="font-bold text-lg text-yellow-800">📥 Bulk Upload Players via CSV</h3>
        <p className="text-sm text-gray-700">You can upload a CSV file containing player records using the format provided in the downloadable template.</p>
        <div className="flex items-center gap-4 mt-2">
          <a
            href="/templates/player-upload-template.csv"
            download
            className="text-sm underline text-blue-600 hover:text-blue-800"
          >
            Download CSV Template
          </a>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="block text-sm text-gray-600 border border-gray-300 rounded p-1.5 cursor-pointer"
          />
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl shadow-md p-4 flex items-center gap-4 bg-blue-100">
          <div className="bg-white rounded-full p-6 shadow-sm">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <div>
            <h4 className="text-4xl font-bold text-gray-900">Total Members</h4>
            <p className="text-4xl font-bold text-gray-900">{stats.totalMembers}</p>
          </div>
        </div>
        <div className="rounded-xl shadow-md p-4 flex items-center gap-4 bg-green-100">
          <div className="bg-white rounded-full p-6 shadow-sm">
            <Users className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h4 className="text-4xl font-bold text-gray-900">Junior : Adult</h4>
            <p className="text-4xl font-bold text-gray-900">{`${stats.juniors} / ${stats.adults}`}</p>
          </div>
        </div>
        <div className="rounded-xl shadow-md p-4 flex items-center gap-4 bg-pink-100">
          <div className="bg-white rounded-full p-6 shadow-sm">
            <Users className="w-12 h-12 text-pink-500" />
          </div>
          <div>
            <h4 className="text-4xl font-bold text-gray-900">Male : Female</h4>
            <p className="text-4xl font-bold text-gray-900">{`${stats.males} / ${stats.females}`}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <motion.h2
          className="text-2xl font-bold mb-4 text-blue-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Add New Player
        </motion.h2>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>First Name</Label>
            <Input name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass('firstName')} />
            {renderError('firstName')}
          </div>
          <div>
            <Label>Surname</Label>
            <Input name="surName" value={formData.surName} onChange={handleChange} className={inputClass('surName')} />
            {renderError('surName')}
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass('dob')} />
            {renderError('dob')}
          </div>
          <div>
            <Label>Sex</Label>
            <Select value={formData.sex} onValueChange={(val) => handleChange({ target: { name: 'sex', value: val } })}>
              <SelectTrigger>{formData.sex || 'Select'}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            {renderError('sex')}
          </div>

          {formData.isJunior && (
            <>
              <div>
                <Label>Parent/Guardian Name</Label>
                <Input name="parentName" value={formData.parentName} onChange={handleChange} className={inputClass('parentName')} />
                {renderError('parentName')}
              </div>
              <div>
                <Label>Parent/Guardian Mobile</Label>
                <Input name="parentPhone" value={formData.parentPhone} onChange={handleChange} className={inputClass('parentPhone')} />
                {renderError('parentPhone')}
              </div>
            </>
          )}

          <div>
            <Label>Email Address</Label>
            <Input name="email" value={formData.email} onChange={handleChange} className={inputClass('email')} />
            {renderError('email')}
          </div>
          <div>
            <Label>Emergency Contact Name</Label>
            <Input name="emergencyContactname" value={formData.emergencyContactname} onChange={handleChange} className={inputClass('emergencyContactname')} />
            {renderError('emergencyContactname')}
          </div>
          <div>
            <Label>Emergency Contact Phone</Label>
            <Input name="emergencyContactphonenumber" value={formData.emergencyContactphonenumber} onChange={handleChange} className={inputClass('emergencyContactphonenumber')} />
            {renderError('emergencyContactphonenumber')}
          </div>
          <div>
            <Label>Joining Date</Label>
            <Input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className={inputClass('joiningDate')} />
            {renderError('joiningDate')}
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={formData.paymentStatus} onValueChange={(val) => handleChange({ target: { name: 'paymentStatus', value: val } })}>
              <SelectTrigger>{formData.paymentStatus}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Due">Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Club Roles</Label>
            <MultiSelect
              selected={formData.clubRoles}
              options={clubRoleOptions.map(role => ({ label: role, value: role }))}
              onChange={handleMultiSelectChange}
              placeholder="Select role(s)"
            />
          </div>
          <div>
            <Label>Player Type</Label>
            <Input value={formData.playerType} readOnly className="bg-gray-100 cursor-not-allowed" />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="skillTracking"
              checked={formData.skillTracking}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              
            />
            <Label htmlFor="skillTracking">Enable Skill Tracking</Label>
            

          </div>
        </CardContent>
      </Card>

      <motion.div className="flex justify-end gap-4 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </motion.div>
    </div>
  );
}