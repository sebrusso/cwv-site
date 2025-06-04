"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { clearAuthState } from "@/lib/auth-utils";
import { config } from "@/lib/config-client";

export function AuthDebugPanel() {
  const { user, session, profile, isLoading } = useUser();
  const [cleared, setCleared] = useState(false);

  const handleClearAuth = () => {
    clearAuthState();
    setCleared(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Only show in debug mode
  if (!config.debugMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg max-w-sm">
      <h3 className="font-semibold text-sm mb-2">Auth Debug Panel</h3>
      <div className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
        </div>
        <div>
          <strong>User:</strong> {user ? user.email : "None"}
        </div>
        <div>
          <strong>Session:</strong> {session ? "Active" : "None"}
        </div>
        <div>
          <strong>Profile:</strong> {profile ? `Score: ${profile.score}` : "None"}
        </div>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={handleClearAuth}
          disabled={cleared}
        >
          {cleared ? "Reloading..." : "Clear Auth State"}
        </Button>
      </div>
    </div>
  );
} 