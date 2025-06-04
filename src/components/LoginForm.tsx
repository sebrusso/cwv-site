"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthErrorMessage, isDevelopment } from "@/lib/auth-utils";

export function LoginForm() {
  const { signInWithPassword } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for URL parameters that might indicate auth issues
    const urlError = searchParams.get('error');
    const urlMessage = searchParams.get('message');
    
    if (urlError) {
      setError(getAuthErrorMessage({ message: urlError }));
    } else if (urlMessage) {
      setError(urlMessage);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        const friendlyMessage = getAuthErrorMessage(error);
        
        // Special handling for email confirmation issues
        if (friendlyMessage.includes('confirmation') || friendlyMessage.includes('confirmed')) {
          setError(
            <div>
              {friendlyMessage}
              {isDevelopment() && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>Development Note:</strong> Email confirmation emails may not be sent in local development. 
                  Contact an administrator if you&apos;re unable to confirm your account.
                </div>
              )}
              <div className="mt-2 text-sm">
                <Link href="/auth/signup" className="text-blue-600 hover:underline">
                  Need to create an account?
                </Link>
              </div>
            </div>
          );
        } else {
          setError(friendlyMessage);
        }
      } else {
        // Success - redirect will be handled by the auth context
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-600">
            {typeof error === 'string' ? error : error}
          </div>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
        ) : (
          "Sign in"
        )}
      </Button>
      <div className="text-center space-y-2">
        <p className="text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="underline">
            Sign up
          </Link>
        </p>
        <p className="text-xs text-gray-500">
          <Link href="/auth/reset" className="underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </form>
  );
}
