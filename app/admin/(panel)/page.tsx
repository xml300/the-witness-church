import { getAdmin } from "@/src/lib/auth";
import { contentFromObject, getFreshContent } from "@/src/lib/content/get-content";
import { getSiteData } from "@/src/lib/data/site-data";
import { apiKeyConfigured } from "@/src/lib/data/youtube";
import { metaConfigured } from "@/src/lib/data/social";
import { pastorDeliveryConfigured } from "@/src/lib/data/site-data";
import Editor from "../_editor/Editor";

export default async function EditorPage() {
  const admin = await getAdmin();
  if (!admin) return null; // the layout already shows sign-in or not-admin

  const published = await getFreshContent();
  const [draftRow, pending, data] = await Promise.all([
    admin.supabase
      .from("site_content")
      .select("value")
      .eq("key", "draft")
      .maybeSingle(),
    admin.supabase
      .from("prayer_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    getSiteData(published),
  ]);
  const draft = draftRow.data?.value ? contentFromObject(draftRow.data.value) : null;
  const meta = metaConfigured();

  return (
    <Editor
      published={published}
      draft={draft}
      library={data.library}
      info={{
        youtubeKey: apiKeyConfigured(),
        instagram: meta.instagram,
        facebook: meta.facebook,
        sheet: pastorDeliveryConfigured(),
        pendingPrayers: pending.count ?? 0,
      }}
    />
  );
}
