"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { UserProfileButton } from "@/components/UserProfileButton";
import { LoginForm } from "@/components/LoginForm";
import { X } from "lucide-react";

export function SignupCTA() {
  const { user } = useUser();
  const [showLoginForm, setShowLoginForm] = useState(false);

  if (showLoginForm) {
    return (
      <Card className="max-w-md mx-auto my-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Create Your Account</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowLoginForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm onClose={() => setShowLoginForm(false)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="my-6 text-center space-y-4">
      <p className="text-sm text-muted-foreground">
        Create a free account to track your scores and help our research on human vs AI writing.
      </p>
      {user ? (
        <UserProfileButton />
      ) : (
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => setShowLoginForm(true)}>
            Create account
          </Button>
          <Link href="/login" className="text-sm underline">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
