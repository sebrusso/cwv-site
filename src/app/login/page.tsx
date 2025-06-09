"use client";

import { LoginForm } from "@/components/LoginForm";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center">Log In</h1>
        <LoginForm redirectPath={redirect} />
      </div>
    </div>
  );
}
