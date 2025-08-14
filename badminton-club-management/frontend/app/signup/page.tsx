'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';



export default function SignupOverlay() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    surName: '',
    email: '',
    password: '',
    address1: '',
    address2: '',
    postcode: '',
    county: '',
    country: '',
    role: '',
    clubName: '',
    clubCity: '',
    clubAddress: '',
    selectedClub: ''
  });

  const [clubOptions, setClubOptions] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = ['Club Admin', 'Parents', 'Tournament Organiser', 'Independent Coach'];


  useEffect(() => {
  const fetchClubs = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const res = await fetch(`${baseUrl}/api/clubs');
  const data = await res.json();
  setClubOptions(data.clubs || []);
  } catch (err) {
  console.error('Error loading clubs:', err);
  setClubOptions([]);
  }
  };
  
  if (formData.role === 'Parents') {
  fetchClubs();
  } else {
  setClubOptions([]);
  }
  }, [formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,  
      ...(name === 'email' ? { username: value } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch (`${baseUrl}/api/auth/signup), {
        method: 'POST',
        headers: {
          'Content-Type': `application/json`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('✅ Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/');  // assuming your login is at `/`
        }, 3000);
      } else {
        setMessage(`❌ ${result.message || 'Signup failed'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('❌ Server error, please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{ backgroundImage: "url('/court-bg.jpg')" }}>
      <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-xl w-full max-w-xl relative">
        <button
          onClick={handleCancel}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Create Your Account</h2>
        <form className="space-y-4 text-gray-800" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="border p-2 rounded text-gray-900" required />
            <input name="surName" value={formData.surName} onChange={handleChange} placeholder="Surname" className="border p-2 rounded text-gray-900" required />
          </div>
          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full border p-2 rounded text-gray-900" required />
    
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full border p-2 rounded text-gray-900" required />

          <div className="space-y-2">
            <input name="address1" value={formData.address1} onChange={handleChange} placeholder="Address Line 1" className="w-full border p-2 rounded text-gray-900" required />
            <input name="address2" value={formData.address2} onChange={handleChange} placeholder="Address Line 2" className="w-full border p-2 rounded text-gray-900" />
            <div className="grid grid-cols-3 gap-2">
              <input name="postcode" value={formData.postcode} onChange={handleChange} placeholder="Postcode" className="border p-2 rounded text-gray-900" required />
              <input name="county" value={formData.county} onChange={handleChange} placeholder="County" className="border p-2 rounded text-gray-900" required />
              <input name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="border p-2 rounded text-gray-900" required />
            </div>
          </div>

          <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded text-gray-900" required>
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {(formData.role === 'Club Admin' || formData.role === 'Independent Coach') && (
            <div className="space-y-2">
              <input name="clubName" value={formData.clubName} onChange={handleChange} placeholder="Club Name" className="w-full border p-2 rounded text-gray-900" required />
              <input name="clubAddress" value={formData.clubAddress} onChange={handleChange} placeholder="Club Address" className="w-full border p-2 rounded text-gray-900" required />
              <input name="clubCity" value={formData.clubCity} onChange={handleChange} placeholder="Club City" className="w-full border p-2 rounded text-gray-900" required />
            </div>
          )}

          {formData.role === 'Parents' && (
            <div> <label htmlFor="selectedClub">Select Club</label> 
            <select id="selectedClub" value={selectedClub} onChange={(e) => setSelectedClub(e.target.value)} className="w-full px-3 py-2 rounded border" required > 
            <option value="">-- Select a Club --</option> {clubOptions.map((club) => ( <option key={club} value={club}> {club} </option> ))} 
            </select>
             </div> 
             )}

          

          <div className="flex gap-4">
            <button type="button" onClick={handleCancel} className="w-1/2 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="w-1/2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-center text-sm font-medium text-gray-800">{message}</p>}
      </div>
    </div>
  );
}
