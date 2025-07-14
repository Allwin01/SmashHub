'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UserTable({ users, type, onTogglePermission, onToggleStatus, onCreateLogin }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-blue-100">
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Permissions</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.role || 'N/A'}</td>
                <td className="border px-4 py-2">
                  <span className={user.status === 'Active' ? 'text-green-700' : 'text-red-600'}>
                    {user.status || 'Disabled'}
                  </span>
                </td>
                <td className="border px-4 py-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={user.permissions?.pegBoard ?? false}
                        onChange={() => onTogglePermission(idx, 'pegBoard')}
                      /> PegBoard
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={user.permissions?.playerProfile ?? false}
                        onChange={() => onTogglePermission(idx, 'playerProfile')}
                      /> Player Profile
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={user.permissions?.attendance ?? false}
                        onChange={() => onTogglePermission(idx, 'attendance')}
                      /> Attendance
                    </label>
                    {type === 'admin' && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={user.permissions?.finance ?? false}
                          onChange={() => onTogglePermission(idx, 'finance')}
                        /> Finance
                      </label>
                    )}
                    {type === 'member' && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={user.permissions?.captainSquad ?? false}
                          onChange={() => onTogglePermission(idx, 'captainSquad')}
                        /> Captain Squad
                      </label>
                    )}
                  </div>
                </td>
                <td className="border px-4 py-2 space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(idx)}
                  >
                    {user.status === 'Active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onCreateLogin(user)}
                  >
                    Create Login
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
