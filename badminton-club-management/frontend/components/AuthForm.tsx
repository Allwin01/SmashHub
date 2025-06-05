'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const CLUB_OPTIONS = [
  'Smash Masters',
  'Net Rulers',
  'Shuttle Stars',
  'Drop Shot Academy',
  'Power Play Club'
];

export default function AuthForm({ type, handleSubmit }: { 
  type: 'login' | 'signup',
  handleSubmit: (formData: FormData) => Promise<{ error?: string }>
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
  }, [type]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await handleSubmit(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-orange-50 to-blue-50 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-5xl font-bold text-orange-600 mb-2 text-center">
            SmashHub
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            {type === 'login' ? 'Welcome back! Ready to smash today?' : 'Join our badminton community'}
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {type === 'signup' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    required
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Club Admin</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                {(role === 'admin') && (
                  <div>
                    <label className="block text-gray-700 mb-1">Club Name</label>
                    <input
                      type="text"
                      name="clubName"
                      required
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                )}
                {(role === 'player' || role === 'parent') && (
                  <div>
                    <label className="block text-gray-700 mb-1">Registered Club</label>
                    <select
                      name="registeredClub"
                      required
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {CLUB_OPTIONS.map(club => (
                        <option key={club} value={club}>{club}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-gray-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image 
                    src="/images/shuttlecock.svg" 
                    alt="username icon" 
                    width={20} 
                    height={20}
                  />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full p-3 pl-10 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              {type === 'signup' && <PasswordStrengthMeter password={password} />}
            </div>

            {type === 'login' && (
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold ${isSubmitting ? 'bg-orange-400' : 'bg-orange-500 hover:bg-orange-600'} focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                type === 'login' ? 'Login' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            {type === 'login' ? (
              <>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/signup" className="font-medium text-orange-600 hover:text-orange-500">
                    Sign up
                  </Link>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  <Link href="/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                    Forgot password?
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500">
                  Login
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-orange-500 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/badminton-bg.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10 text-white">
          <h2 className="text-3xl font-bold mb-6">🏆 All-In-One Badminton Hub</h2>
          <ul className="space-y-4 text-lg">
            <li className="flex items-start">
              <svg className="h-6 w-6 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Track player skills (Beginner → Elite)</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Update progress with interactive sliders</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Schedule tournaments & club nights</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Export PDF progress reports</span>
            </li>
          </ul>
          <p className="mt-8 italic text-blue-100">
            "From court assignments to smash evaluations—we've got you covered!"
          </p>
        </div>
      </div>
    </div>
  );
}