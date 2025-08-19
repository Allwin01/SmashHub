'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'Club Admin' | 'Parents' | 'Tournament Organiser' | 'Independent Coach' | '';

interface SignupOverlayProps { onClose?: () => void }

// Stricter email regex – requires @, a dot, and a >=2 char TLD
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function SignupOverlay({ onClose }: SignupOverlayProps) {
  const router = useRouter();
  const roles: Role[] = ['Club Admin', 'Parents', 'Tournament Organiser', 'Independent Coach'];

  const [formData, setFormData] = useState({
    firstName: '',
    surName: '',
    email: '',
    username: '',
    password: '',
    address1: '',
    address2: '', // optional
    postcode: '',
    county: '',
    country: '',
    role: '' as Role,
    clubName: '',
    clubCity: '',
    clubAddress: '',
    selectedClub: '',
  });

  const [clubOptions, setClubOptions] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ---------------- Validation ----------------
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const req = (k: keyof typeof formData, label?: string) => {
      if (!String(formData[k] ?? '').trim()) e[k] = `${label ?? k} is required`;
    };

    // Required fields (address2 optional)
    req('firstName', 'First name');
    req('surName', 'Surname');
    req('email', 'Email');
    req('password', 'Password');
    req('address1', 'Address line 1');
    req('postcode', 'Postcode');
    req('county', 'County');
    req('country', 'Country');
    req('role', 'Role');

    // Email format
    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      e.email = 'Enter a valid email address (e.g., name@domain.com)';
    }

    // Password
    if (formData.password && formData.password.length < 8) {
      e.password = 'Password must be at least 8 characters';
    }

    // Role-specific
    if (formData.role === 'Club Admin' || formData.role === 'Independent Coach') {
      req('clubName', 'Club name');
      req('clubAddress', 'Club address');
      req('clubCity', 'Club city');
    }
    if (formData.role === 'Parents') {
      req('selectedClub', 'Club selection');
    }
    return e;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  // ------------- Fetch clubs when Parents selected -------------
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/clubs`);
        const data = await res.json();
        setClubOptions(Array.isArray(data.clubs) ? data.clubs : []);
      } catch (err) {
        console.error('Error loading clubs:', err);
        setClubOptions([]);
      }
    };

    if (formData.role === 'Parents') {
      fetchClubs();
    } else {
      setClubOptions([]);
      setFormData(prev => ({ ...prev, selectedClub: '' }));
    }
  }, [formData.role]);

  // ---------------- Handlers ----------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const v = name === 'email' ? value.trim().toLowerCase() : value;
    setFormData(prev => {
      const next = { ...prev, [name]: v } as typeof prev;
      if (name === 'email') next.username = v; // keep username = email
      return next;
    });
    // 👉 Live validation: mark field as touched as the user types
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      surName: true,
      email: true,
      username: true,
      password: true,
      address1: true,
      address2: true,
      postcode: true,
      county: true,
      country: true,
      role: true,
      clubName: true,
      clubCity: true,
      clubAddress: true,
      selectedClub: true,
    });

    // Hard guard for email
    if (!EMAIL_REGEX.test(formData.email)) {
      setMessage('❌ Please enter a valid email address (e.g., name@domain.com).');
      return;
    }

    if (!isValid) {
      setMessage('❌ Please fix the highlighted errors and try again.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (res.ok) {
        setMessage('✅ Registration successful! Redirecting to login…');
        setTimeout(() => {
          if (onClose) onClose();
          else router.push('/');
        }, 1200);
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

  const handleCancel = () => { if (onClose) onClose(); else router.push('/'); };

  const uiError = (name: keyof typeof formData) => touched[name] && errors[name];
  // Bigger text & padding for accessibility
  const baseInput = 'w-full border rounded text-gray-900 outline-none focus:ring-2 transition-colors text-lg sm:text-xl p-3.5 focus:ring-indigo-500';
  const errClass = 'border-red-500 focus:ring-red-400';
  const labelClass = 'block text-left mb-1 text-base sm:text-lg font-medium text-gray-800';
  const helpClass = 'mt-1 text-sm sm:text-base text-red-600';

  return (
    // Transparent backdrop overlay (login remains visible)
    <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent">
      <div className="min-h-full w-full flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative">
          <button onClick={handleCancel} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl font-bold" aria-label="Close">×</button>

          <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 text-center">Create Your Account</h2>
          <p className="text-center text-base sm:text-lg text-gray-700 mb-6" aria-live="polite">
            All fields are mandatory unless marked optional.
          </p>

          {/* IMPORTANT: noValidate prevents native bubbles. Do not use `required` anywhere. */}
          <form className="space-y-5 sm:space-y-6 text-gray-900" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="firstName" className={labelClass}>First Name</label>
                <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g., Priya" className={`${baseInput} ${uiError('firstName') ? errClass : (touched.firstName ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('firstName')} />
                {uiError('firstName') && <p className={helpClass}>{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="surName" className={labelClass}>Surname</label>
                <input id="surName" name="surName" value={formData.surName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g., Sharma" className={`${baseInput} ${uiError('surName') ? errClass : (touched.surName ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('surName')} />
                {uiError('surName') && <p className={helpClass}>{errors.surName}</p>}
              </div>
            </div>

            {/* Email – type=text to avoid native validation bubble; we validate ourselves */}
            <div>
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <input id="email" name="email" type="text" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="name@domain.com" className={`${baseInput} ${uiError('email') ? errClass : (touched.email ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('email')} inputMode="email" autoComplete="email" />
              {uiError('email') && <p className={helpClass}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} placeholder="Minimum 8 characters" className={`${baseInput} ${uiError('password') ? errClass : (touched.password ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('password')} autoComplete="new-password" />
              {uiError('password') && <p className={helpClass}>{errors.password}</p>}
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div>
                <label htmlFor="address1" className={labelClass}>Address Line 1</label>
                <input id="address1" name="address1" value={formData.address1} onChange={handleChange} onBlur={handleBlur} placeholder="House / Street" className={`${baseInput} ${uiError('address1') ? errClass : (touched.address1 ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('address1')} autoComplete="address-line1" />
                {uiError('address1') && <p className={helpClass}>{errors.address1}</p>}
              </div>

              <div>
                <label htmlFor="address2" className={labelClass}>Address Line 2 <span className="font-normal text-gray-500">(optional)</span></label>
                <input id="address2" name="address2" value={formData.address2} onChange={handleChange} onBlur={handleBlur} placeholder="Apt / Landmark" className={baseInput} autoComplete="address-line2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="postcode" className={labelClass}>Postcode</label>
                  <input id="postcode" name="postcode" value={formData.postcode} onChange={handleChange} onBlur={handleBlur} placeholder="e.g., SN25 3EW" className={`${baseInput} ${uiError('postcode') ? errClass : (touched.postcode ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('postcode')} autoComplete="postal-code" />
                  {uiError('postcode') && <p className={helpClass}>{errors.postcode}</p>}
                </div>
                <div>
                  <label htmlFor="county" className={labelClass}>County</label>
                  <input id="county" name="county" value={formData.county} onChange={handleChange} onBlur={handleBlur} placeholder="County" className={`${baseInput} ${uiError('county') ? errClass : (touched.county ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('county')} />
                  {uiError('county') && <p className={helpClass}>{errors.county}</p>}
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>Country</label>
                  <input id="country" name="country" value={formData.country} onChange={handleChange} onBlur={handleBlur} placeholder="Country" className={`${baseInput} ${uiError('country') ? errClass : (touched.country ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('country')} autoComplete="country-name" />
                  {uiError('country') && <p className={helpClass}>{errors.country}</p>}
                </div>
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className={labelClass}>Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} onBlur={handleBlur} className={`${baseInput} ${uiError('role') ? errClass : (touched.role ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('role')}>
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {uiError('role') && <p className={helpClass}>{errors.role}</p>}
            </div>

            {/* Role-specific: Club Admin / Independent Coach */}
            {(formData.role === 'Club Admin' || formData.role === 'Independent Coach') && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="clubName" className={labelClass}>Club Name</label>
                  <input id="clubName" name="clubName" value={formData.clubName} onChange={handleChange} onBlur={handleBlur} placeholder="Club name" className={`${baseInput} ${uiError('clubName') ? errClass : (touched.clubName ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('clubName')} />
                  {uiError('clubName') && <p className={helpClass}>{errors.clubName}</p>}
                </div>
                <div>
                  <label htmlFor="clubAddress" className={labelClass}>Club Address</label>
                  <input id="clubAddress" name="clubAddress" value={formData.clubAddress} onChange={handleChange} onBlur={handleBlur} placeholder="Address" className={`${baseInput} ${uiError('clubAddress') ? errClass : (touched.clubAddress ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('clubAddress')} />
                  {uiError('clubAddress') && <p className={helpClass}>{errors.clubAddress}</p>}
                </div>
                <div>
                  <label htmlFor="clubCity" className={labelClass}>Club City</label>
                  <input id="clubCity" name="clubCity" value={formData.clubCity} onChange={handleChange} onBlur={handleBlur} placeholder="City" className={`${baseInput} ${uiError('clubCity') ? errClass : (touched.clubCity ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('clubCity')} />
                  {uiError('clubCity') && <p className={helpClass}>{errors.clubCity}</p>}
                </div>
              </div>
            )}

            {/* Role-specific: Parents */}
            {formData.role === 'Parents' && (
              <div>
                <label htmlFor="selectedClub" className={labelClass}>Select Club</label>
                <select id="selectedClub" name="selectedClub" value={formData.selectedClub} onChange={handleChange} onBlur={handleBlur} className={`${baseInput} ${uiError('selectedClub') ? errClass : (touched.selectedClub ? 'border-green-500 focus:ring-green-400' : '')}`} aria-invalid={!!uiError('selectedClub')}>
                  <option value="">-- Select a Club --</option>
                  {clubOptions.map(club => (<option key={club} value={club}>{club}</option>))}
                </select>
                {uiError('selectedClub') && <p className={helpClass}>{errors.selectedClub}</p>}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button type="button" onClick={handleCancel} className="w-1/2 py-3 sm:py-3.5 border rounded-lg hover:bg-gray-100 text-lg">Cancel</button>
              <button type="submit" disabled={isSubmitting || !isValid} aria-disabled={isSubmitting || !isValid} className={`w-1/2 text-white py-3 sm:py-3.5 rounded-lg text-lg ${isSubmitting || !isValid ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>

          {message && <p className="mt-6 text-center text-base sm:text-lg font-medium text-gray-800" aria-live="polite">{message}</p>}
        </div>
      </div>
    </div>
  );
}
