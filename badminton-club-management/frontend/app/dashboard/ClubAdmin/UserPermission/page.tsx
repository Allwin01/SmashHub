'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import MembershipBilling from '@/components/PlayerSubscription';
import ExpenseTracking from '@/components/ExpenseTracker';
import RevenueTracking from '@/components/RevenueTracker';
import FinancialReporting from '@/components/FinancialReports';
import PayrollManagement from '@/components/PayrollManager';
import InventoryControl from '@/components/InventoryManager';
import EventCosting from '@/components/EventCosting';
import AuditCompliance from '@/components/AuditCompliance';
import UserPermissions from '@/components/UserPermissions';

export default function DashboardTabs() {
  return (
    <div className="w-full px-4 py-6">
      <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">SmashHub Club Admin Dashboard</h1>
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="flex flex-wrap justify-center gap-2 mb-4 overflow-x-auto border rounded-md bg-white p-2 shadow">
          <TabsTrigger value="membership">
            🧾 Player Subscription<span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">3 unpaid</span>
          </TabsTrigger>
         
          <TabsTrigger value="users">
            🔐 Users <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">1 pending</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="membership">
          <Card><CardContent className="mt-4"><MembershipBilling /></CardContent></Card>
        </TabsContent>

    

        <TabsContent value="users">
          <Card><CardContent className="mt-4"><UserPermissions /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
