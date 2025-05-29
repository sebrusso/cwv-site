"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import type { Subscription } from "@supabase/supabase-js";
import { shouldBypassAuth, getMockAuthData } from "@/lib/auth-utils";

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
    password: string
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

  const fetchProfile = useCallback(async (userId: string) => {
    // If authentication is disabled, use mock profile
    if (shouldBypassAuth()) {
      const mockData = getMockAuthData();
      setProfile(mockData.profile);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log('Profile fetch error:', error);
        
        // If profile doesn't exist, wait a moment for potential database trigger to complete
        if (error.code === 'PGRST116') {
          console.log("No profile found, waiting for potential trigger completion...");
          
          // Wait 1 second and try again in case the trigger is still processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryData, error: retryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
            
          if (!retryError && retryData) {
            console.log("Profile found on retry:", retryData);
            setProfile(retryData);
            
            // Check if onboarding redirect is needed
            if (!retryData.demographics_completed && pathname === "/") {
              console.log("Redirecting to onboarding from home page");
              router.push("/onboarding");
            }
            
            setIsLoading(false);
            return;
          }
          
          // If still no profile, create one manually
          console.log("Creating default profile manually...");
          try {
            const defaultProfile = {
              id: userId,
              username: user?.email || '',
              score: 0,
              viewed_prompts: [],
              demographics_completed: false
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from("profiles")
              .insert(defaultProfile)
              .select()
              .single();
              
            if (createError) {
              console.error("Error creating profile:", createError);
              // Set default profile in state even if DB insert fails
              setProfile(defaultProfile);
            } else {
              console.log("Profile created successfully:", createdProfile);
              setProfile(createdProfile);
            }
            
            // Redirect to onboarding since this is a new profile
            if (pathname === "/") {
              console.log("Redirecting new user to onboarding");
              router.push("/onboarding");
            }
            
          } catch (insertError) {
            console.error("Error creating default profile:", insertError);
            // Create profile in state only as fallback
            setProfile({
              id: userId,
              username: user?.email || '',
              score: 0,
              viewed_prompts: [],
              demographics_completed: false
            });
          }
        } else {
          console.error("Unexpected error fetching profile:", error);
        }
        setIsLoading(false);
        return;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      
      // Only redirect to onboarding if:
      // 1. Demographics not completed
      // 2. User is on the home page (not on onboarding or other protected paths)
      if (!data.demographics_completed && pathname === "/") {
        console.log("Redirecting to onboarding - demographics not completed");
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router, user?.email]);

  useEffect(() => {
    // If authentication is disabled, set mock data and return early
    // This prevents Supabase from trying to refresh tokens or handle auth
    if (shouldBypassAuth()) {
      const mockData = getMockAuthData();
      setUser(mockData.user);
      setSession(mockData.session);
      setProfile(mockData.profile);
      setIsLoading(false);
      return;
    }

    // Only initialize Supabase auth when authentication is enabled
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }

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

        // Store subscription for cleanup
        return { data: { subscription } };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsLoading(false);
        return null;
      }
    };

    // Initialize auth and store subscription for cleanup
    let authSubscription: { data: { subscription: Subscription } } | null = null;
    initializeAuth().then(subscription => {
      authSubscription = subscription;
    });

    // Cleanup function
    return () => {
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);

  const signIn = async (email: string, redirectPath?: string) => {
    // If authentication is disabled, return success immediately
    if (shouldBypassAuth()) {
      return { error: null };
    }

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
    password: string
  ) => {
    // If authentication is disabled, return success immediately
    if (shouldBypassAuth()) {
      return { error: null };
    }

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
    // If authentication is disabled, return success immediately
    if (shouldBypassAuth()) {
      return { error: null };
    }

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
    // If authentication is disabled, do nothing
    if (shouldBypassAuth()) {
      return;
    }

    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user found');
    }

    // If authentication is disabled, update profile state only
    if (shouldBypassAuth()) {
      const currentProfile = profile || getMockAuthData().profile;
      const updatedProfile = { 
        ...currentProfile,
        ...updates 
      } as UserProfile;
      setProfile(updatedProfile);
      return updatedProfile;
    }

    try {
      console.log('Updating profile for user:', user.id);
      console.log('Updates:', updates);
      
      // First, get the current profile from database to ensure we have latest data
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current profile:', fetchError);
        throw new Error(`Failed to fetch current profile: ${fetchError.message}`);
      }

      // Prepare the profile data for upsert
      const profileData = {
        id: user.id,
        username: user.email || '',
        score: 0,
        viewed_prompts: [],
        demographics_completed: false,
        // Include current profile data if it exists
        ...(currentProfile || {}),
        // Apply the updates
        ...updates
      };

      console.log('Profile data for upsert:', profileData);

      // Use upsert to handle cases where profile doesn't exist yet
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      console.log('Supabase upsert response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      if (!data) {
        throw new Error('No data returned from profile update');
      }

      // Only update local state after successful database operation
      setProfile(data);
      
      console.log('Profile updated successfully:', data);
      return data;
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
