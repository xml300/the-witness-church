import type { Verse } from "./types";

// The list repeats. Each reference's text is fetched fresh from a free
// public-domain (King James) Bible service.
const REFERENCES = [
  "John 3:16", "Psalm 23:1", "Philippians 4:13", "Jeremiah 29:11",
  "Proverbs 3:5-6", "Isaiah 41:10", "Romans 8:28", "Joshua 1:9",
  "Psalm 46:1", "Matthew 11:28", "Psalm 91:1-2", "Proverbs 16:3",
  "Isaiah 40:31", "Romans 12:2", "2 Corinthians 5:7", "Galatians 2:20",
  "Ephesians 2:8-9", "Hebrews 11:1", "Psalm 121:1-2", "Matthew 6:33",
  "John 14:6", "1 Peter 5:7", "Colossians 3:23", "James 1:5",
  "Psalm 27:1", "Micah 6:8", "Lamentations 3:22-23", "Romans 5:8",
  "Philippians 4:6-7", "Psalm 119:105", "Deuteronomy 31:6", "Isaiah 26:3",
  "2 Timothy 1:7", "John 15:5", "Matthew 5:16", "Psalm 34:8",
  "Romans 15:13", "Zephaniah 3:17", "Numbers 6:24-26", "1 Corinthians 13:4-7",
];

// Offline fallback for ten references, King James Version.
const FALLBACK: Record<string, string> = {
  "John 3:16":
    "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Psalm 23:1": "The LORD is my shepherd; I shall not want.",
  "Philippians 4:13": "I can do all things through Christ which strengtheneth me.",
  "Jeremiah 29:11":
    "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
  "Proverbs 3:5-6":
    "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
  "Isaiah 41:10":
    "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
  "Romans 8:28":
    "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
  "Joshua 1:9":
    "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
  "Psalm 46:1": "God is our refuge and strength, a very present help in trouble.",
  "Matthew 11:28":
    "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
};

function dayOfYear(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

export const referenceFor = (today: string) =>
  REFERENCES[dayOfYear(today) % REFERENCES.length];

/** Today's verse. Falls back to a built-in verse if the service is down. */
export async function getVerseOfDay(today: string): Promise<Verse> {
  const reference = referenceFor(today);
  try {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`,
      {
        next: { revalidate: 21_600, tags: ["verse"] },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (res.ok) {
      const j = (await res.json()) as { reference?: string; text?: string };
      const text = (j.text ?? "").replace(/\s+/g, " ").trim();
      if (text) return { reference: j.reference ?? reference, text, version: "KJV" };
    }
  } catch {
    /* fall through to the built-in verse */
  }
  const keys = Object.keys(FALLBACK);
  const ref = FALLBACK[reference] ? reference : keys[dayOfYear(today) % keys.length];
  return { reference: ref, text: FALLBACK[ref], version: "KJV" };
}
