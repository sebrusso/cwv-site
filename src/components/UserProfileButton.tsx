"use client";

import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { LogOut, User as UserIcon } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { Skeleton } from "@/components/ui/skeleton";
import { config } from "@/lib/config-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UserProfileButton() {
  const { user, profile, signOut, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    console.log('UserProfileButton: Sign out clicked, current user:', user?.email, user?.id);
    await signOut();
    setIsOpen(false);
  };

  const handleClosePopover = () => {
    setIsOpen(false);
  };

  // Debug logging when in debug mode
  if (config.debugMode) {
    console.log('UserProfileButton render:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      userId: user?.id,
      hasProfile: !!profile,
      profileScore: profile?.score,
      isLoading 
    });
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="User profile"
        >
          <UserIcon className="h-5 w-5" />
          {user && profile && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {profile.score || 0}
            </span>
          )}
          {/* Debug indicator when in debug mode */}
          {config.debugMode && (
            <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-red-500" 
                  title={`Debug: ${user ? 'AUTH' : 'ANON'}`} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <h3 className="font-medium">Profile</h3>
              <div className="text-sm text-muted-foreground">
                <p>Email: {user.email}</p>
                {profile?.username && <p>Username: {profile.username}</p>}
                <p>Score: {profile?.score || 0}</p>
                <p>Prompts viewed: {profile?.viewed_prompts?.length || 0}</p>
                {config.debugMode && (
                  <p className="text-xs text-red-600">Debug: User ID: {user.id}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <div className="p-4">
            {config.debugMode && (
              <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Debug: Anonymous mode - no user session
              </div>
            )}
            <Suspense fallback={<div className="p-4">Loading...</div>}>
              <LoginForm onClose={handleClosePopover} redirectPath={pathname} />
            </Suspense>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
