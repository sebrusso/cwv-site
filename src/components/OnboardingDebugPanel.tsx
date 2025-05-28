"use client";

import { useUser } from "@/contexts/UserContext";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OnboardingDebugPanel() {
  const { user, profile, isLoading } = useUser();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
        >
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Onboarding Debug</h3>
        <Button 
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Current Path:</strong> {pathname}
        </div>
        
        <div>
          <strong>Loading:</strong> {isLoading.toString()}
        </div>
        
        <div>
          <strong>User:</strong> {user ? `${user.id.slice(0, 8)}...` : 'null'}
        </div>
        
        <div>
          <strong>Profile:</strong> {profile ? 'exists' : 'null'}
        </div>
        
        {profile && (
          <div>
            <strong>Demographics Completed:</strong> {profile.demographics_completed?.toString() || 'undefined'}
          </div>
        )}
        
        <div>
          <strong>Should Redirect:</strong> {
            (() => {
              if (isLoading || !user || !profile) return false;
              return !profile.demographics_completed && pathname === "/";
            })().toString()
          }
        </div>
        
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <strong>Profile Data:</strong>
          <pre className="whitespace-pre-wrap overflow-auto max-h-32">
            {profile ? JSON.stringify(profile, null, 2) : 'No profile'}
          </pre>
        </div>
      </div>
    </div>
  );
} 