/* import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from './_components/AdminDashboard';
import PlayerDashboard from './_components/PlayerDashboard';
import CoachDashboard from './_components/CoachDashboard';
import ParentDashboard from './_components/ParentDashboard';
import SuperAdminDashboard from './_components/SuperAdminDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-orange-600">
            Welcome back, {user.name}!
          </h1>
          <form action="/api/auth/logout" method="POST">
            <button 
              type="submit"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'player' && <PlayerDashboard />}
        {user.role === 'coach' && <CoachDashboard />}
        {user.role === 'parent' && <ParentDashboard />}
        {user.role === 'superadmin' && <SuperAdminDashboard />}
      </main>
    </div>
  );
}

*/