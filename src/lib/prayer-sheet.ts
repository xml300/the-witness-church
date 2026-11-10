export type SheetResult = { ok: true } | { ok: false; reason: string };

/** Appends one row to the pastor's Google Sheet through an Apps Script web app
 *  (see supabase/SETUP.md). The row carries a name only if the visitor chose
 *  to give one, and no contact details.
 *  The reason on failure says what to check, so the admin can fix it. */
export async function sendToSheet(p: {
  text: string;
  category: string;
  target: string;
  /** Optional. Only ever written to the sheet. */
  name?: string;
}): Promise<SheetResult> {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEET_SECRET;
  if (!url || !secret) {
    return {
      ok: false,
      reason:
        "GOOGLE_SHEET_WEBHOOK_URL and GOOGLE_SHEET_SECRET are not set. Add both to .env, then restart the dev server.",
    };
  }
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
    return {
      ok: false,
      reason:
        "The web app URL should start with https://script.google.com/ and end with /exec. Copy it again from Deploy > Manage deployments.",
    };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...p, submittedAt: new Date().toISOString() }),
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let j: { ok?: boolean; error?: string } | null = null;
    try {
      j = JSON.parse(text);
    } catch {
      /* not JSON: Google returned a page instead of the script's answer */
    }
    if (j?.ok === true) return { ok: true };
    if (j?.error === "secret") {
      return {
        ok: false,
        reason: "The secret in the script and GOOGLE_SHEET_SECRET do not match.",
      };
    }
    if (!j) {
      return {
        ok: false,
        reason:
          "Google did not run the script. Deploy it as a Web app with access set to Anyone, and use the URL ending in /exec.",
      };
    }
    if (j.ok === false && !j.error) {
      return {
        ok: false,
        reason:
          "The script refused the request. The SECRET in the script almost certainly differs from GOOGLE_SHEET_SECRET (check for extra spaces or quotes), or the script was edited without redeploying a new version.",
      };
    }
    return { ok: false, reason: j.error ?? "The script returned an error." };
  } catch {
    return {
      ok: false,
      reason: "Could not reach Google. Check the internet connection and try again.",
    };
  }
}
