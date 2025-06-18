'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAuthErrorMessage } from '@/lib/auth-utils-client';

function UpdatePasswordForm() {
  const { updatePassword } = useUser();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { error: apiError } = await updatePassword(password);
      if (apiError) {
        setError(getAuthErrorMessage(apiError));
      } else {
        setIsSuccess(true);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <p className="text-green-600 font-medium">
          Password updated successfully!
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting you to the login page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password">New Password</label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="confirm-password">Confirm New Password</label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}

function UpdatePasswordContent() {
  const searchParams = useSearchParams();
  const hasToken = searchParams.get('token'); // Supabase sends a token in the URL

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Password</CardTitle>
          <CardDescription>
            You have been securely logged in. Please enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasToken ? (
            <UpdatePasswordForm />
          ) : (
            <p className="text-center text-red-600">
              Invalid or expired password reset link. Please request a new one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdatePasswordContent />
    </Suspense>
  );
} 