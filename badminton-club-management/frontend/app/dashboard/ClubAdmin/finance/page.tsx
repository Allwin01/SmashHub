'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import MembershipBilling from '@/components/PlayerSubscription';
import ExpenseTracking from '@/components/finance/ExpenseTracker';
import RevenueTracking from '@/components/finance/RevenueTracker';
import FinancialReporting from '@/components/finance/FinancialReports';
import PayrollManagement from '@/components/finance/PayrollManager';
import InventoryControl from '@/components/finance/InventoryManager';
import EventCosting from '@/components/finance/EventCosting';
import AuditCompliance from '@/components/finance/AuditCompliance';
import UserPermissions from '@/components/finance/UserPermissions';

export default function DashboardTabs() {
  return (
    <div className="w-full px-4 py-6">
      <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">SmashHub Club Admin Dashboard</h1>
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="flex flex-wrap justify-center gap-2 mb-4 overflow-x-auto border rounded-md bg-white p-2 shadow">
          <TabsTrigger value="membership">
            🧾 Player Subscription<span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">3 unpaid</span>
          </TabsTrigger>
          <TabsTrigger value="expenses">
            💸 Expenses
          </TabsTrigger>
          <TabsTrigger value="revenue">
            💰 Revenue
          </TabsTrigger>
          <TabsTrigger value="reporting">
            📊 Reporting
          </TabsTrigger>
          <TabsTrigger value="payroll">
            👥 Payroll
          </TabsTrigger>
          <TabsTrigger value="inventory">
            📦 Inventory
          </TabsTrigger>
          <TabsTrigger value="events">
            🎟️ Event Costing
          </TabsTrigger>
          <TabsTrigger value="audit">
            🕵️ Audit
          </TabsTrigger>
          <TabsTrigger value="users">
            🔐 Users <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">1 pending</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="membership">
          <Card><CardContent className="mt-4"><MembershipBilling /></CardContent></Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card><CardContent className="mt-4"><ExpenseTracking /></CardContent></Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card><CardContent className="mt-4"><RevenueTracking /></CardContent></Card>
        </TabsContent>

        <TabsContent value="reporting">
          <Card><CardContent className="mt-4"><FinancialReporting /></CardContent></Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card><CardContent className="mt-4"><PayrollManagement /></CardContent></Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card><CardContent className="mt-4"><InventoryControl /></CardContent></Card>
        </TabsContent>

        <TabsContent value="events">
          <Card><CardContent className="mt-4"><EventCosting /></CardContent></Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card><CardContent className="mt-4"><AuditCompliance /></CardContent></Card>
        </TabsContent>

        <TabsContent value="users">
          <Card><CardContent className="mt-4"><UserPermissions /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
