import React, { Suspense } from 'react';
import { UserDashboardLayout } from '@/components/dashboard/UserDashboardLayout';

export default function GarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <UserDashboardLayout>{children}</UserDashboardLayout>
    </Suspense>
  );
}
