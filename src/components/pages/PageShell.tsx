import type { ReactNode } from "react";
import Footer from "@/src/components/shared/Footer";
import Navbar from "@/src/components/shared/Navbar";
import { navProps } from "@/src/lib/content/nav";
import type { SiteContent } from "@/src/lib/content/types";
import type { SiteData } from "@/src/lib/data/types";

/** Navbar, footer and a content area shared by every sub-page. */
export default function PageShell({
  content,
  data,
  children,
}: {
  content: SiteContent;
  data: SiteData;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar {...navProps(content, data)} />
      <main>{children}</main>
      <Footer info={content.site_info} />
    </>
  );
}

export function PageHeader({
  tag,
  title,
  intro,
}: {
  tag: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="bg-gradient-to-br from-navy to-navy-deep text-white px-6 md:px-12 lg:px-16 py-16 md:py-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] font-bold tracking-[2.5px] uppercase text-white/60 mb-3">
          {tag}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] text-white">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 text-[16px] md:text-[18px] text-white/70 leading-relaxed max-w-2xl">
            {intro}
          </p>
        )}
      </div>
    </header>
  );
}
