import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const initialLogs = [
  { date: '2025-07-01', user: 'admin@club.com', action: 'Update', entity: 'Player', details: 'Changed skill ratings for #P123' },
  { date: '2025-07-02', user: 'coach@club.com', action: 'Insert', entity: 'Register', details: 'Marked 16 players present' },
  { date: '2025-07-03', user: 'finance@club.com', action: 'Insert', entity: 'Finance', details: '£75 for court hire' },
  { date: '2025-07-04', user: 'admin@club.com', action: 'Delete', entity: 'Player', details: 'Deleted player #P234' }
];

export default function AuditCompliance() {
  const [logs, setLogs] = useState(initialLogs);
  const [userFilter, setUserFilter] = useState(() => localStorage.getItem('auditUserFilter') || '');
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('auditDateFilter') || '');
  const [severityFilter, setSeverityFilter] = useState(() => localStorage.getItem('auditSeverityFilter') || '');
  const [page, setPage] = useState(() => parseInt(localStorage.getItem('auditPage') || '1'));
  const rowsPerPage = 3;

  const filtered = logs.filter(log => {
    const userMatch = userFilter ? log.user.includes(userFilter) : true;
    const dateMatch = dateFilter ? log.date === dateFilter : true;
    const severityMatch = severityFilter ? log.action === severityFilter : true;
    return userMatch && dateMatch && severityMatch;
  });

  const exportCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Entity', 'Details'];
    const rows = filtered.map(log => [log.date, log.user, log.action, log.entity, log.details]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit_log.csv';
    link.click();
  };

  const renderTag = action => {
    const colorMap = {
      Insert: 'bg-green-200 text-green-800',
      Update: 'bg-yellow-200 text-yellow-800',
      Delete: 'bg-red-200 text-white font-bold'
    };
    return (
      <Badge
        onClick={() => {
          localStorage.setItem('auditSeverityFilter', action);
          setSeverityFilter(action);
        }}
        className={`${colorMap[action] || 'bg-gray-200 text-gray-800'} px-2 py-1 rounded cursor-pointer hover:underline`}
      >
        {action}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-red-700">Audit & Compliance</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold">VAT & Tax Summary</h3>
            <p>Last VAT Submission: <strong>2025-06-30</strong></p>
            <p>YTD Income: <strong>£12,400</strong></p>
            <p>YTD Expenses: <strong>£9,250</strong></p>
            <p>Estimated Tax Liability: <strong>£620</strong></p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Audit Focus Links</h3>
            <ul className="list-disc list-inside text-sm text-blue-800">
              <li><a href="#">View Player Update Logs</a></li>
              <li><a href="#">View Finance Entries</a></li>
              <li><a href="#">Export All Change History</a></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center px-4">
        <Button disabled={page === 1} onClick={() => setPage(p => { const np = p - 1; localStorage.setItem('auditPage', np); return np; })}>Previous</Button>
        <span>Page {page} of {Math.ceil(filtered.length / rowsPerPage)}</span>
        <Button disabled={page === Math.ceil(filtered.length / rowsPerPage)} onClick={() => setPage(p => { const np = p + 1; localStorage.setItem('auditPage', np); return np; })}>Next</Button>
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <Label>Filter by Severity</Label>
          <select
            className="border rounded px-2 py-1"
            value={severityFilter}
            onChange={e => { const val = e.target.value; localStorage.setItem('auditSeverityFilter', val); setSeverityFilter(val); }}
          >
            <option value="">All</option>
            <option value="Insert">Insert</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
          </select>
        </div>
        <div>
          <Label>Filter by User</Label>
          <Input value={userFilter} onChange={e => { const val = e.target.value; localStorage.setItem('auditUserFilter', val); setUserFilter(val); }} placeholder="e.g. admin@club.com" />
        </div>
        <div>
          <Label>Filter by Date</Label>
          <Input type="date" value={dateFilter} onChange={e => { const val = e.target.value; localStorage.setItem('auditDateFilter', val); setDateFilter(val); }} />
        </div>
        <Button variant="outline" onClick={() => {
          setUserFilter('');
          setDateFilter('');
          setSeverityFilter('');
          setPage(1);
          localStorage.removeItem('auditUserFilter');
          localStorage.removeItem('auditDateFilter');
          localStorage.removeItem('auditSeverityFilter');
          localStorage.setItem('auditPage', '1');
        }}>Clear All Filters</Button>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <Card>
        <CardContent className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-red-100">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">User</th>
                <th className="border px-4 py-2">Action</th>
                <th className="border px-4 py-2">Entity</th>
                <th className="border px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((log, idx) => (
                <tr key={idx} className={`even:bg-gray-50 ${log.action === 'Delete' ? 'bg-red-50' : ''}`}>
                  <td className="border px-4 py-2">{log.date}</td>
                  <td className="border px-4 py-2">{log.user}</td>
                  <td className="border px-4 py-2">{renderTag(log.action)}</td>
                  <td className="border px-4 py-2">{log.entity}</td>
                  <td className="border px-4 py-2">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
