"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/src/assets/logo.png";
import Image from "next/image";

// Every link opens its own page. Sections that only scroll the homepage are
// not listed here.
const navLinks: { label: string; href: string; badge?: string }[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Connect", href: "/connect" },
  { label: "Games", href: "/games" },
];

export default function Navbar({
  liveUrl,
  isLive = false,
  eventCount = 0,
}: {
  liveUrl: string;
  /** True while a matching stream is on air. */
  isLive?: boolean;
  /** Number of events coming up soon, shown as a badge on Events. */
  eventCount?: number;
}) {
  const links = navLinks.map((l) =>
    l.href === "/events" && eventCount > 0 ? { ...l, badge: String(eventCount) } : l,
  );
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white py-2 flex items-center justify-between px-6 md:px-12 lg:px-16 transition-shadow duration-200 ${
          scrolled ? "shadow-md" : "shadow-none"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-32 md:w-64 h-auto">
            <Image src={Logo} alt="The witness church" />
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium text-text/70 hover:text-navy transition-colors duration-150 flex items-center gap-1"
            >
              {link.label}
              {link.badge && (
                <span className="bg-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 bg-red text-white text-sm font-semibold px-8 py-3 rounded-lg hover:bg-red-dark transition-colors duration-150 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" />
            {isLive ? "Live now" : "Watch Live"}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 -mr-2 rounded-md hover:bg-gray-bg transition-colors"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-text transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-text transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-text transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        {/* Drawer panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-[72px] flex items-center justify-between px-6 border-b border-gray-2">
            <span className="font-playfair font-semibold text-navy text-base">
              Menu
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1 rounded hover:bg-gray-bg text-muted transition-colors"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between py-3 px-4 rounded-xl text-[15px] font-medium text-text hover:bg-gray-bg hover:text-navy transition-colors"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="bg-red text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <div className="p-6 border-t border-gray-2">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-red text-white font-semibold py-3 rounded-xl hover:bg-red-dark transition-colors"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot" />
              {isLive ? "Live now" : "Watch Live"}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
