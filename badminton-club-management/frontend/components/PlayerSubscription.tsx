{/*}
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const samplePlayers = [
  {
    firstName: 'Alice',
    surName: 'Johnson',
    email: 'alice@example.com',
    joiningDate: '2023-05-15',
    lastPaidMonth: 'May 2025',
    isMonthly: true,
    isBulkPayment: false,
    monthlyCost: 20,
    totalPaid: 100,
    expectedCost: 240,
    totalDue: 140,
    membershipStatus: 'Active',
    paymentStatus: 'Partial'
  },
  {
    firstName: 'Bob',
    surName: 'Smith',
    email: 'bob@example.com',
    joiningDate: '2022-11-10',
    lastPaidMonth: 'Mar 2025',
    isMonthly: false,
    isBulkPayment: true,
    monthlyCost: 0,
    totalPaid: 200,
    expectedCost: 200,
    totalDue: 0,
    membershipStatus: 'Active',
    paymentStatus: 'Paid'
  }
];

export default function MembershipBilling() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [gateway, setGateway] = useState('Stripe');
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const handleGenerate = () => {
    const match = samplePlayers.find(
      player => player.email.toLowerCase() === query.toLowerCase()
    );
    setSelectedMember(match || null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Membership Billing & Payments</h2>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Billing Cycle</Label>
            <select
              value={billingCycle}
              onChange={e => setBillingCycle(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          <div>
            <Label>Payment Gateway</Label>
            <select
              value={gateway}
              onChange={e => setGateway(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="Stripe">Stripe</option>
              <option value="PayPal">PayPal</option>
              <option value="Square">Square</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Label>Generate Invoice</Label>
            <Input
              placeholder="Enter Member Email"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <Button className="mt-2" onClick={handleGenerate}>Generate</Button>
          </div>

          {selectedMember && (
            <div className="md:col-span-2 border-t pt-4">
              <h3 className="text-lg font-semibold text-green-700 mb-2">Invoice Summary</h3>
              <p><strong>Name:</strong> {selectedMember.firstName} {selectedMember.surName}</p>
              <p><strong>Membership:</strong> {selectedMember.membershipStatus}</p>
              <p><strong>Billing Cycle:</strong> {billingCycle}</p>
              <p><strong>Payment Method:</strong> {gateway}</p>
              <p><strong>Total Due:</strong> £{selectedMember.totalDue}</p>
              <p><strong>Status:</strong> {selectedMember.paymentStatus}</p>
              <Button variant="outline" className="mt-2">Download Invoice</Button>
            </div>
          )}

          <div className="md:col-span-2">
            <Label>Reminders & Penalties</Label>
            <p className="text-sm text-gray-600 mt-1">
              Automated reminders will be sent for overdue payments. Penalties can be configured in settings.
            </p>
            <Button variant="outline" className="mt-2">Configure Rules</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client'   */}

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const samplePlayers = [
  {
    firstName: 'Alice',
    surName: 'Johnson',
    joiningDate: '2023-05-15',
    lastPaidMonth: 'May 2025',
    isMonthly: true,
    isBulkPayment: false,
    monthlyCost: 20,
    totalPaid: 100,
    expectedCost: 240,
    totalDue: 140,
    membershipStatus: 'Active',
    paymentStatus: 'Partial'
  },
  {
    firstName: 'Bob',
    surName: 'Smith',
    joiningDate: '2022-11-10',
    lastPaidMonth: 'Mar 2025',
    isMonthly: false,
    isBulkPayment: true,
    monthlyCost: 0,
    totalPaid: 200,
    expectedCost: 200,
    totalDue: 0,
    membershipStatus: 'Active',
    paymentStatus: 'Paid'
  }
];

export default function PlayerSubscription() {
  const [selectedTab, setSelectedTab] = useState('subscriptions');
  const defaultFilters = {
    firstName: '',
    surName: '',
    joiningDate: '',
    lastPaidMonth: '',
    isMonthly: [],
    isBulkPayment: [],
    membershipStatus: [],
    paymentStatus: []
  };
  const savedFilters = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('subscriptionFilters') || 'null') : null;
  const [filters, setFilters] = useState(savedFilters || defaultFilters);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredPlayers = samplePlayers
    .filter(player => {
      return (
        (!filters.firstName || player.firstName.toLowerCase().includes(filters.firstName.toLowerCase())) &&
        (!filters.surName || player.surName.toLowerCase().includes(filters.surName.toLowerCase())) &&
        (!filters.joiningDate || player.joiningDate.includes(filters.joiningDate)) &&
        (!filters.lastPaidMonth || player.lastPaidMonth.includes(filters.lastPaidMonth)) &&
        (filters.isMonthly.length === 0 || filters.isMonthly.includes(player.isMonthly ? 'Yes' : 'No')) &&
        (filters.isBulkPayment.length === 0 || filters.isBulkPayment.includes(player.isBulkPayment ? 'Yes' : 'No')) &&
        (filters.membershipStatus.length === 0 || filters.membershipStatus.includes(player.membershipStatus)) &&
        (filters.paymentStatus.length === 0 || filters.paymentStatus.includes(player.paymentStatus))
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
    });

  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
     
      {selectedTab === 'subscriptions' && (
        <Card>
          <CardContent className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <Label>Monthly Sub</Label>
                <select multiple className="border rounded px-3 py-1 h-24" onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFilters(prev => {
                    const newFilters = { ...prev, isMonthly: selected };
                    localStorage.setItem('subscriptionFilters', JSON.stringify(newFilters));
                    return newFilters;
                  });
                }}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <Label>Bulk Payment</Label>
                <select multiple className="border rounded px-3 py-1 h-24" onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFilters(prev => {
                    const newFilters = { ...prev, isBulkPayment: selected };
                    localStorage.setItem('subscriptionFilters', JSON.stringify(newFilters));
                    return newFilters;
                  });
                }}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <Label>Membership Status</Label>
                <select multiple className="border rounded px-3 py-1 h-24" onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFilters(prev => {
                    const newFilters = { ...prev, membershipStatus: selected };
                    localStorage.setItem('subscriptionFilters', JSON.stringify(newFilters));
                    return newFilters;
                  });
                }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <select multiple className="border rounded px-3 py-1 h-24" onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFilters(prev => {
                    const newFilters = { ...prev, paymentStatus: selected };
                    localStorage.setItem('subscriptionFilters', JSON.stringify(newFilters));
                    return newFilters;
                  });
                }}>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm font-medium text-gray-700">Showing {filteredPlayers.length} results</span>
              <Button variant="outline" onClick={() => {
                setFilters(defaultFilters);
                localStorage.removeItem('subscriptionFilters');
              }}>Clear All Filters</Button>
            </div>

            <table className="min-w-full text-sm border">
              <thead className="bg-blue-100">
                <tr>
                  <th className="cursor-pointer" onClick={() => handleSort('firstName')}>First Name {sortField === 'firstName' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th className="cursor-pointer" onClick={() => handleSort('surName')}>Surname {sortField === 'surName' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th className="cursor-pointer" onClick={() => handleSort('joiningDate')}>Joining Date {sortField === 'joiningDate' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th className="cursor-pointer" onClick={() => handleSort('lastPaidMonth')}>Last Paid Month {sortField === 'lastPaidMonth' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                  <th>Monthly Sub</th>
                  <th>Bulk Payment</th>
                  <th className="cursor-pointer" onClick={() => handleSort('monthlyCost')}>Cost</th>
                  <th className="cursor-pointer" onClick={() => handleSort('totalPaid')}>Total Paid</th>
                  <th className="cursor-pointer" onClick={() => handleSort('expectedCost')}>Expected Cost</th>
                  <th className="cursor-pointer" onClick={() => handleSort('totalDue')}>Total Due</th>
                  <th>Membership Status</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((player, index) => (
                  <tr key={index} className="even:bg-gray-50">
                    <td className="border px-4 py-2">{player.firstName}</td>
                    <td className="border px-4 py-2">{player.surName}</td>
                    <td className="border px-4 py-2">{player.joiningDate}</td>
                    <td className="border px-4 py-2">{player.lastPaidMonth}</td>
                    <td className="border px-4 py-2">{player.isMonthly ? 'Yes' : 'No'}</td>
                    <td className="border px-4 py-2">{player.isBulkPayment ? 'Yes' : 'No'}</td>
                    <td className="border px-4 py-2">£{player.monthlyCost}</td>
                    <td className="border px-4 py-2">£{player.totalPaid}</td>
                    <td className="border px-4 py-2">£{player.expectedCost}</td>
                    <td className="border px-4 py-2">£{player.totalDue}</td>
                    <td className="border px-4 py-2">{player.membershipStatus}</td>
                    <td className="border px-4 py-2">{player.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <Label>Rows per page:</Label>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                <span className="self-center">Page {currentPage} of {totalPages}</span>
                <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
