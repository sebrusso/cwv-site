"use client";

import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center">Log In</h1>
        <LoginForm />
      </div>
    </div>
  );
}
