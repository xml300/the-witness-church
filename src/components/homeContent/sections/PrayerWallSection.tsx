"use client";

import { useEffect, useRef, useState } from "react";
import { submitPrayer } from "@/app/prayer/actions";
import PrayerField from "@/src/components/homeContent/sections/PrayerField";
import { SectionTag, Heading } from "@/src/components/ui/Typography";
import type { Prayer } from "@/src/lib/content/types";
import type { PrayerWallItem } from "@/src/lib/data/types";

const CATEGORIES = [
  "Health & Healing",
  "Family",
  "Finance & Career",
  "Salvation of a Loved One",
  "Marriage",
  "Breakthrough",
  "Other",
];

// A fixed handful of faint stars, tiled behind the cards.
const STARS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='520'%3E%3Cg fill='white'%3E%3Ccircle cx='40' cy='60' r='1.2' opacity='.5'/%3E%3Ccircle cx='170' cy='24' r='.9' opacity='.35'/%3E%3Ccircle cx='260' cy='110' r='1.4' opacity='.55'/%3E%3Ccircle cx='410' cy='48' r='1' opacity='.4'/%3E%3Ccircle cx='480' cy='160' r='1.3' opacity='.5'/%3E%3Ccircle cx='90' cy='210' r='.9' opacity='.35'/%3E%3Ccircle cx='330' cy='230' r='1.1' opacity='.45'/%3E%3Ccircle cx='450' cy='320' r='.9' opacity='.35'/%3E%3Ccircle cx='60' cy='380' r='1.3' opacity='.5'/%3E%3Ccircle cx='210' cy='330' r='1' opacity='.4'/%3E%3Ccircle cx='300' cy='440' r='1.2' opacity='.5'/%3E%3Ccircle cx='140' cy='480' r='.8' opacity='.3'/%3E%3Ccircle cx='500' cy='470' r='1' opacity='.4'/%3E%3C/g%3E%3C/svg%3E\")";

const field =
  "w-full bg-gray-bg border border-gray-2 rounded-xl px-4 py-3 text-[13px] text-text placeholder-muted/60 focus:outline-none focus:border-red/50 focus:ring-2 focus:ring-red/10 transition-all";

export default function PrayerWallSection({
  prayer,
  prayers,
  pastorEnabled,
  preview = false,
}: {
  prayer: Prayer;
  prayers: PrayerWallItem[];
  pastorEnabled: boolean;
  /** In the editor preview the form is shown but cannot send. */
  preview?: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);

  const [target, setTarget] = useState("wall");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [opened, setOpened] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Escape closes the pop-up, the page behind stays still, focus goes in and
  // comes back to the button.
  useEffect(() => {
    if (!formOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFormOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const button = trigger.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [formOpen]);

  // The pastor option is always listed. Until the Google Sheet is connected it
  // is greyed out, so the choice is visible and honest.
  const targets = [
    { id: "wall", label: "The prayer wall", note: "Shared anonymously after review", ready: true },
    { id: "pastor", label: "The pastor", note: "Private, never shown publicly", ready: pastorEnabled },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return;
    setBusy(true);
    setError("");
    const r = await submitPrayer({
      text,
      category,
      target,
      name: target === "pastor" ? name : "",
      website,
      elapsed: Date.now() - opened,
    });
    setBusy(false);
    if (r.ok) {
      setDone(r.message);
      setText("");
      setName("");
    } else {
      setError(r.error);
    }
  }

  return (
    <section
      id="prayer"
      className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-deep py-20 pb-32 min-h-[88vh]"
    >
      {/* Faint stars and two soft glows behind everything */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ backgroundImage: STARS }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 15% 20%, rgba(216,27,96,.16), transparent 70%), radial-gradient(ellipse 45% 35% at 88% 78%, rgba(229,57,53,.13), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[1500px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <SectionTag variant="light">
            <span data-edit="prayer.tag">{prayer.tag}</span>
          </SectionTag>
          <Heading as="h2" light className="mb-3">
            <span data-edit="prayer.title">{prayer.title}</span>
          </Heading>
          <p className="text-[15px] text-white/65 leading-relaxed">
            <span data-edit="prayer.intro">{prayer.intro}</span>
          </p>
        </div>

        {prayers.length === 0 ? (
          <p className="text-center text-white/60 text-[16px] py-16">
            No prayers on the wall yet. Add the first one.
          </p>
        ) : (
          <PrayerField prayers={prayers} />
        )}
      </div>

      {/* Bottom-corner action */}
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setDone("");
          setError("");
          setOpened(Date.now());
          setFormOpen(true);
        }}
        className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-10 inline-flex items-center gap-2 bg-red text-white font-bold text-[14px] pl-5 pr-6 py-3.5 rounded-full shadow-2xl shadow-black/40 hover:bg-red-dark active:scale-95 transition-all"
      >
        <span aria-hidden="true" className="text-[20px] leading-none">+</span>
        Add a prayer
      </button>

      {formOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prayer-dialog-title"
        >
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          <div
            ref={dialog}
            tabIndex={-1}
            className="relative bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl outline-none"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full border border-gray-2 text-muted hover:text-navy hover:border-navy flex items-center justify-center"
            >
              ×
            </button>

            {done ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4" aria-hidden="true">🙏</div>
                <h3
                  id="prayer-dialog-title"
                  className="font-playfair text-[22px] font-bold text-navy mb-2"
                >
                  Request received
                </h3>
                <p className="text-[14px] text-muted leading-relaxed mb-6">{done}</p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDone("")}
                    className="text-[13px] font-semibold text-red hover:text-red-dark"
                  >
                    Send another
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="text-[13px] font-semibold text-navy hover:text-red"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <h3
                  id="prayer-dialog-title"
                  className="font-playfair text-[22px] font-bold text-navy mb-1 pr-10"
                >
                  Add a prayer
                </h3>
                <p className="text-[13px] text-muted mb-6">
                  It is never shown with your name.
                </p>

                <fieldset className="mb-5">
                  <legend className="text-[12px] font-semibold text-navy/70 mb-2">
                    Send my request to
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {targets.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                          !t.ready
                            ? "border-gray-2 opacity-60 cursor-not-allowed"
                            : target === t.id
                              ? "border-red bg-red/5 cursor-pointer"
                              : "border-gray-2 hover:border-red/40 cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="target"
                          value={t.id}
                          checked={target === t.id}
                          disabled={!t.ready}
                          onChange={() => setTarget(t.id)}
                          className="mt-1 accent-red"
                        />
                        <span>
                          <span className="block text-[13px] font-semibold text-navy">
                            {t.label}
                          </span>
                          <span className="block text-[12px] text-muted">
                            {t.ready ? t.note : "Coming soon"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {target === "pastor" && (
                  <div className="mb-5">
                    <label
                      htmlFor="prayer-name"
                      className="flex items-baseline justify-between text-[12px] font-semibold text-navy/70 mb-1.5"
                    >
                      <span>Your name</span>
                      <span className="font-medium text-muted">Optional</span>
                    </label>
                    <input
                      id="prayer-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      autoComplete="name"
                      placeholder="Leave blank to stay anonymous"
                      className={field}
                    />
                    <p className="text-[11px] text-muted mt-1">
                      Only our pastor sees your name. It is never shown on the
                      website.
                    </p>
                  </div>
                )}

                <div className="mb-5">
                  <label
                    htmlFor="prayer-category"
                    className="block text-[12px] font-semibold text-navy/70 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="prayer-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${field} appearance-none`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="prayer-text"
                    className="block text-[12px] font-semibold text-navy/70 mb-1.5"
                  >
                    Your prayer request
                  </label>
                  <textarea
                    id="prayer-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      target === "pastor"
                        ? "Share what is on your heart."
                        : "Share what is on your heart. Please leave out names and phone numbers."
                    }
                    rows={5}
                    maxLength={600}
                    required
                    className={`${field} resize-none`}
                  />
                  <p className="text-[11px] text-muted mt-1 text-right">{text.length}/600</p>
                </div>

                {/* Honeypot: hidden from people, tempting to bots. */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
                  <label>
                    Website
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>

                {error && (
                  <p role="alert" className="text-[13px] text-red-dark mb-4">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || preview}
                  className="w-full bg-red text-white font-semibold text-[14px] py-3.5 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-60"
                >
                  {preview
                    ? "Sending is off in the editor"
                    : busy
                      ? "Sending…"
                      : "Send prayer request"}
                </button>
                <p className="text-center text-[11px] text-muted mt-3">
                  {target === "pastor" ? (
                    "Sent privately to our pastor. Nothing is saved on this website."
                  ) : (
                    <>
                      No name or contact details are asked for or saved.{" "}
                      <span data-edit="prayer.wallNote">{prayer.wallNote}</span>
                    </>
                  )}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
