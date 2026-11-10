"use client";

import { useId, useState } from "react";
import { TIME_CHOICES, type Field } from "@/src/lib/content/schema";
import { createClient } from "@/src/lib/supabase/client";

export type Row = Record<string, string | number>;

export function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (a, k) => (a == null ? a : (a as Record<string, unknown>)[k]),
      obj,
    );
}

export function setPath(obj: unknown, path: string, value: unknown) {
  const parts = path.split(".");
  const last = parts.pop()!;
  let cur = obj as Record<string, unknown>;
  for (const p of parts) cur = cur[p] as Record<string, unknown>;
  cur[last] = value;
}

/* ---------- image upload ---------- */

const MAX_EDGE = 1920;
const MAX_BYTES = 5 * 1024 * 1024;

async function shrink(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file; // keep animation
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/webp", 0.85),
  );
  return blob ?? file;
}

/** Shrinks the photo in the browser, uploads it, and returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > MAX_BYTES) throw new Error("That photo is over 5 MB.");
  const blob = await shrink(file);
  const ext =
    blob.type === "image/webp" ? "webp" : (file.type.split("/")[1] ?? "img");
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("site-images")
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

/* ---------- field control ---------- */

export function FieldInput({
  field,
  value,
  onChange,
  onPickImage,
  categories = [],
  onAddCategory,
}: {
  field: Field;
  value: string | number;
  onChange: (v: string | number) => void;
  onPickImage: () => void;
  /** Names offered by a category field. */
  categories?: string[];
  /** Adds a new category; the field then selects it. */
  onAddCategory?: (name: string) => string | null;
}) {
  const id = useId();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  return (
    <div className="ed-field">
      <label htmlFor={id}>{field.label}</label>
      {field.type === "image" ? (
        <div className="ed-photo">
          <span
            className="ed-photo-thumb"
            style={value ? { backgroundImage: `url("${String(value)}")` } : undefined}
          />
          <button id={id} type="button" className="ed-mini" onClick={onPickImage}>
            {value ? "Change photo" : "Choose photo"}
          </button>
        </div>
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          rows={4}
          maxLength={field.max}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "range" ? (
        <div className="ed-rangeline">
          <input
            id={id}
            type="range"
            min={field.min}
            max={field.max}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output>{Number(value)}</output>
        </div>
      ) : field.type === "category" ? (
        <div className="ed-catfield">
          <select
            id={id}
            value={adding ? "__new__" : String(value ?? "")}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setAdding(true);
                return;
              }
              setAdding(false);
              onChange(e.target.value);
            }}
          >
            <option value="">No category</option>
            {/* A category that was removed stays visible until it is changed. */}
            {value && !categories.includes(String(value)) && (
              <option value={String(value)}>{String(value)} (not in the list)</option>
            )}
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {onAddCategory && <option value="__new__">+ New category…</option>}
          </select>
          {adding && onAddCategory && (
            <div className="ed-dateline">
              <input
                type="text"
                value={newName}
                maxLength={24}
                autoFocus
                placeholder="Category name"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.click();
                  }
                }}
              />
              <button
                type="button"
                className="ed-mini"
                onClick={() => {
                  const err = onAddCategory(newName);
                  if (err) {
                    setAddError(err);
                    return;
                  }
                  onChange(newName.trim());
                  setAdding(false);
                  setNewName("");
                  setAddError("");
                }}
              >
                Add
              </button>
              <button
                type="button"
                className="ed-mini"
                onClick={() => {
                  setAdding(false);
                  setAddError("");
                }}
              >
                Cancel
              </button>
            </div>
          )}
          {addError && <p className="ed-error">{addError}</p>}
        </div>
      ) : field.type === "date" ? (
        <div className="ed-dateline">
          <input
            id={id}
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.optional && value ? (
            <button type="button" className="ed-mini" onClick={() => onChange("")}>
              Clear
            </button>
          ) : null}
        </div>
      ) : field.type === "time" ? (
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">No time set</option>
          {/* An older free-text time stays selectable instead of vanishing. */}
          {value && !TIME_CHOICES.includes(String(value)) && (
            <option value={String(value)}>{String(value)}</option>
          )}
          {TIME_CHOICES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          value={Number(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : Number(e.target.value))
          }
        />
      ) : (
        <input
          id={id}
          type="text"
          maxLength={field.max}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.hint && field.type !== "image" && (
        <p className="ed-hint">{field.hint}</p>
      )}
    </div>
  );
}
