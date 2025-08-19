'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SignupOverlay from '@/components/SignupOverlay';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 30000; // 30s

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('clubId', result.user?.clubId || '');
        localStorage.setItem('clubName', result.clubName || result.user?.clubName || '');

        switch (result.user?.role) {
          case 'SuperAdmin':
            router.push('/dashboard/superadmin');
            break;
          case 'Club Admin':
            router.push('/dashboard/clubadmin');
            break;
          case 'Parents':
            router.push('/dashboard/Parents');
            break;
          case 'Independent Coach':
            router.push('/dashboard/Independentcoach');
            break;
          case 'Tournament Organiser':
            router.push('/dashboard/TournamentOrganiser');
            break;
          default:
            setMessage('Unknown role.');
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

  // Clear inputs after inactivity while the login card is visible
  useEffect(() => {
    if (!showSignup) {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      inactivityTimeout.current = setTimeout(() => {
        setEmail('');
        setPassword('');
        setMessage('');
      }, INACTIVITY_LIMIT);
    }
    return () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    };
  }, [showSignup, email, password]);

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center flex flex-col items-center justify-center px-4 sm:px-8 py-10 text-center"
      style={{ backgroundImage: "url('/Background2.png')" }}
    >
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-wide">
          SmashHub
        </h1>
      </motion.header>

      <motion.div
        className="text-white max-w-3xl mb-8 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium">
          SmashHub is your all-in-one badminton club platform — track player skills, organize
          tournaments, Smart PegBoards, and keep club finances transparent.
        </p>
      </motion.div>

      {/* Login card */}
      {!showSignup && (
        <motion.div
          className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-gradient-to-br from-yellow-300 via-pink-300 to-indigo-400/80 backdrop-blur-md shadow-2xl border border-white/20 p-8 sm:p-10 rounded-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">Login</h3>

          <motion.form
            onSubmit={handleLogin}
            className="space-y-5"
            noValidate
            animate={message ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full px-5 py-4 text-lg sm:text-xl rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none"
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 text-lg sm:text-xl rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none"
            />

            <button
              type="submit"
              className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 rounded text-black font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>

            <p className="mt-6 text-sm text-white text-center">
              Not a member?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="underline font-semibold"
              >
                Sign up now
              </button>
            </p>

            {/* Big, accessible error */}
            {message && (
              <div role="alert" aria-live="assertive" className="mt-4">
                <p className="flex items-center justify-center gap-2
                               text-red-700 bg-red-50/90 border border-red-300
                               rounded-xl px-4 py-3 shadow
                               text-base sm:text-lg md:text-xl font-semibold tracking-wide">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 md:w-6 md:h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16Zm-.75-11a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0V7Zm.75 8a1 1 0 100-2 1 1 0 000 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {message}
                </p>
              </div>
            )}
          </motion.form>
        </motion.div>
      )}

      {/* Signup overlay (from components/SignupOverlay) */}
      <AnimatePresence>
        {showSignup && (
          <motion.div
            key="signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <SignupOverlay onClose={() => setShowSignup(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
