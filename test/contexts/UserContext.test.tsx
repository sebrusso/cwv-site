import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { UserProvider, useUser } from "@/contexts/UserContext";
import userEvent from "@testing-library/user-event";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

// Test component to access user context
function TestComponent() {
  const { signUp, signIn, signOut } = useUser();
  return (
    <div>
      <button onClick={() => signUp("test@example.com", "password")}>Sign Up</button>
      <button onClick={() => signIn("test@example.com")}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe("UserContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles sign up with correct redirect URL", async () => {
    const user = userEvent.setup();
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    const signUpButton = screen.getByText("Sign Up");
    await user.click(signUpButton);

    const { supabase } = await import("@/lib/supabase/client");
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback"
      }
    });
  });

  it("handles sign in with correct redirect URL", async () => {
    const user = userEvent.setup();
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    const signInButton = screen.getByText("Sign In");
    await user.click(signInButton);

    const { supabase } = await import("@/lib/supabase/client");
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000"
      }
    });
  });

  it("handles sign out", async () => {
    const user = userEvent.setup();
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    const signOutButton = screen.getByText("Sign Out");
    await user.click(signOutButton);

    const { supabase } = await import("@/lib/supabase/client");
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
