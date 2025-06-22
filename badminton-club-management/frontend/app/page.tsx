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
        localStorage.setItem('token', result.token);
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
      {/* Left - Form */}
      <div className="w-1/2 bg-gradient-to-br from-gray-100 to-slate-200 text-black flex flex-col justify-center items-center p-8">
        <div className="mb-6">
          <Image src="/logo3.png" alt="SmashHub Logo" width={200} height={200} priority />
        </div>

        <div className="w-full max-w-sm">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium">email</label>
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

      {/* Right - Background */}
      <div className="w-1/2 relative bg-gradient-to-br from-blue-50 to-blue-100 text-black p-10 flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-[url('/Home-bg8.png')] bg-cover bg-center bg-no-repeat" />
        <div className="relative z-10 max-w-xl mx-auto pb-4">
          {/* Optional content */}
        </div>
      </div>
    </main>
  );
}
