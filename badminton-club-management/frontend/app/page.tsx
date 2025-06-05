import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex h-screen w-full font-sans">
      {/* Left Side - Login Form */}
      <div className="w-1/2 bg-[#0A1F44] text-white flex flex-col justify-center items-center p-8">
        {/* Logo Image */}
        <div className="mb-8">
          <Image src="/SmahHub.png" alt="SmashHub Logo" width={200} height={200} priority />
        </div>

        <div className="w-full max-w-sm">
          <form className="space-y-6">
            <div>
              <label className="block mb-1 text-sm font-medium">Username</label>
              <div className="flex items-center bg-[#1B2A52] px-3 py-2 rounded">
                <input type="text" placeholder="Username" className="bg-transparent focus:outline-none w-full text-white" />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <div className="flex items-center bg-[#1B2A52] px-3 py-2 rounded">
                <input type="password" placeholder="Password" className="bg-transparent focus:outline-none w-full text-white" />
              </div>
            </div>
            <button className="w-full py-2 bg-orange-500 hover:bg-orange-600 transition-all duration-300 rounded text-white font-semibold shadow-md hover:shadow-xl">
              Login
            </button>
          </form>

          <div className="mt-4 text-sm text-center">
            <a href="#" className="text-gray-300 hover:underline">Forgot password?</a>
          </div>

          <div className="mt-6 text-center">
            <a href="#" className="text-orange-400 font-semibold hover:underline">Sign Up</a>
          </div>
        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div className="w-1/2 relative bg-gradient-to-br from-orange-400 to-orange-600 text-white p-10 flex flex-col justify-center overflow-hidden">
        {/* Background Court Illustration */}
        <div className="absolute inset-0 opacity-10 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: "url('/court-bg.png')" }} />

        {/* Foreground Content */}
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 drop-shadow-md">
            All-In-One Badminton Hub
          </h2>
          <ul className="space-y-3 text-lg">
            <li><span className="font-bold">For Players:</span> Track skills (Beginner → Elite)</li>
            <li><span className="font-bold">For Coaches:</span> Update progress with sliders</li>
            <li><span className="font-bold">For Admins:</span> Schedule tournaments ; club rights</li>
            <li><span className="font-bold">For Parents:</span> Export PDF progress reports</li>
          </ul>
          <p className="mt-6 italic">"From court assignments to smash evaluations — we've got you covered!"</p>
        </div>
      </div>
    </main>
  );
}
