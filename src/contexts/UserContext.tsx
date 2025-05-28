"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  username: string;
  score: number;
  viewed_prompts: string[];
  age_range?: string | null;
  education_level?: string | null;
  first_language?: string | null;
  literature_interest?: string | null;
  writing_background?: string | null;
  demographics_completed?: boolean;
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
  signIn: (email: string, redirectPath?: string) => Promise<{ error: AuthError | null }>; // Keep redirectPath for OTP, even if type in main differs, the implementation handles it.
  signInWithPassword: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
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
  const router = useRouter();
  const pathname = usePathname();

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
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') { // No rows returned
          console.log("No profile found, creating default profile");
          const defaultProfile: UserProfile = {
            id: userId,
            username: user?.email || '',
            score: 0,
            viewed_prompts: [],
            demographics_completed: false
          };
          setProfile(defaultProfile);
          
          // Try to create the profile in the database
          try {
            await supabase.from("profiles").insert(defaultProfile);
          } catch (insertError) {
            console.error("Error creating default profile:", insertError);
          }
        } else {
          console.error("Error fetching profile:", error);
        }
        setIsLoading(false);
        return;
      }

      setProfile(data);
      // Only redirect to onboarding if:
      // 1. Demographics not completed
      // 2. Not already on onboarding page
      // 3. Not on other protected paths like model-evaluation, human-machine, etc.
      const protectedPaths = ["/onboarding", "/model-evaluation", "/human-machine", "/leaderboard", "/dashboard", "/resources"];
      const isOnProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
      
      if (!data.demographics_completed && !isOnProtectedPath) {
        router.push("/onboarding");
      }
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
        process.env.NEXT_PUBLIC_SITE_URL || 
        (typeof window !== "undefined" ? window.location.origin : "");
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

  const signInWithPassword = async (
    email: string,
    password: string,
    remember?: boolean // Add remember parameter here to match type
  ) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error as AuthError };
    } catch (err) {
      console.error("Error signing up:", err);
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
    if (!user) {
      throw new Error('No user found');
    }

    try {
      console.log('Updating profile for user:', user.id);
      console.log('Updates:', updates);
      
      // Use upsert to handle cases where profile doesn't exist yet
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: user.email || '',
          score: 0,
          viewed_prompts: [],
          demographics_completed: false,
          ...updates
        }, {
          onConflict: 'id'
        })
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      setProfile((prev) => (prev ? { ...prev, ...updates } : {
        id: user.id,
        username: user.email || '',
        score: 0,
        viewed_prompts: [],
        demographics_completed: false,
        ...updates
      } as UserProfile));
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error; // Re-throw so the calling component can handle it
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
    signInWithPassword,
    signUp,
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
