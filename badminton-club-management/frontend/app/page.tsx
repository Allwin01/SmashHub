'use client';
import Link from "next/link";

import '../styles/globals.css';
import Image from "next/image";
import { useRouter } from "next/navigation";



export default function HomePage() {
  const router = useRouter();


  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    console.log("Login form submitted");
  };

  return (
    <main className="flex h-screen w-full font-sans">
      {/* Left Side - Login Form */}
      <div className="w-1/2 bg-gradient-to-br from-gray-100 to-slate-200 text-black flex flex-col justify-center items-center p-8">
        {/* Logo Image */}
        <div className="mb-6">
          <Image src="/logo3.png" alt="SmashHub Logo" width={200} height={200} priority />
        </div>

        <div className="w-full max-w-sm">
          <form className="space-y-6">
            <div>
              <label className="block mb-1 text-sm font-medium">Username</label>
              <div className="flex items-center bg-white px-3 py-2 rounded border">
                <input type="text" placeholder="Username" className="bg-transparent focus:outline-none w-full text-black" />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <div className="flex items-center bg-white px-3 py-2 rounded border">
                <input type="password" placeholder="Password" className="bg-transparent focus:outline-none w-full text-black" />
              </div>
            </div>
            <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 transition-all duration-300 rounded text-white font-semibold shadow-md hover:shadow-xl">
              Login
            </button>
          </form>

          <div className="mt-4 text-sm text-center">
            <a href="#" className="text-gray-600 hover:underline">Forgot password?</a>
          </div>

          <div className="mt-6 text-center">
 <button
              onClick={() => router.push("/signup")}
              className="text-blue-500 font-semibold hover:underline"
            >
              Sign Up
            </button>
</div>

        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div className="w-1/2 relative bg-gradient-to-br from-blue-50 to-blue-100 text-black p-10 flex flex-col justify-end overflow-hidden">
        {/* Static Background Court Illustration */}
        <div className="absolute inset-0 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: "url('/Home-bg2.png')" }} />

        {/* Foreground Content */}
        <div className="relative z-10 max-w-xl mx-auto pb-4">
          <h2 className="text-3xl font-bold mb-4 drop-shadow-md">
            All-In-One Badminton Hub
          </h2>
          <ul className="space-y-2 text-lg">
            <li><span className="font-bold">For Players:</span> Track skills (Beginner → Elite)</li>
            <li><span className="font-bold">For Coaches:</span> Update progress with sliders</li>
            <li><span className="font-bold">For Admins:</span> Schedule tournaments ; club rights</li>
            <li><span className="font-bold">For Parents:</span> Export PDF progress reports</li>
          </ul>
          <p className="mt-4 italic">"From court assignments to smash evaluations — we've got you covered!"</p>

        </div>
      </div>
    </main>

  );
}

