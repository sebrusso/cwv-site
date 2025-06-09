import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
