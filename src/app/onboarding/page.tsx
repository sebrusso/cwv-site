"use client";

import { UserDemographicsForm } from "@/components/UserDemographicsForm";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const { user, profile, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log('Onboarding page - user:', user?.id, 'profile:', profile, 'isLoading:', isLoading);
    
    if (!isLoading) {
      if (!user) {
        console.log('No user found, redirecting to home');
        router.push("/");
      } else if (profile?.demographics_completed) {
        console.log('Demographics already completed, redirecting to home');
        router.push("/");
      }
    }
  }, [isLoading, user, profile, router]);

  // Show loading while we're still determining the user state
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if no user or demographics already completed
  if (!user || profile?.demographics_completed) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <div className="text-center text-gray-600">
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-medium">Tell us about yourself</h1>
      <p className="text-gray-600 text-sm">
        This information helps us understand our user base and improve the platform. You can skip this step if you prefer.
      </p>
      <UserDemographicsForm />
    </div>
  );
}
