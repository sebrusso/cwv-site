"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  username: string;
  score: number;
  viewed_prompts: string[];
};

// Define an error type for the signIn function
type AuthError = {
  message: string;
  // Add other properties that might be in the error object
  status?: number;
  code?: string;
};

type UserContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, redirectPath?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  incrementScore: () => Promise<void>;
  addViewedPrompt: (promptId: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setIsLoading(false);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, redirectPath?: string) => {
    setIsLoading(true);
    try {
      // Use NEXT_PUBLIC_SITE_URL environment variable if available, otherwise fall back to window.location.origin
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = redirectPath
        ? `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
        : baseUrl;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      return { error: error as AuthError };
    } catch (err) {
      console.error("Error signing in:", err);
      const error =
        err instanceof Error
          ? ({ message: err.message } as AuthError)
          : ({ message: "An unknown error occurred" } as AuthError);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const incrementScore = async () => {
    if (!user || !profile) return;

    try {
      const newScore = (profile.score || 0) + 1;
      await updateProfile({ score: newScore });
    } catch (error) {
      console.error("Error incrementing score:", error);
    }
  };

  const addViewedPrompt = async (promptId: string) => {
    if (!user || !profile) return;

    try {
      const viewedPrompts = [...(profile.viewed_prompts || [])];
      if (!viewedPrompts.includes(promptId)) {
        viewedPrompts.push(promptId);
        await updateProfile({ viewed_prompts: viewedPrompts });
      }
    } catch (error) {
      console.error("Error adding viewed prompt:", error);
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signOut,
    updateProfile,
    incrementScore,
    addViewedPrompt,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
