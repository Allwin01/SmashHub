import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const initialEvents = [
  {
    name: 'Summer Tournament',
    type: 'Tournament',
    date: '2025-07-15',
    plannedIncome: 1000,
    plannedExpense: 700,
    actualIncome: 900,
    actualExpense: 750
  },
  {
    name: 'Social Mixer Night',
    type: 'Social',
    date: '2025-08-05',
    plannedIncome: 200,
    plannedExpense: 150,
    actualIncome: 180,
    actualExpense: 160
  }
];

export default function EventCosting() {
  const [events, setEvents] = useState(initialEvents);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    name: '', type: '', date: '', plannedIncome: '', plannedExpense: '', actualIncome: '', actualExpense: ''
  });

  const filtered = events.filter(e => (filterType ? e.type === filterType : true));

  const handleAdd = () => {
    if (!form.name || !form.type || !form.date || !form.plannedIncome || !form.plannedExpense || !form.actualIncome || !form.actualExpense) {
      alert('Please fill all fields');
      return;
    }
    const newEvent = {
      ...form,
      plannedIncome: parseFloat(form.plannedIncome),
      plannedExpense: parseFloat(form.plannedExpense),
      actualIncome: parseFloat(form.actualIncome),
      actualExpense: parseFloat(form.actualExpense)
    };
    setEvents(prev => [...prev, newEvent]);
    setForm({ name: '', type: '', date: '', plannedIncome: '', plannedExpense: '', actualIncome: '', actualExpense: '' });
  };

  const exportCSV = () => {
    const headers = ['Event', 'Type', 'Date', 'Planned Income', 'Planned Expense', 'Actual Income', 'Actual Expense', 'Profit/Loss'];
    const rows = filtered.map(e => [
      e.name,
      e.type,
      e.date,
      e.plannedIncome,
      e.plannedExpense,
      e.actualIncome,
      e.actualExpense,
      e.actualIncome - e.actualExpense
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'event_costing.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-700">Event & Facility Costing</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Event Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Planned Income</Label>
            <Input type="number" value={form.plannedIncome} onChange={e => setForm({ ...form, plannedIncome: e.target.value })} />
          </div>
          <div>
            <Label>Planned Expense</Label>
            <Input type="number" value={form.plannedExpense} onChange={e => setForm({ ...form, plannedExpense: e.target.value })} />
          </div>
          <div>
            <Label>Actual Income</Label>
            <Input type="number" value={form.actualIncome} onChange={e => setForm({ ...form, actualIncome: e.target.value })} />
          </div>
          <div>
            <Label>Actual Expense</Label>
            <Input type="number" value={form.actualExpense} onChange={e => setForm({ ...form, actualExpense: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Button className="mt-2" onClick={handleAdd}>Add Event</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-end">
        <div>
          <Label>Filter by Event Type</Label>
          <Input placeholder="e.g. Tournament" value={filterType} onChange={e => setFilterType(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setFilterType('')}>Clear Filter</Button>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <Card>
        <CardContent className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-4 py-2">Event</th>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Planned Income</th>
                <th className="border px-4 py-2">Planned Expense</th>
                <th className="border px-4 py-2">Actual Income</th>
                <th className="border px-4 py-2">Actual Expense</th>
                <th className="border px-4 py-2">Profit / Loss</th>
                <th className="border px-4 py-2">Break-even</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event, idx) => {
                const net = event.actualIncome - event.actualExpense;
                const breakeven = event.actualIncome >= event.actualExpense;
                return (
                  <tr key={idx} className="even:bg-gray-50">
                    <td className="border px-4 py-2">{event.name}</td>
                    <td className="border px-4 py-2">{event.type}</td>
                    <td className="border px-4 py-2">{event.date}</td>
                    <td className="border px-4 py-2">£{event.plannedIncome}</td>
                    <td className="border px-4 py-2">£{event.plannedExpense}</td>
                    <td className="border px-4 py-2">£{event.actualIncome}</td>
                    <td className="border px-4 py-2">£{event.actualExpense}</td>
                    <td className={`border px-4 py-2 font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>£{net}</td>
                    <td className="border px-4 py-2 text-center">{breakeven ? '✅' : '❌'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
