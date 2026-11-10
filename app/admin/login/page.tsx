import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { supabaseConfigured } from "@/src/lib/supabase/config";
import SetupNotice from "../SetupNotice";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  // Already signed in (session cookie present): go straight to the panel.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-bg px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-2 shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-navy mb-1">Admin sign in</h1>
        <p className="text-sm text-muted mb-6">
          Sign in with your admin email and password.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
