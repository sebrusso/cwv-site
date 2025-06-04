"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { getAuthErrorMessage } from "@/lib/auth-utils";

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { signUp } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(getAuthErrorMessage(error));
      } else {
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Unexpected signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 p-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-800 mb-2">Account Created!</h3>
          <p className="text-sm text-green-700 mb-2">
            Your account has been created successfully. 
          </p>
          <p className="text-sm text-green-600">
            <strong>Next steps:</strong>
          </p>
          <ul className="text-sm text-green-600 mt-1 space-y-1">
            <li>• Check your email for a confirmation link</li>
            <li>• Click the link to verify your email address</li>
            <li>• Return here to sign in with your credentials</li>
          </ul>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <strong>Development Note:</strong> If you don&apos;t receive an email, this is normal in local development. 
              Your account is created but you&apos;ll need to wait for email service configuration or contact an administrator.
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
          <button 
            onClick={() => setSuccess(false)} 
            className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Create Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Email</div>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Password</div>
        <Input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Confirm Password</div>
        <Input
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
        ) : (
          "Create account"
        )}
      </Button>
      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
