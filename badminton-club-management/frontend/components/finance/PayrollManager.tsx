import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const initialPayroll = [
  { name: 'Jane Doe', role: 'Coach', salary: 1800, overtime: 5, commission: 200, bonus: 100, tax: 10, month: '2025-07', isEditing: false },
  { name: 'John Smith', role: 'Trainer', salary: 2000, overtime: 10, commission: 150, bonus: 50, tax: 12, month: '2025-07', isEditing: false },
  { name: 'Alice Green', role: 'Club Manager', salary: 2500, overtime: 0, commission: 0, bonus: 300, tax: 15, month: '2025-06', isEditing: false }
];

export default function PayrollManager() {
  const [month, setMonth] = useState('2025-07');
  const [payrollData, setPayrollData] = useState(initialPayroll);

  const toggleEdit = idx => {
    setPayrollData(prev => prev.map((p, i) => i === idx ? { ...p, isEditing: !p.isEditing } : p));
  };

  const handleChange = (idx, field, value) => {
    setPayrollData(prev => {
      const copy = [...prev];
      const updated = { ...copy[idx], [field]: field === 'salary' || field === 'overtime' || field === 'commission' || field === 'bonus' || field === 'tax' ? Number(value) : value };
      copy[idx] = updated;
      return copy;
    });
  };

  const calculateNetPay = ({ salary, overtime, commission, bonus, tax }) => {
    const gross = salary + (overtime * 20) + commission + bonus;
    return gross - (gross * (tax / 100));
  };

  const filtered = payrollData.filter(p => p.month === month);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-800">Payroll & Staff Management</h2>

      <div className="flex gap-4 items-center">
        <Label>Select Month</Label>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-48" />
      </div>

      <Card>
        <CardContent className="mt-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-purple-100">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Salary</th>
                <th className="border px-4 py-2">Overtime (hrs)</th>
                <th className="border px-4 py-2">Commission</th>
                <th className="border px-4 py-2">Bonus</th>
                <th className="border px-4 py-2">Tax %</th>
                <th className="border px-4 py-2">Net Pay</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input value={emp.name} onChange={e => handleChange(idx, 'name', e.target.value)} className={!emp.name ? 'border-red-500' : ''} />
                    ) : (
                      emp.name
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input value={emp.role} onChange={e => handleChange(idx, 'role', e.target.value)} className={!emp.role ? 'border-red-500' : ''} />
                    ) : (
                      emp.role
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input type="number" value={emp.salary} onChange={e => handleChange(idx, 'salary', e.target.value)} className={emp.salary <= 0 ? 'border-red-500' : ''} />
                    ) : (
                      `£${emp.salary}`
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input type="number" value={emp.overtime} onChange={e => handleChange(idx, 'overtime', e.target.value)} />
                    ) : (
                      emp.overtime
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input type="number" value={emp.commission} onChange={e => handleChange(idx, 'commission', e.target.value)} />
                    ) : (
                      `£${emp.commission}`
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input type="number" value={emp.bonus} onChange={e => handleChange(idx, 'bonus', e.target.value)} />
                    ) : (
                      `£${emp.bonus}`
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {emp.isEditing ? (
                      <Input type="number" value={emp.tax} onChange={e => handleChange(idx, 'tax', e.target.value)} className={emp.tax < 0 ? 'border-red-500' : ''} />
                    ) : (
                      `${emp.tax}%`
                    )}
                  </td>
                  <td className="border px-4 py-2 font-semibold">£{calculateNetPay(emp).toFixed(2)}</td>
                  <td className="border px-4 py-2 text-center">
                    <Button size="sm" onClick={() => toggleEdit(idx)}>{emp.isEditing ? 'Save' : 'Edit'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline">Export CSV</Button>
        <Button variant="outline">Download Payslips</Button>
        <Button>Mark All as Paid</Button>
      </div>
    </div>
  );
}
