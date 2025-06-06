'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TransitionOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsRouting(true);
    const handleStop = () => setIsRouting(false);

    router.events?.on("routeChangeStart", handleStart);
    router.events?.on("routeChangeComplete", handleStop);
    router.events?.on("routeChangeError", handleStop);

    return () => {
      router.events?.off("routeChangeStart", handleStart);
      router.events?.off("routeChangeComplete", handleStop);
      router.events?.off("routeChangeError", handleStop);
    };
  }, [router]);

  // Fallback for App Router where events are limited
  useEffect(() => {
    setIsRouting(false);
  }, [pathname]);

  if (!isRouting) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-white bg-opacity-70 flex justify-center items-center z-50">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}
