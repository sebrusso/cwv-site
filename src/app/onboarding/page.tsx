"use client";

import { UserDemographicsForm } from "@/components/UserDemographicsForm";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const { user, profile, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/");
      } else if (profile?.demographics_completed) {
        router.push("/");
      }
    }
  }, [isLoading, user, profile, router]);

  if (isLoading || !user || profile?.demographics_completed) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-medium">Tell us about yourself</h1>
      <UserDemographicsForm />
    </div>
  );
}
