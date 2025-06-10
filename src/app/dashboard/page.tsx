'use client';
import UserPerformanceCharts from '@/components/UserPerformanceCharts';
import { notFound } from 'next/navigation';
import { config } from '@/lib/config-client';
import { useUser } from '@/contexts/UserContext';
import { SignupCTA } from '@/components/SignupCTA';

export default function DashboardPage() {
  if (!config.enableDashboard) {
    notFound();
  }

  const { user, isLoading } = useUser();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto flex flex-col gap-6 text-center">
        <h1 className="text-2xl font-semibold">Your Dashboard</h1>
        <p>You need an account to view your dashboard information.</p>
        <SignupCTA />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your Dashboard</h1>
      <UserPerformanceCharts />
    </div>
  );
}
