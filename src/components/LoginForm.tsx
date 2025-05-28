"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { CheckCircle2 } from "lucide-react";

interface LoginFormProps {
  onClose?: () => void;
}

export function LoginForm({ onClose }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn } = useUser();
  const addToast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email);

      if (error) {
        setError(error.message);
        addToast(error.message, "error");
      } else {
        setSuccess(true);
        addToast("Magic link sent", "success");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      addToast("An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      {success ? (
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-sm">Magic link was sent, check your email.</p>
          <Button className="w-full" onClick={onClose}>
            Ok
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Email</div>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Skeleton className="h-5 w-full" /> : "Send magic link"}
          </Button>
        </form>
      )}
    </div>
  );
}
