import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const initialIntegrations = [
  { system: 'QuickBooks', status: 'Connected', lastSynced: '2025-07-01' },
  { system: 'Bank Feed', status: 'Not Connected', lastSynced: null },
  { system: 'CRM (Zoho)', status: 'Connected', lastSynced: '2025-07-02' }
];

const initialLogs = [
  { date: '2025-07-01', system: 'QuickBooks', result: 'Success', message: '3 expenses synced' },
  { date: '2025-07-02', system: 'CRM (Zoho)', result: 'Success', message: '4 contacts updated' },
  { date: '2025-07-02', system: 'QuickBooks', result: 'Failed', message: 'Authentication error' }
];

export default function IntegrationSettings() {
  const [apiKey] = useState('sk_live_club_xyz_2025');
  const [logs, setLogs] = useState(initialLogs);
  const [filterSystem, setFilterSystem] = useState('');
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const logsPerPage = 5;

  const filteredLogs = logs.filter(
    (log) => (!filterSystem || log.system === filterSystem) && (!warningsOnly || log.alert)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-700">Integration Settings</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {initialIntegrations.map((item, idx) => (
            <div key={idx} className="p-4 border rounded shadow-sm">
              <h3 className="text-lg font-semibold">{item.system}</h3>
              <p>Status: <span className={item.status === 'Connected' ? 'text-green-600' : 'text-red-600'}>{item.status}</span></p>
              <p>Last Synced: {item.lastSynced || '—'}</p>
              <div className="mt-2 space-x-2">
                <Button size="sm" variant="outline">{item.status === 'Connected' ? 'Disconnect' : 'Connect'}</Button>
                <Button size="sm">Manual Sync</Button>
                <Button size="sm" variant="secondary" onClick={() => {
                  const now = new Date().toISOString().split('T')[0];
                  const newLog = {
                    date: now,
                    system: item.system,
                    result: 'Success',
                    message: `Manual sync completed for ${item.system}`,
                    alert: logs.filter(l => l.system === item.system && l.result === 'Failed').length >= 2
                  };
                  setLogs(prev => [newLog, ...prev]);
                  alert(`Manual sync completed for ${item.system}`);
                }}>Simulate Sync</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-4">
          <h3 className="text-lg font-semibold mb-2">API Key & Webhook</h3>
          <p className="text-sm">Public API Key: <code className="bg-gray-100 px-2 py-1 rounded">{apiKey}</code></p>
          <p className="text-sm mt-2">Webhook Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">https://smashhub.io/api/integrations/webhook</code></p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Sync Logs</h3>
          <div className="flex gap-4 mb-2 items-end">
            <select
              className="border px-2 py-1 rounded"
              value={filterSystem}
              onChange={e => setFilterSystem(e.target.value)}
            >
              <option value="">All Systems</option>
              {[...new Set(logs.map(log => log.system))].map((sys, i) => (
                <option key={i} value={sys}>{sys}</option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={warningsOnly} onChange={e => setWarningsOnly(e.target.checked)} /> Show Warnings Only
            </label>
            <Button
              variant="outline"
              onClick={() => {
                const headers = ['Date', 'System', 'Result', 'Message'];
                const rows = filteredLogs.map(l => [l.date, l.system, l.result, l.message]);
                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'sync_logs.csv';
                link.click();
              }}
            >Export Logs</Button>
          </div>

          <table className="min-w-full text-sm border">
            <thead className="bg-purple-100">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">System</th>
                <th className="border px-4 py-2">Result</th>
                <th className="border px-4 py-2">Message</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage).map((log, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="border px-4 py-2">
                    {log.date} {log.date === new Date().toISOString().split('T')[0] && <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Today</span>}
                  </td>
                  <td className="border px-4 py-2">{log.system}</td>
                  <td className={`border px-4 py-2 ${log.result === 'Failed' ? 'text-red-600' : 'text-green-600'}`}>{log.result}</td>
                  <td className="border px-4 py-2">
                    {log.message}
                    {log.alert && <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-1 rounded">⚠ High Failures</span>}
                  </td>
                  <td className="border px-4 py-2">
                    {log.result === 'Failed' && (
                      <Button size="sm" onClick={() => alert(`Retrying sync for ${log.system}`)}>Retry</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between px-4 mt-2">
            <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm">Page {page} of {Math.ceil(filteredLogs.length / logsPerPage)}</span>
            <Button size="sm" disabled={page >= Math.ceil(filteredLogs.length / logsPerPage)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
