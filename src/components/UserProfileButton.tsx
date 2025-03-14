"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { LogOut, User as UserIcon } from "lucide-react";
import { LoginForm } from "./LoginForm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UserProfileButton() {
  const { user, profile, signOut, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleClosePopover = () => {
    setIsOpen(false);
  };

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
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          <LoginForm onClose={handleClosePopover} />
        )}
      </PopoverContent>
    </Popover>
  );
}
