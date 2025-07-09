import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const initialRevenue = [
  {
    date: '2025-07-01',
    category: 'Event Ticket',
    description: 'Summer Smash Open 2025',
    amount: 200,
    source: 'Tournament',
    refunded: false,
    isEditing: false
  },
  {
    date: '2025-07-03',
    category: 'Donation',
    description: 'Local sponsorship by SportCo',
    amount: 500,
    source: 'Sponsor',
    refunded: false,
    isEditing: false
  },
  {
    date: '2025-07-05',
    category: 'POS Sale',
    description: 'Club T-shirt sale',
    amount: 75,
    source: 'Merchandise Booth',
    refunded: false,
    isEditing: false
  }
];

export default function RevenueTracker() {
  const [revenues, setRevenues] = useState(initialRevenue);
  const [form, setForm] = useState({ date: '', category: '', description: '', amount: '', source: '', refunded: false });
  const [filterMonth, setFilterMonth] = useState('2025-07');

  const filtered = revenues.filter(r => r.date.startsWith(filterMonth));
  const total = filtered.reduce((sum, r) => sum + r.amount, 0);
  const refunds = filtered.reduce((sum, r) => r.refunded ? sum + r.amount : sum, 0);

  const handleAdd = () => {
    if (!form.date || !form.category || !form.description || !form.amount || !form.source) {
      alert('Fill in all fields');
      return;
    }
    const newEntry = { ...form, amount: parseFloat(form.amount), isEditing: false };
    setRevenues(prev => [...prev, newEntry]);
    setForm({ date: '', category: '', description: '', amount: '', source: '', refunded: false });
  };

  const toggleEdit = i => {
    setRevenues(prev => prev.map((r, idx) => idx === i ? { ...r, isEditing: !r.isEditing } : r));
  };

  const handleChange = (i, field, value) => {
    const updated = [...revenues];
    updated[i][field] = field === 'amount' ? parseFloat(value) : value;
    setRevenues(updated);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-800">Revenue & Sales Tracking</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border rounded px-3 py-2 w-full">
              <option value="">Select</option>
              <option value="Event Ticket">Event Ticket</option>
              <option value="POS Sale">POS Sale</option>
              <option value="Donation">Donation</option>
              <option value="Sponsorship">Sponsorship</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Amount (£)</Label>
            <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label>Source</Label>
            <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.refunded} onChange={e => setForm({ ...form, refunded: e.target.checked })} /> Refunded?
            </label>
            <Button className="mt-2" onClick={handleAdd}>Add Revenue</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Revenue Summary</h3>
            <div>
              <Label className="mr-2">Filter by Month</Label>
              <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
            </div>
          </div>

          <table className="min-w-full text-sm border">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Refund</th>
                <th className="border px-4 py-2">Source</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="border px-2 py-1">{r.isEditing ? <Input type="date" value={r.date} onChange={e => handleChange(i, 'date', e.target.value)} /> : r.date}</td>
                  <td className="border px-2 py-1">{r.isEditing ? <Input value={r.category} onChange={e => handleChange(i, 'category', e.target.value)} /> : r.category}</td>
                  <td className="border px-2 py-1">{r.isEditing ? <Textarea rows={1} value={r.description} onChange={e => handleChange(i, 'description', e.target.value)} /> : r.description}</td>
                  <td className="border px-2 py-1">{r.isEditing ? <Input type="number" value={r.amount} onChange={e => handleChange(i, 'amount', e.target.value)} /> : `£${r.amount}`}</td>
                  <td className="border px-2 py-1 text-center">{r.isEditing ? <input type="checkbox" checked={r.refunded} onChange={e => handleChange(i, 'refunded', e.target.checked)} /> : (r.refunded ? '✅' : '—')}</td>
                  <td className="border px-2 py-1">{r.isEditing ? <Input value={r.source} onChange={e => handleChange(i, 'source', e.target.value)} /> : r.source}</td>
                  <td className="border px-2 py-1 text-center">
                    <Button size="sm" onClick={() => toggleEdit(i)}>{r.isEditing ? 'Save' : 'Edit'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right space-y-1">
            <div className="text-green-800 font-semibold">Total Revenue: £{total}</div>
            <div className="text-red-600 font-semibold">Total Refunds: £{refunds}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
