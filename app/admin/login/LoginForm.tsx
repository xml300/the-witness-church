"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setBusy(false);
      setError(
        /fetch/i.test(error.message)
          ? "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in your env file."
          : error.message,
      );
      return;
    }
    // Full page load so the proxy and server see the new session cookie
    // and no cached redirect back to /admin/login is reused.
    window.location.assign("/admin");
  }

  const inputCls =
    "border border-gray-2 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-navy";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-text" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <label className="text-xs font-semibold text-text" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls}
      />
      {error && <p className="text-sm text-red-dark">{error}</p>}
      <button
        disabled={busy}
        className="bg-red text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-red-dark transition-colors disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
