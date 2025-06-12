'use client'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage({ params }: { params: { role: string } }) {
  const router = useRouter();
  const { role } = params;

  useEffect(() => {
    // Optional: fetch user data based on token
  }, []);

  return (
    <div className="p-6 text-lg font-bold">
      Welcome to the {role} Dashboard
    </div>
  );
}
