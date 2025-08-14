import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const initialInventory = [
  { name: 'Shuttlecocks', category: 'Equipment', quantity: 120, unitCost: 1.5, vendor: 'Yonex UK', purchaseDate: '2025-06-01', reorder: false, reorderDate: '', isEditing: false },
  { name: 'Club T-Shirts', category: 'Merchandise', quantity: 40, unitCost: 7, vendor: 'Local Print Co', purchaseDate: '2025-05-20', reorder: true, reorderDate: '2025-08-01', isEditing: false },
  { name: 'Court Booking Tokens', category: 'Facilities', quantity: 10, unitCost: 15, vendor: 'City Sports Hall', purchaseDate: '2025-06-10', reorder: false, reorderDate: '', isEditing: false }
];

export default function InventoryManager() {
  const [inventory, setInventory] = useState(initialInventory);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unitCost: '', vendor: '', purchaseDate: '', reorderDate: '', reorder: false });
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const toggleEdit = (idx) => {
    setInventory(prev => prev.map((item, i) => i === idx ? { ...item, isEditing: !item.isEditing } : item));
  };

  const handleChange = (idx, field, value) => {
    setInventory(prev => {
      const updated = [...prev];
      const parsedValue = field === 'quantity' || field === 'unitCost' ? parseFloat(value) : value;
      updated[idx] = { ...updated[idx], [field]: parsedValue };
      return updated;
    });
  };

  const filteredInventory = inventory.filter(item => {
    const monthMatch = monthFilter ? item.purchaseDate.startsWith(monthFilter) : true;
    const categoryMatch = categoryFilter ? item.category === categoryFilter : true;
    return monthMatch && categoryMatch;
  });

  const monthlyTotal = filteredInventory.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);

  const exportCSV = () => {
    const headers = ['Item', 'Category', 'Quantity', 'Unit Cost', 'Vendor', 'Purchase Date', 'Reorder Date', 'Total Cost', 'Reorder'];
    const rows = filteredInventory.map(i => [i.name, i.category, i.quantity, i.unitCost, i.vendor, i.purchaseDate, i.reorderDate, (i.unitCost * i.quantity).toFixed(2), i.reorder ? 'Yes' : 'No']);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_export.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-800">Inventory & Cost Control</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Item Name</Label>
            <Input placeholder="e.g. Shuttlecocks" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Input placeholder="e.g. Equipment" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" placeholder="e.g. 50" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <Label>Unit Cost (£)</Label>
            <Input type="number" placeholder="e.g. 1.50" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} />
          </div>
          <div>
            <Label>Vendor</Label>
            <Input placeholder="e.g. Yonex UK" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div>
            <Label>Purchase Date</Label>
            <Input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
          </div>
          <div>
            <Label>Reorder Date</Label>
            <Input type="date" value={form.reorderDate} onChange={e => setForm({ ...form, reorderDate: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.reorder} onChange={e => setForm({ ...form, reorder: e.target.checked })} /> Reorder Alert
            </label>
            <Button className="mt-2" onClick={() => {
              if (!form.name || !form.category || !form.quantity || !form.unitCost || !form.vendor || !form.purchaseDate) {
                alert('Please fill all required fields');
                return;
              }
              const newItem = {
                ...form,
                quantity: parseFloat(form.quantity),
                unitCost: parseFloat(form.unitCost),
                isEditing: false
              };
              setInventory(prev => [...prev, newItem]);
              setForm({ name: '', category: '', quantity: '', unitCost: '', vendor: '', purchaseDate: '', reorderDate: '', reorder: false });
            }}>Add Item</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <div>
          <Label>Filter by Purchase Month</Label>
          <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
        </div>
        <div>
          <Label>Filter by Category</Label>
          <Input placeholder="e.g. Equipment" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardContent className="mt-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-blue-100">
              <tr>
                <th className="border px-4 py-2">Item</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Quantity</th>
                <th className="border px-4 py-2">Unit Cost</th>
                <th className="border px-4 py-2">Vendor</th>
                <th className="border px-4 py-2">Purchase Date</th>
                <th className="border px-4 py-2">Reorder Date</th>
                <th className="border px-4 py-2">Total Cost</th>
                <th className="border px-4 py-2">Reorder</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, idx) => (
                <tr key={idx} className={`even:bg-gray-50 ${item.quantity < 10 ? 'bg-red-100' : ''}`}>
                  <td className="border px-4 py-2">{item.isEditing ? <Input value={item.name} onChange={e => handleChange(idx, 'name', e.target.value)} /> : item.name}</td>
                  <td className="border px-4 py-2">{item.isEditing ? <Input value={item.category} onChange={e => handleChange(idx, 'category', e.target.value)} /> : item.category}</td>
                  <td className="border px-4 py-2">{item.isEditing ? <Input type="number" value={item.quantity} onChange={e => handleChange(idx, 'quantity', e.target.value)} /> : item.quantity}</td>
                  <td className="border px-4 py-2">{item.isEditing ? <Input type="number" value={item.unitCost} onChange={e => handleChange(idx, 'unitCost', e.target.value)} /> : `£${item.unitCost.toFixed(2)}`}</td>
                  <td className="border px-4 py-2">{item.isEditing ? <Input value={item.vendor} onChange={e => handleChange(idx, 'vendor', e.target.value)} /> : item.vendor}</td>
                  <td className="border px-4 py-2">{item.isEditing ? <Input type="date" value={item.purchaseDate} onChange={e => handleChange(idx, 'purchaseDate', e.target.value)} /> : item.purchaseDate}</td>
                  <td className="border px-4 py-2">{item.isEditing ? <Input type="date" value={item.reorderDate} onChange={e => handleChange(idx, 'reorderDate', e.target.value)} /> : item.reorderDate || '—'}</td>
                  <td className="border px-4 py-2">£{(item.quantity * item.unitCost).toFixed(2)}</td>
                  <td className="border px-4 py-2 text-center">{item.reorder ? '🔔' : '—'}</td>
                  <td className="border px-4 py-2 text-center">
                    <Button size="sm" onClick={() => toggleEdit(idx)}>{item.isEditing ? 'Save' : 'Edit'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-4 font-semibold text-blue-900">
            Filtered Inventory Total Cost: £{monthlyTotal.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
