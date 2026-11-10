import Link from "next/link";
import type { SiteInfo } from "@/src/lib/content/types";

type FooterLink = { label: string; href: string };

const ministries: FooterLink[] = [
  { label: "Children's Ministry", href: "/connect" },
  { label: "Youth Ministry", href: "/connect" },
  { label: "Women's Fellowship", href: "/connect" },
  { label: "Men's Brotherhood", href: "/connect" },
  { label: "Marriage Ministry", href: "/connect" },
  { label: "Prayer Ministry", href: "/#prayer" },
];

const resources: FooterLink[] = [
  { label: "Sermon Archive", href: "/sermons" },
  { label: "Verse of the Day", href: "/#devotion" },
  { label: "Bible Reading Plans", href: "https://www.bible.com/reading-plans" },
  { label: "Faith & Fun Games", href: "/games" },
];

const visitLinks: FooterLink[] = [
  { label: "Service Times", href: "/connect" },
  { label: "Location & Directions", href: "/connect" },
  { label: "Events Calendar", href: "/events" },
  { label: "About Us", href: "/about" },
  { label: "Prayer Wall", href: "/#prayer" },
];

function SocialIcon({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="w-9 h-9 rounded-lg bg-white/8 hover:bg-red/20 flex items-center justify-center text-white/50 hover:text-white transition-all duration-150"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function Footer({ info }: { info: SiteInfo }) {
  return (
    <footer className="bg-[#070e17] border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-14 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-red flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                  <path d="M11 2v8H3v4h8v8h4v-8h8v-4h-8V2z" />
                </svg>
              </div>
              <div>
                <div className="font-playfair text-[15px] font-semibold text-white leading-snug">
                  {info.churchName}
                </div>
                <div className="text-[10px] font-semibold tracking-[2px] uppercase text-white/40">
                  {info.location}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[260px]">
              {info.footerBlurb}
            </p>
            <div className="flex gap-3 mt-5">
              {info.socialYoutube && (
                <SocialIcon href={info.socialYoutube}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
                  </svg>
                </SocialIcon>
              )}
              {info.socialX && (
              <SocialIcon href={info.socialX}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              )}
              {info.socialFacebook && (
              <SocialIcon href={info.socialFacebook}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialIcon>
              )}
              {info.socialInstagram && (
              <SocialIcon href={info.socialInstagram}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </SocialIcon>
              )}
              {info.socialTiktok && (
              <SocialIcon href={info.socialTiktok}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
                </svg>
              </SocialIcon>
              )}
            </div>
          </div>

          {/* Ministries */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[2px] uppercase text-red mb-4">
              Ministries
            </h4>
            <ul className="flex flex-col gap-2">
              {ministries.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[2px] uppercase text-red mb-4">
              Resources
            </h4>
            <ul className="flex flex-col gap-2">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Us */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[2px] uppercase text-red mb-4">
              Visit Us
            </h4>
            <ul className="flex flex-col gap-2">
              {visitLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/30">
            {info.copyright}
          </p>
          <div className="flex items-center gap-4 text-[12px] text-white/30">
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <span>&middot;</span>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms of Use</Link>
            <span>&middot;</span>
            <Link href="#" className="hover:text-white/60 transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
