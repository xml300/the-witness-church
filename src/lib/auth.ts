import { createClient } from "@/src/lib/supabase/server";

/** Returns the signed-in admin, or null. Always call this inside every
 *  server action and admin page; the proxy redirect is only a convenience. */
export async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return null;
  return { user, supabase };
}
