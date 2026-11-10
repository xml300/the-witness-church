import { FONT_CHOICES } from "./look";
import type { Look, Theme } from "./types";

export const THEME_VARS: Record<keyof Theme, string> = {
  navy: "--color-navy",
  navyDeep: "--color-navy-deep",
  red: "--color-red",
  redDark: "--color-red-dark",
  pink: "--color-pink",
  pinkLight: "--color-pink-light",
  grayBg: "--color-gray-bg",
  gray2: "--color-gray-2",
  text: "--color-text",
  muted: "--color-muted",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export const THEME_KEYS = Object.keys(THEME_VARS) as (keyof Theme)[];
export const isHex = (v: unknown): v is string =>
  typeof v === "string" && HEX.test(v);

/** Builds a :root rule. Only strict #rrggbb values, bounded numbers and a
 *  fixed list of font variables are emitted, so the output can never carry
 *  arbitrary CSS. Radii scale Tailwind's rounded-* utilities; at 16 they
 *  equal Tailwind's defaults. */
export function themeToCss(theme: Theme, look?: Look): string {
  const decls = THEME_KEYS.filter((k) => isHex(theme[k])).map(
    (k) => `${THEME_VARS[k]}:${theme[k]}`,
  );
  if (look) {
    const r = Number.isFinite(look.radius)
      ? Math.min(28, Math.max(0, look.radius))
      : 16;
    decls.push(
      `--radius-md:${r * 0.375}px`,
      `--radius-lg:${r * 0.5}px`,
      `--radius-xl:${r * 0.75}px`,
      `--radius-2xl:${r}px`,
      `--radius-3xl:${r * 1.5}px`,
    );
    const f = FONT_CHOICES[look.font];
    if (f) decls.push(`--font-heading:${f.cssVar}`);
  }
  return `:root{${decls.join(";")}}`;
}
