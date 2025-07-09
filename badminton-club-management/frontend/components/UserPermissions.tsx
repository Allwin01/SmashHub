import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

const initialUsers = [
  { name: 'Alice Johnson', email: 'alice@example.com', role: 'Parent', status: 'Active' },
  { name: 'Bob Smith', email: 'bob@example.com', role: 'Coach', status: 'Active' },
  { name: 'Carol Lee', email: 'carol@example.com', role: 'ClubAdmin', status: 'Pending' },
  { name: 'Daniel Wu', email: 'daniel@example.com', role: 'Player', status: 'Active' },
];

export default function UserPermissions() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);

  const handleRoleChange = async (index, newRole) => {
    const confirmed = confirm(`Are you sure you want to change ${users[index].name}'s role to ${newRole}?`);
    if (!confirmed) return;
    const updated = [...users];
    updated[index].role = newRole;
    setUsers(updated);
    setLogs(prev => [...prev, `${users[index].name} role changed to ${newRole}`]);

    await fetch('/api/users/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[index].email, newRole })
    });
  };

  const handleToggleStatus = async (index) => {
    const newStatus = users[index].status === 'Active' ? 'Disabled' : 'Active';
    const confirmed = confirm(`Are you sure you want to set ${users[index].name}'s status to ${newStatus}?`);
    if (!confirmed) return;
    const updated = [...users];
    updated[index].status = newStatus;
    setUsers(updated);
    setLogs(prev => [...prev, `${users[index].name} status changed to ${newStatus}`]);

    await fetch('/api/users/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[index].email, newStatus })
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-700">User Access & Permissions</h2>

      <div className="flex justify-between items-center px-2">
        <input
          type="text"
          placeholder="Search by name or email"
          className="border rounded px-3 py-1 text-sm w-1/3"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="text-xs text-gray-500">Showing {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).length} users</span>
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-blue-100">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map((user, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="border px-4 py-2">{user.name}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">
                    <Select value={user.role} onValueChange={(val) => handleRoleChange(idx, val)}>
                      <SelectTrigger className="w-[140px]">
  <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'Player' ? 'bg-blue-100 text-blue-800' : user.role === 'Parent' ? 'bg-yellow-100 text-yellow-800' : user.role === 'Coach' ? 'bg-green-100 text-green-800' : user.role === 'ClubAdmin' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>{user.role}</span>
</SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Player">Player</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Coach">Coach</SelectItem>
                        <SelectItem value="ClubAdmin">ClubAdmin</SelectItem>
                        <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border px-4 py-2">
                    <span className={user.status === 'Active' ? 'text-green-700' : 'text-red-600'}>{user.status}</span>
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleStatus(idx)}>
                      {user.status === 'Active' ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Change Log</h3>
          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
            {logs.length > 0 ? logs.map((log, i) => <li key={i}>{log}</li>) : <li>No changes made yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
