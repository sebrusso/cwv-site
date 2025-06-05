"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { UserProfileButton } from "@/components/UserProfileButton";

export function SignupCTA() {
  const { user } = useUser();

  return (
    <div className="my-6 text-center space-y-4">
      <p className="text-sm text-muted-foreground">
        Create a free account to track your scores and help our research on human vs AI writing.
      </p>
      {user ? (
        <UserProfileButton />
      ) : (
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button>Create account</Button>
          </Link>
          <Link href="/login" className="text-sm underline">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
