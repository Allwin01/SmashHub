
'use client';

import { useState } from 'react';
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

export default function AddPlayerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial form state
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
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

  const checkDuplicateOnBlur = async () => {
    const { firstName, surname } = formData;
    const clubName = localStorage.getItem('clubName');
    const token = localStorage.getItem('token');
  
    if (!firstName || !surname || !clubName || !token) {
      return; // Skip if required fields are missing
    }
  
    try {
      // Properly encode URI components to handle special characters
      const url = new URL(`http://localhost:5050/api/players/check-duplicate`);
      url.searchParams.append('firstName', encodeURIComponent(firstName));
      url.searchParams.append('surname', encodeURIComponent(surname));
      url.searchParams.append('clubName', encodeURIComponent(clubName));
  
      const res = await fetch(url.toString(), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      setIsDuplicate(data.exists);
      if (data.exists) {
        toast.warn('⚠️ Player with the same name already exists in your club.');
      }
    } catch (err) {
      console.error('❌ Duplicate check failed:', err);
      toast.error('Failed to check for duplicates. Please try again.');
    }
  };

  {/*}
  const checkDuplicateOnBlur = async () => {
    const { firstName, surname } = formData;
    const clubName = localStorage.getItem('clubName');
    const token = localStorage.getItem('token');

    if (firstName && surname && clubName) {
      try {
        const res = await fetch(
          `http://localhost:5050/api/players/check-duplicate?firstName=${firstName}&surname=${surname}&clubName=${clubName}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setIsDuplicate(data.exists);
        if (data.exists) {
          toast.warn('⚠️ Player with the same name already exists in your club.');
        }
      } catch (err) {
        console.error('❌ Duplicate check failed:', err);
      }
    }
  };
*/}

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
    if (!formData.surname.trim() || !nameRegex.test(formData.surname)) 
      newErrors.surname = 'Surname is required and must only contain letters.';
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
      const clubName = localStorage.getItem('clubName');
      const token = localStorage.getItem('token');

      if (!clubName || !token) {
        toast.error('❌ Club information or authentication token missing');
        return;
      }

      const formattedData = {
        ...formData,
        dob: formData.dob.split('T')[0],
        joiningDate: formData.joiningDate.split('T')[0],
        clubName
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
          autoClose: 3000
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
      <ToastContainer />
      <motion.h2 className="text-2xl font-bold mb-4 text-blue-800" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        Add New Player
      </motion.h2>
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
              className={inputClass('surname')}
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              onBlur={checkDuplicateOnBlur}
            />

            {renderError('surname')}
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input className={inputClass('dob')} type="date" name="dob" value={formData.dob} onChange={handleChange} />
            {renderError('dob')}
          </div>
          <div>
            <Label>Sex</Label>
            <Select value={formData.sex} onValueChange={(val) => handleChange({ target: { name: 'sex', value: val } })}>
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
                <Label>Parent Full Name</Label>
                <Input className={inputClass('parentName')} name="parentName" value={formData.parentName} onChange={handleChange} />
                {renderError('parentName')}
              </div>
              <div>
                <Label>Parent Phone Number</Label>
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



/* 
// ✨ AddPlayerPage.tsx enhancement with multi-select dropdown for Club Roles

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multiselect';

export default function AddPlayerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    dob: '',
    sex: '',
    isJunior: false,
    parentName: '',
    parentPhone: '',
    email: '',
    emergencyContactname: '',
    emergencyContactphonenumber: '',
    joiningDate: '',
    paymentStatus: 'Due',
    clubRoles: [],
    playerType: 'Coaching only'
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelectChange = (selected: string[]) => {
    setFormData((prev) => ({
      ...prev,
      clubRoles: selected
    }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^(?:\+44\s?7\d{3}|\(?07\d{3}\)?|\+44\s?1\d{3}|\(?01\d{3}\)?|\+44\s?2\d{2}|\(?02\d{2}\)?)\s?\d{3,4}\s?\d{3,4}$/;

    const newErrors: any = {};

    if (!formData.firstName.trim() || !nameRegex.test(formData.firstName)) {
      newErrors.firstName = 'First name is required and must only contain letters.';
    }

    if (!formData.surname.trim() || !nameRegex.test(formData.surname)) {
      newErrors.surname = 'Surname is required and must only contain letters.';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required.';
    }

    const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
    if (formData.isJunior && age >= 18) {
      newErrors.isJunior = 'Only players under 18 can be marked as Junior.';
    }

    if (!formData.sex) {
      newErrors.sex = 'Please select a gender.';
    }

    if (formData.isJunior) {
      if (!formData.parentName.trim() || !nameRegex.test(formData.parentName)) {
        newErrors.parentName = 'Parent name is required for junior players.';
      }
      if (!phoneRegex.test(formData.parentPhone)) {
        newErrors.parentPhone = 'Valid parent phone number is required.';
      }
    }

    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.emergencyContactname.trim()) {
      newErrors.emergencyContactname = 'Emergency contact name is required.';
    }

    if (!phoneRegex.test(formData.emergencyContactphonenumber)) {
      newErrors.emergencyContactphonenumber = 'Please enter a valid emergency contact phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const clubName = localStorage.getItem('clubName');
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5050/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, clubName })
      });

      if (response.ok) {
        alert('Player added successfully');
        router.push('/dashboard/clubadmin');
      }
    } catch (err) {
      
      console.error('❌ Error saving player:', err);
      
      
    }
  };

  const age = formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : 0;
  const isJuniorDisabled = age >= 18;

  const inputClass = (field: string) => `transition-all duration-300 ${errors[field] ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} focus:outline-none focus:ring-2`;

  const clubRoleOptions = [
    'Club President',
    'Club Secretary',
    'Club Treasurer',
    "Men's Team Captain",
    "Women's Team Captain",
    'Coach-Level 1',
    'Coach-Level 2',
    'Head Coach',
    'Safeguarding Officer',
    'First Aid Officer',
    'Social Media & Marketing Officer'
  ];

  return (
    <div className="p-6 w-full">
      <motion.h2 className="text-2xl font-bold mb-4 text-blue-800" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        Add New Player
      </motion.h2>
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>First Name</Label>
            <Input className={inputClass('firstName')} name="firstName" value={formData.firstName} onChange={handleChange} />
          </div>
          <div>
            <Label>Surname</Label>
            <Input className={inputClass('surname')} name="surname" value={formData.surname} onChange={handleChange} />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input className={inputClass('dob')} type="date" name="dob" value={formData.dob} onChange={handleChange} />
          </div>
          <div>
            <Label>Sex</Label>
          <Select value={formData.sex} onValueChange={(val) => handleChange({ target: { name: 'sex', value: val } })}>
           <SelectTrigger>
              <span>{formData.sex || 'Select'}</span>
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
             </SelectContent>
          </Select>

          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" name="isJunior" checked={formData.isJunior} onChange={handleChange} disabled={isJuniorDisabled} />
            <Label>Junior Player?</Label>
          </div>

          {formData.isJunior && (
            <>
              <div>
                <Label>Parent Full Name</Label>
                <Input className={inputClass('parentName')} name="parentName" value={formData.parentName} onChange={handleChange} />
              </div>
              <div>
                <Label>Parent Phone Number</Label>
                <Input className={inputClass('parentPhone')} name="parentPhone" value={formData.parentPhone} onChange={handleChange} />
              </div>
            </>
          )}

          <div>
            <Label>Email Address</Label>
            <Input className={inputClass('email')} name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <Label>Emergency Contact Name</Label>
            <Input className={inputClass('emergencyContactname')} name="emergencyContactname" value={formData.emergencyContactname} onChange={handleChange} />
          </div>
          <div>
            <Label>Emergency Contact Phone</Label>
            <Input className={inputClass('emergencyContactphonenumber')} name="emergencyContactphonenumber" value={formData.emergencyContactphonenumber} onChange={handleChange} />
          </div>
          <div>
            <Label>Joining Date</Label>
            <Input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
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

*/


