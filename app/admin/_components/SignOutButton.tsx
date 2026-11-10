"use client";

import { useRouter } from "next/navigation";
import { signOut } from "../actions";

export default function SignOutButton({ light = false }: { light?: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className={
        light
          ? "text-xs underline text-white/70 hover:text-white"
          : "bg-navy text-white text-sm font-semibold rounded-lg px-4 py-2"
      }
    >
      Sign out
    </button>
  );
}
