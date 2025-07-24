
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



export default function AddPlayerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial form state
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
    playerType: 'Coaching only'
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

  // Duplicte check 

  const checkDuplicateOnBlur = async () => {
    const { firstName, surName } = formData;
    const clubId = localStorage.getItem('clubId');
    const token = localStorage.getItem('token');
  
    if (!firstName || !surName || !clubId || !token) {
      console.warn('⚠️ Missing values for duplicate check:', { firstName, surName, clubId });
      return;
    }
  
    try {
      const url = new URL(`http://localhost:5050/api/players/check-duplicate`);
      url.searchParams.append('firstName', firstName.trim());
      url.searchParams.append('surName', surName.trim());
      url.searchParams.append('clubId', clubId); // ✅ No encoding

      console.log('🌐 Final request URL:', url.toString());
  
      const res = await fetch(url.toString(), {
      
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('🌐 Final request URL:', url.toString());

      console.log('🧪 Sending duplicate check with:', {
        firstName,
        surName,
        clubId,
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      setIsDuplicate(data.exists);
      if (data.exists) {
        toast.warn('⚠️ A player with this name already exists in your club.');
      }
    } catch (err) {
      console.error('❌ Duplicate check failed:', err);
      toast.error('Failed to check for duplicates. Please try again.');
    }
  };
  


  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelectChange = (selected: string[]) => {
    setFormData((prev) => ({ ...prev, clubRoles: selected }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?|\+44\s?1\d{3}|\(?01\d{3}\)?|\+44\s?2\d{2}|\(?02\d{2}\)?)\s?\d{3,4}\s?\d{3,4}$/;

    const newErrors: any = {};

    if (!formData.firstName.trim() || !nameRegex.test(formData.firstName)) 
      newErrors.firstName = 'First name is required and must only contain letters.';
    if (!formData.surName.trim() || !nameRegex.test(formData.surName)) 
      newErrors.surName = 'Surname is required and must only contain letters.';
    if (!formData.dob) 
      newErrors.dob = 'Date of birth is required.';

    const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
    if (formData.isJunior && age >= 18) 
      newErrors.isJunior = 'Only players under 18 can be marked as Junior.';
    if (!formData.sex) 
      newErrors.sex = 'Please select a gender.';

    if (formData.isJunior) {
      if (!formData.parentName.trim() || !nameRegex.test(formData.parentName)) 
        newErrors.parentName = 'Parent name is required for junior players.';
      if (!phoneRegex.test(formData.parentPhone)) 
        newErrors.parentPhone = 'Valid parent phone number is required.';
    }

    if (!formData.email.trim() || !emailRegex.test(formData.email)) 
      newErrors.email = 'Please enter a valid email address.';
    if (!formData.emergencyContactname.trim()) 
      newErrors.emergencyContactname = 'Emergency contact name is required.';
    if (!phoneRegex.test(formData.emergencyContactphonenumber)) 
      newErrors.emergencyContactphonenumber = 'Please enter a valid emergency contact phone number.';
    if (!formData.joiningDate) 
      newErrors.joiningDate = 'Joining date is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateForm() || isDuplicate) return;
    setIsSubmitting(true);

    try {

      await checkDuplicateOnBlur(); // ⬅️ Re-check here
    if (isDuplicate) {
      toast.error('🚫 A player with this name already exists in your club. Registration blocked.');
      setIsSubmitting(false);
      return;
    }
      const clubId = localStorage.getItem('clubId');
      const token = localStorage.getItem('token');

      if (!clubId || !token) {
        toast.error('❌ Club information or authentication token missing');
        return;
      }

      const formattedData = {
        ...formData,
        dob: formData.dob.split('T')[0],
        joiningDate: formData.joiningDate.split('T')[0],
        clubId
      };

      const response = await fetch('http://localhost:5050/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      if (response.ok) {
        toast.success('✅ Player added successfully', {
          onClose: () => router.push('/dashboard/clubadmin'),
          autoClose: 2000
        });
      } else {
        throw new Error('Failed to save player');
      }
    } catch (err) {
      console.error('❌ Error saving player:', err);
      toast.error('❌ Failed to add player. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const age = formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : 0;
  const isJuniorDisabled = age >= 18;

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
      <ToastContainer position="top-right" autoClose={2000} />

         {/* Player Statistics */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Members" value={stats.totalMembers} icon={<Users className="w-12 h-12 text-blue-600" />} />
        <StatCard label="Junior : Adult" value={`${stats.juniors} / ${stats.adults}`} icon={<Users className="w-12 h-12 text-green-600" />} />
        <StatCard label="Male : Female" value={`${stats.males} / ${stats.females}`} icon={<Users className="w-12 h-12 text-pink-500" />} />
      </div>
   

      {/* Add New Player Heading and Form */}
<div className="mt-8"> {/* <-- Increase this value to push it further down */}
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
            <Input
              className={inputClass('firstName')}
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={checkDuplicateOnBlur}
            />
       
            {renderError('firstName')}
          </div>
          <div>
            <Label>Surname</Label>
            <Input
              className={inputClass('surName')}
              name="surName"
              value={formData.surName}
              onChange={handleChange}
              onBlur={checkDuplicateOnBlur}
            />

            {renderError('surName')}
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input className={inputClass('dob')} type="date" name="dob" value={formData.dob} onChange={handleChange} />
            {renderError('dob')}
          </div>

          <div className="flex flex-col space-y-1">
  <div className="flex items-center space-x-1">
    <label htmlFor="sex" className="text-sm font-medium">Sex</label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
        </TooltipTrigger>
        <TooltipContent className="bg-white border border-gray-300 rounded shadow text-sm max-w-sm text-gray-800">
  Used to help assign players to appropriate match formats (e.g., Men's, Women's, Mixed Doubles) based on competition categories. This does not restrict participation or identity.
</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

  <Select
    value={formData.sex}
    onValueChange={(val) => handleChange({ target: { name: 'sex', value: val } })}
  >
    <SelectTrigger>
      <span>{formData.sex || 'Select'}</span>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Male">Male</SelectItem>
      <SelectItem value="Female">Female</SelectItem>
    </SelectContent>
  </Select>

  {renderError('sex')}
</div>


          <div className="flex items-center space-x-2">
            <input type="checkbox" name="isJunior" checked={formData.isJunior} onChange={handleChange} disabled={isJuniorDisabled} />
            <Label>Junior Player?</Label>
            {renderError('isJunior')}
          </div>

          {formData.isJunior && (
            <>
              <div>
                <Label>Parent/Gaurdian Name</Label>
                <Input className={inputClass('parentName')} name="parentName" value={formData.parentName} onChange={handleChange} />
                {renderError('parentName')}
              </div>
              <div>
                <Label>Parent/Gaurdian Mobile</Label>
                <Input className={inputClass('parentPhone')} name="parentPhone" value={formData.parentPhone} onChange={handleChange} />
                {renderError('parentPhone')}
              </div>
            </>
          )}

          <div>
            <Label>Email Address</Label>
            <Input className={inputClass('email')} name="email" value={formData.email} onChange={handleChange} />
            {renderError('email')}
          </div>
          <div>
            <Label>Emergency Contact Name</Label>
            <Input className={inputClass('emergencyContactname')} name="emergencyContactname" value={formData.emergencyContactname} onChange={handleChange} />
            {renderError('emergencyContactname')}
          </div>
          <div>
            <Label>Emergency Contact Phone</Label>
            <Input className={inputClass('emergencyContactphonenumber')} name="emergencyContactphonenumber" value={formData.emergencyContactphonenumber} onChange={handleChange} />
            {renderError('emergencyContactphonenumber')}
          </div>
          <div>
            <Label>Joining Date</Label>
            <Input className={inputClass('joiningDate')} type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
            {renderError('joiningDate')}
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select onValueChange={(val) => handleChange({ target: { name: 'paymentStatus', value: val } })}>
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
            <Select onValueChange={(val) => handleChange({ target: { name: 'playerType', value: val } })}>
              <SelectTrigger>{formData.playerType || 'Select type'}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Coaching only">Coaching only</SelectItem>
                <SelectItem value="Club Member">Club Member</SelectItem>
                <SelectItem value="Coaching and Club Member">Coaching and Club Member</SelectItem>
              </SelectContent>
            </Select>
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

