import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const initialExpenses = [
  {
    date: '2025-07-01',
    category: 'Court Booking',
    description: 'July booking at community hall',
    amount: 150,
    uploadedReceipt: true,
    isEditing: false
  },
  {
    date: '2025-07-02',
    category: 'Shuttlecocks',
    description: 'Bulk purchase of Yonex Mavis 350',
    amount: 75,
    uploadedReceipt: false,
    isEditing: false
  },
  {
    date: '2025-06-28',
    category: 'Events',
    description: 'Local tournament refreshment',
    amount: 60,
    uploadedReceipt: true,
    isEditing: false
  }
];

export default function ExpenseTracker() {
  const [form, setForm] = useState({ date: '', category: '', description: '', amount: '' });
  const [filterMonth, setFilterMonth] = useState('2025-07');
  const [expenses, setExpenses] = useState(initialExpenses);

  const filteredExpenses = expenses.filter(exp => exp.date.startsWith(filterMonth));
  const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleDelete = index => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updated = [...expenses];
      updated.splice(index, 1);
      setExpenses(updated);
    }
  };

  const toggleEdit = index => {
    setExpenses(expenses.map((exp, idx) => idx === index ? { ...exp, isEditing: !exp.isEditing } : exp));
  };

  const handleEditChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = field === 'amount' ? parseFloat(value) : value;
    setExpenses(updated);
  };

  const exportCSV = () => {
    const header = ['Date', 'Category', 'Description', 'Amount', 'Receipt'];
    const rows = filteredExpenses.map(exp => [exp.date, exp.category, exp.description, `£${exp.amount}`, exp.uploadedReceipt ? 'Yes' : 'No']);
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_${filterMonth}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Expense Tracking & Management</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Date of Expense</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Court Booking">Court Booking</option>
              <option value="Shuttlecocks">Shuttlecocks</option>
              <option value="T-Shirts">T-Shirts</option>
              <option value="Events">Events</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Amount (£)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>Upload Receipt</Label>
            <Input type="file" disabled />
          </div>
          <div className="md:col-span-2">
            <Button className="mt-2" onClick={() => {
              if (!form.date || !form.category || !form.description || !form.amount) {
                alert('Please fill in all fields before adding an expense.');
                return;
              }
              const newExpense = {
                ...form,
                amount: parseFloat(form.amount),
                uploadedReceipt: false,
                isEditing: false
              };
              setExpenses(prev => [...prev, newExpense]);
              setForm({ date: '', category: '', description: '', amount: '' });
              toast.success('Expense added successfully!');
            }}>Add Expense</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expense Summary</h3>
            <div className="flex items-center gap-3">
              <div>
                <Label className="mr-2">Filter by Month</Label>
                <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
              </div>
              <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
            </div>
          </div>

          <table className="min-w-full text-sm border">
            <thead className="bg-blue-100">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Receipt Available</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="border px-4 py-2">
                    {exp.isEditing ? (
                      <Input type="date" value={exp.date} onChange={e => handleEditChange(idx, 'date', e.target.value)} />
                    ) : (
                      exp.date
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {exp.isEditing ? (
                      <Input value={exp.category} onChange={e => handleEditChange(idx, 'category', e.target.value)} />
                    ) : (
                      exp.category
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {exp.isEditing ? (
                      <Textarea rows={1} value={exp.description} onChange={e => handleEditChange(idx, 'description', e.target.value)} />
                    ) : (
                      exp.description
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {exp.isEditing ? (
                      <Input type="number" value={exp.amount} onChange={e => handleEditChange(idx, 'amount', e.target.value)} />
                    ) : (
                      `£${exp.amount}`
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {exp.isEditing ? (
                      <input
                        type="checkbox"
                        checked={exp.uploadedReceipt}
                        onChange={e => handleEditChange(idx, 'uploadedReceipt', e.target.checked)}
                      />
                    ) : (
                      exp.uploadedReceipt ? '✅' : '—'
                    )}
                  </td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <Button size="sm" onClick={() => toggleEdit(idx)}>
                      {exp.isEditing ? 'Save' : 'Edit'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(idx)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right font-semibold text-blue-900">
            Total Expenses for {filterMonth}: £{total}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
