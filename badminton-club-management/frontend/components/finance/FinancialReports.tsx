import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const financialPeriods = [
  { label: 'Jan–Dec 2025', value: '2025' },
  { label: 'Apr 2024–Mar 2025', value: '2024-25' },
  { label: 'Apr 2023–Mar 2024', value: '2023-24' }
];

const actualDataByPeriod = {
  '2025': [
    { month: 'Jan', revenue: 1000, expenses: 700, refunds: 50 },
    { month: 'Feb', revenue: 1200, expenses: 650, refunds: 20 },
    { month: 'Mar', revenue: 900, expenses: 800, refunds: 30 },
    { month: 'Apr', revenue: 1100, expenses: 750, refunds: 25 },
    { month: 'May', revenue: 1300, expenses: 900, refunds: 45 },
    { month: 'Jun', revenue: 1500, expenses: 950, refunds: 40 },
    { month: 'Jul', revenue: 1800, expenses: 1100, refunds: 60 },
    { month: 'Aug', revenue: 1500, expenses: 1000, refunds: 30 },
    { month: 'Sep', revenue: 1000, expenses: 800, refunds: 0 },
    { month: 'Oct', revenue: 800, expenses: 600, refunds: 0 },
    { month: 'Nov', revenue: 600, expenses: 500, refunds: 0 },
    { month: 'Dec', revenue: 300, expenses: 250, refunds: 0 }
  ],
  '2024-25': [
    { month: 'Apr', revenue: 850, expenses: 600, refunds: 20 },
    { month: 'May', revenue: 950, expenses: 700, refunds: 10 },
    { month: 'Jun', revenue: 1100, expenses: 850, refunds: 20 },
    { month: 'Jul', revenue: 1250, expenses: 950, refunds: 25 },
    { month: 'Aug', revenue: 1350, expenses: 1000, refunds: 15 },
    { month: 'Sep', revenue: 1200, expenses: 900, refunds: 5 }
  ],
  '2023-24': [
    { month: 'Apr', revenue: 700, expenses: 500, refunds: 10 },
    { month: 'May', revenue: 750, expenses: 550, refunds: 5 },
    { month: 'Jun', revenue: 800, expenses: 600, refunds: 10 },
    { month: 'Jul', revenue: 900, expenses: 700, refunds: 15 }
  ]
};

export default function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025');

  const data = actualDataByPeriod[selectedPeriod];
  const totals = data.reduce(
    (acc, cur) => {
      acc.revenue += cur.revenue;
      acc.expenses += cur.expenses;
      acc.refunds += cur.refunds;
      return acc;
    },
    { revenue: 0, expenses: 0, refunds: 0 }
  );

  const profit = totals.revenue - totals.expenses;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-indigo-800">Financial Reports & Analytics</h2>

      <div className="flex gap-4 items-center">
        <Label>Select Financial Year</Label>
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {financialPeriods.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="font-medium">Total Revenue</p><p className="text-xl text-green-700 font-bold">£{totals.revenue}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="font-medium">Total Expenses</p><p className="text-xl text-red-600 font-bold">£{totals.expenses}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="font-medium">Total Refunds</p><p className="text-xl text-yellow-600 font-bold">£{totals.refunds}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="font-medium">Net Profit</p><p className={`text-xl font-bold ${profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>£{profit}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Monthly Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Balance Sheet Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Assets</h4>
              <ul className="space-y-1">
                <li className="flex justify-between border-b pb-1"><span>Cash & Bank</span><span>£{totals.revenue}</span></li>
                <li className="flex justify-between border-b pb-1"><span>Receivables</span><span>£0</span></li>
                <li className="flex justify-between"><strong>Total Assets</strong><strong>£{totals.revenue}</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Liabilities & Equity</h4>
              <ul className="space-y-1">
                <li className="flex justify-between border-b pb-1"><span>Outstanding Expenses</span><span>£{totals.expenses}</span></li>
                <li className="flex justify-between border-b pb-1"><span>Refund Liability</span><span>£{totals.refunds}</span></li>
                <li className="flex justify-between border-b pb-1"><span>Net Profit</span><span>£{profit}</span></li>
                <li className="flex justify-between"><strong>Total Liabilities + Equity</strong><strong>£{totals.expenses + totals.refunds + profit}</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline">Export CSV</Button>
        <Button variant="outline">Download PDF</Button>
        <Button>Send to Accountant</Button>
      </div>
    </div>
  );
}
