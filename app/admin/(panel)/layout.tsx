import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/src/lib/auth";
import { supabaseConfigured } from "@/src/lib/supabase/config";
import SetupNotice from "../SetupNotice";
import SignOutButton from "../_components/SignOutButton";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Site editor", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured) return <SetupNotice />;

  const admin = await getAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/admin/login");
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-bg px-6">
        <div className="max-w-md bg-white rounded-2xl border border-gray-2 p-8 text-center">
          <h1 className="text-xl font-extrabold text-navy mb-2">Not an admin</h1>
          <p className="text-sm text-muted mb-5">
            {user.email} is signed in but is not on the admin list.
          </p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
