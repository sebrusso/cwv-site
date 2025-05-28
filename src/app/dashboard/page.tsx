'use client';
import UserPerformanceCharts from '@/components/UserPerformanceCharts';
import { notFound } from 'next/navigation';
import { config } from '@/config';

export default function DashboardPage() {
  if (!config.enableDashboard) {
    notFound();
  }
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your Dashboard</h1>
      <UserPerformanceCharts />
    </div>
  );
}
