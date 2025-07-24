'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'react-toastify';

export default function UserTable({
  users,
  type,
  onRoleChange = () => {},
  onTogglePermission = () => {},
  onToggleStatus = () => {},
  onCreateLogin = () => {},
  onSavePermissions = () => {},
  onSaveStatus = () => {},
  showName = false,
  formatName = (user) => `${user.firstName || ''} ${user.surName || ''}`,
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-blue-100">
            <tr>
              {showName && <th className="border px-4 py-2">Name</th>}
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Permissions</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                {showName && (
                  <td className="border px-4 py-2">
                    {formatName ? formatName(user) : `${user.firstName} ${user.surName}`}
                  </td>
                )}
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">
                  <Select value={user.role} onValueChange={(val) => onRoleChange(idx, val)}>
                    <SelectTrigger className="w-[140px]">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-800">{user.role}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {type === 'parent' && <SelectItem value="Parent">Parent</SelectItem>}
                      {type === 'coach' && (
                        <>
                          <SelectItem value="Coach">Coach</SelectItem>
                          <SelectItem value="TeamCaptain">Team Captain</SelectItem>
                        </>
                      )}
                      {type === 'admin' && (
                        <>
                          <SelectItem value="ClubAdmin2">ClubAdmin2</SelectItem>
                          <SelectItem value="ClubAdmin3">ClubAdmin3</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-4 py-2">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={user.permissions?.pegBoard || false} onChange={() => onTogglePermission(idx, 'pegBoard')} /> PegBoard
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={user.permissions?.playerProfile || false} onChange={() => onTogglePermission(idx, 'playerProfile')} /> Player Profile
                    </label>
                    {type === 'coach' && (
                      <>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={user.permissions?.skillMatrix || false} onChange={() => onTogglePermission(idx, 'skillMatrix')} /> Skill Matrix
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={user.permissions?.attendance || false} onChange={() => onTogglePermission(idx, 'attendance')} /> Attendance
                        </label>
                      </>
                    )}
                    {type === 'admin' && (
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={user.permissions?.finance || false} onChange={() => onTogglePermission(idx, 'finance')} /> Finance
                      </label>
                    )}
                  </div>
                </td>
                <td className="border px-4 py-2">
                  <span className={user.status === 'Active' ? 'text-green-700' : 'text-red-600'}>{user.status}</span>
                </td>
                <td className="border px-4 py-2 space-y-1">
                  <Button size="sm" variant="outline" onClick={() => onToggleStatus(idx)}>
                    {user.status === 'Active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" onClick={() => onCreateLogin(idx)}>Create Login</Button>
                  <Button size="sm" variant="secondary" onClick={() => onSavePermissions(idx)}>Save Permissions</Button>
                  <Button size="sm" variant="secondary" onClick={() => onSaveStatus(idx)}>Save Status</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
