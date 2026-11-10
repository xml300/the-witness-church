import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/src/lib/auth";
import { getFreshContent } from "@/src/lib/content/get-content";
import { isPageId } from "@/src/lib/content/pages";
import { getSiteData } from "@/src/lib/data/site-data";
import PreviewClient from "./PreviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getAdmin())) notFound();
  const { page } = await searchParams;
  const content = await getFreshContent();
  const data = await getSiteData(content);
  return (
    <PreviewClient
      initial={content}
      data={data}
      page={isPageId(page) ? page : "home"}
    />
  );
}
