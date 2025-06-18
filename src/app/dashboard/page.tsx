'use client';
import UserPerformanceCharts from '@/components/UserPerformanceCharts';
import { notFound } from 'next/navigation';
import { config } from '@/lib/config-client';
import { useUser } from '@/contexts/UserContext';
import { SignupCTA } from '@/components/SignupCTA';
import { SignupEncouragement } from '@/components/SignupEncouragement';
import { AuthenticatedUserFeatures } from '@/components/AuthenticatedUserFeatures';

export default function DashboardPage() {
  if (!config.enableDashboard) {
    notFound();
  }

  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress, view detailed analytics, and unlock achievements.
          </p>
        </div>
        
        {/* Show modal-style signup encouragement for anonymous users */}
        <SignupEncouragement trigger="modal" />
        
        {/* Fallback CTA if they dismiss the modal */}
        <div className="max-w-md mx-auto">
          <SignupCTA />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your personalized creative writing evaluation dashboard.
        </p>
      </div>
      
      {/* Show enhanced features for authenticated users */}
      <AuthenticatedUserFeatures />
      
      {/* Show existing performance charts */}
      <UserPerformanceCharts />
    </div>
  );
}
