import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Fraunces,
  Bricolage_Grotesque,
} from "next/font/google";
import "./globals.css";
import { getContent } from "@/src/lib/content/get-content";
import { themeToCss } from "@/src/lib/content/theme-css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

// Optional heading typefaces the admin can pick. preload:false means they are
// only downloaded when a visitor's page actually uses them.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "The Witness Church — Lagos, Nigeria",
    template: "%s | The Witness Church",
  },
  description:
    "A place of authentic worship, transformative teaching, and a community that walks with you through every season of life. Join us at The Witness Church, Lagos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme, look } = await getContent();
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${fraunces.variable} ${bricolage.variable}`}>
      <head>
        {/* Admin-chosen colors override the defaults in globals.css */}
        <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, look) }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
