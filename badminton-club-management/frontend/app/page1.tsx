'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const role = result.user.role;
        localStorage.setItem('token', result.token);
        localStorage.setItem('clubId', result.user.clubId);
        localStorage.setItem('clubName', result.clubName || result.user?.clubName || '');

        switch (role) {
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

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center font-sans px-4 sm:px-8 md:px-12 py-10 md:py-20 lg:py-32"
      style={{ backgroundImage: "url('/Background.png')" }}
    >
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-sm lg:max-w-sm xl:max-w-sm mx-auto">
        <form
          onSubmit={handleLogin}
          className="w-full space-y-6 bg-white/30 backdrop-blur-md shadow-2xl border border-white/20 p-6 sm:p-8 rounded-2xl"
        >
          <div className="text-center">
  <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-indigo-500 font-extrabold text-3xl sm:text-4xl mb-2">SmashHub</h1>
  <p className="text-white text-sm sm:text-base leading-relaxed max-w-md mx-auto">
    Welcome! SmashHub is your all-in-one badminton club platform — track skills, manage courts, organize tournaments, run Smart PegBoards, and keep club finances transparent.
  </p>
</div>
          <input
            type="text"
            placeholder="Username"
            value={email}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const nextInput = document.getElementById('password');
                nextInput?.focus();
              }
            }}

            className="w-full px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-base"
            required
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-base"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 transition-all duration-300 rounded-lg text-black font-bold text-lg shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          {message && (
            <p className="text-center text-red-200 text-sm font-medium">{message}</p>
          )}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-white font-semibold hover:underline"
            >
              Not a member? Sign up now
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}



{/*}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const role = result.user.role;

        // ✅ Store the JWT token
         // ✅ Store the JWT token and club info
  localStorage.setItem('token', result.token);
  localStorage.setItem('clubId', result.user.clubId); 
  localStorage.setItem('clubName', result.clubName || result.user?.clubName || '');


        console.log('Returned token:', result.token);  
        switch (role) {
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

  return (
    <main className="flex h-screen w-full font-sans">
      {/* Left - Form *
      <div className="w-1/2 bg-gradient-to-br from-gray-100 to-slate-200 text-black flex flex-col justify-center items-center p-8">
        <div className="mb-6">
          <Image src="/logo3.png" alt="SmashHub Logo" width={200} height={200} priority />
        </div>

        <div className="w-full max-w-sm">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium">UserName</label>
              <div className="flex items-center bg-white px-3 py-2 rounded border">
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="bg-transparent focus:outline-none w-full text-black"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium">Password</label>
              <div className="flex items-center bg-white px-3 py-2 rounded border">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="bg-transparent focus:outline-none w-full text-black"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 transition-all duration-300 rounded text-white font-semibold shadow-md hover:shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-sm text-center">
            <a href="#" className="text-gray-600 hover:underline">Forgot password?</a>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/signup')}
              className="text-blue-500 font-semibold hover:underline"
            >
              Sign Up
            </button>
          </div>

          {message && (
            <p className="mt-4 text-center text-sm font-medium text-red-600">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Right - Background *
      <div className="w-1/2 relative bg-gradient-to-br from-blue-50 to-blue-100 text-black p-10 flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-[url('/Home-bg8.png')] bg-cover bg-center bg-no-repeat" />
        <div className="relative z-10 max-w-xl mx-auto pb-4">
          {/* Optional content *
        </div>
      </div>
    </main>
  );
}


{/* 

Just the lay out
'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center">
      <div className="bg-[#1b1f3b] w-[90%] max-w-5xl rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">

        {/* Left - Login Form *
        <div className="md:w-1/2 p-10 text-white flex flex-col justify-center">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1116.95 6.05M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="ml-4 text-xl font-bold">SmashHub</span>
          </div>

          <h2 className="text-3xl font-bold mb-6">Welcome Back</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 rounded bg-[#2d3155] text-white placeholder-gray-400 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 rounded bg-[#2d3155] text-white placeholder-gray-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="w-full py-2 bg-pink-500 hover:bg-pink-600 rounded text-white font-semibold transition duration-200"
            >
              LOGIN
            </button>
          </div>

          <div className="flex justify-between mt-4 text-sm text-gray-300">
            <label>
              <input type="checkbox" className="mr-1" /> Remember me
            </label>
            <a href="#" className="hover:underline">Forgot password?</a>
          </div>
        </div>

        {/* Right - Graphic *
        <div className="md:w-1/2 relative hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-700 to-purple-800">
          <div className="text-center px-6">
            <h2 className="text-white text-4xl font-bold mb-4">Welcome.</h2>
            <p className="text-gray-200 mb-6 text-sm">
              Join SmashHub to track skills, manage club nights, and organize tournaments.
            </p>
            <p className="text-white text-sm">
              Not a member? <a href="#" className="text-blue-300 hover:underline">Sign up now</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

*/}
