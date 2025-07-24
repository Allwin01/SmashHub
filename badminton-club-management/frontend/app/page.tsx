'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SignupOverlay from '@/components/SignupOverlay';

export default function LoginPage() {
  const router = useRouter();
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 30000;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('clubId', result.user.clubId);
        localStorage.setItem('clubName', result.clubName || result.user?.clubName || '');

        switch (result.user.role) {
          case 'SuperAdmin': router.push('/dashboard/superadmin'); break;
          case 'Club Admin': router.push('/dashboard/clubadmin'); break;
          case 'Parents': router.push('/dashboard/Parents'); break;
          case 'Independent Coach': router.push('/dashboard/Independentcoach'); break;
          case 'Tournament Organiser': router.push('/dashboard/TournamentOrganiser'); break;
          default: setMessage('Unknown role.');
        }
      } else {
        setMessage(result.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (showLogin) {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      inactivityTimeout.current = setTimeout(() => {
        setUsername('');
        setPassword('');
        setMessage('');
      }, INACTIVITY_LIMIT);
    }
  }, [showLogin, email, password]);

  return (
    <main className="min-h-screen w-full bg-cover bg-center flex flex-col items-center justify-center px-4 sm:px-8 py-10 text-center" style={{ backgroundImage: "url('/Background2.png')" }}>
      <motion.header className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-wide">SmashHub</h1>
      </motion.header>

      <motion.div className="text-white max-w-3xl mb-8 px-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium">
          SmashHub is your all-in-one badminton club platform — track player skills, organize tournaments, Smart PegBoards, and keep club finances transparent.
        </p>
      </motion.div>

      <AnimatePresence>
        {showLogin && (
          <motion.div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-gradient-to-br from-yellow-300 via-pink-300 to-indigo-400/80 backdrop-blur-md shadow-2xl border border-white/20 p-8 sm:p-10 rounded-2xl" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">Login</h3>
            <form onSubmit={handleLogin} className="space-y-5">
              <input type="text" placeholder="Username" value={email} onChange={(e) => setUsername(e.target.value)} autoFocus className="w-full px-5 py-4 text-lg sm:text-xl rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none" required />
              <input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 text-lg sm:text-xl rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none" required />
              <div className="flex items-center justify-between text-sm text-white">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-yellow-500 w-4 h-4" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-white underline hover:text-yellow-200">Forgot your password?</button>
              </div>
              <button type="submit" className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 rounded text-black font-bold text-lg" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
              <p className="mt-6 text-sm text-white text-center">Not a member? <button onClick={() => setShowSignup(true)} className="underline font-semibold">Sign up now</button></p>
              {message && <p className="text-center text-sm text-red-200 mt-4">{message}</p>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignup && (
          <SignupOverlay onClose={() => setShowSignup(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
