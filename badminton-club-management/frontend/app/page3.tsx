
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SignupOverlay from '@/components/SignupOverlay';

export default function LoginPage() {
  const router = useRouter();
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <main className="min-h-screen w-full bg-cover bg-center flex flex-col items-center justify-start px-4 sm:px-8 py-10" style={{ backgroundImage: "url('/Background1.png')" }}>
      <motion.div className="text-center text-white max-w-2xl mt-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-400 to-indigo-500 mb-4">SmashHub</h1>
        <p className="text-lg sm:text-xl leading-relaxed">Welcome! SmashHub is your all-in-one badminton club platform — track skills, manage courts, organize tournaments, run Smart PegBoards, and keep club finances transparent.</p>
      </motion.div>

      <AnimatePresence>
        {showLogin && (
          <motion.div className="w-full max-w-sm mt-28 bg-white/30 backdrop-blur-md shadow-2xl border border-white/20 p-6 rounded-2xl" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="Username" value={email} onChange={(e) => setUsername(e.target.value)} autoFocus className="w-full px-4 py-2 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none" required />
              <input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none" required />
              <button type="submit" className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 rounded text-black font-semibold" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
              {message && <p className="text-center text-sm text-red-200">{message}</p>}
              <div className="text-center pt-2">
                <button type="button" onClick={() => setShowSignup(true)} className="text-white font-semibold hover:underline">Not a member? Sign up now</button>
              </div>
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


{/*}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(true); // always show login
  const [showSignup, setShowSignup] = useState(false);
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 30000; // 30 seconds

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('clubId', result.user.clubId);
        localStorage.setItem('clubName', result.clubName || result.user?.clubName || '');

        switch (result.user.role) {
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
    <main
      className="min-h-screen w-full bg-cover bg-center flex flex-col items-center justify-start px-4 sm:px-8 py-10"
      style={{ backgroundImage: "url('/Background.png')" }}
    >
      <motion.div
        key="intro-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="text-center text-white max-w-2xl mt-10"
      >
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-400 to-indigo-500 mb-4">
          SmashHub
        </h1>
        <p className="text-lg sm:text-xl leading-relaxed">
          Welcome! SmashHub is your all-in-one badminton club platform — track skills,
          manage courts, organize tournaments, run Smart PegBoards, and keep club finances transparent.
        </p>
      </motion.div>

      <AnimatePresence>
        {showLogin && (
          <motion.div
            key="login-box"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm mt-28 bg-white/30 backdrop-blur-md shadow-2xl border border-white/20 p-6 rounded-2xl"
          >
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={email}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const nextInput = document.getElementById('password');
                    if (nextInput && nextInput instanceof HTMLInputElement) {
                      nextInput.focus();
                    }
                  }
                }}
                className="w-full px-4 py-2 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none"
                required
              />
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 rounded text-black font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
              {message && <p className="text-center text-sm text-red-200">{message}</p>}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="text-white font-semibold hover:underline"
                >
                  Not a member? Sign up now
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignup && (
          <motion.div
            key="signup-box"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowSignup(false)}
                className="absolute top-2 right-3 text-black text-xl hover:text-red-600"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-center">Create Your SmashHub Account</h2>
              <form className="space-y-3">
                <input type="text" placeholder="Full Name" className="w-full p-2 border rounded" />
                <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
                <input type="password" placeholder="Password" className="w-full p-2 border rounded" />
                <button className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600">Sign Up</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
*/}