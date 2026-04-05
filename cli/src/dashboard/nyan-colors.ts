/**
 * Nyan cat rainbow gradient — 256-step smooth interpolation.
 *
 * Six anchor colors from the classic nyan cat trail are interpolated
 * via linear RGB into a 256-step palette. The wider palette naturally
 * slows the visual cycle to ~20 seconds per full rotation at 80ms ticks.
 */

/** Anchor colors — classic nyan cat trail (top to bottom). */
const NYAN_ANCHORS = [
  "#FF0000", // Red
  "#FF9008", // Orange
  "#F6FF00", // Yellow
  "#7CFF27", // Green
  "#5FFBFF", // Cyan
  "#6400FF", // Purple
] as const;

const PALETTE_SIZE = 256;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

function interpolatePalette(anchors: readonly string[], steps: number): string[] {
  const result: string[] = [];
  const segmentSize = Math.floor(steps / anchors.length);
  for (let i = 0; i < anchors.length; i++) {
    const from = hexToRgb(anchors[i]);
    const to = hexToRgb(anchors[(i + 1) % anchors.length]);
    const count = i < anchors.length - 1 ? segmentSize : steps - result.length;
    for (let j = 0; j < count; j++) {
      const t = j / count;
      result.push(rgbToHex(
        Math.round(from.r + (to.r - from.r) * t),
        Math.round(from.g + (to.g - from.g) * t),
        Math.round(from.b + (to.b - from.b) * t),
      ));
    }
  }
  return result;
}

/** 256-step interpolated nyan cat palette. */
export const NYAN_PALETTE = interpolatePalette(NYAN_ANCHORS, PALETTE_SIZE);

/**
 * Returns the hex color for a non-space character in the banner.
 * Space characters return undefined (no color applied).
 *
 * @param char - The character to colorize
 * @param charIndex - Position of the character in the banner line
 * @param tickOffset - Current animation tick (increments every 80ms)
 * @returns Hex color string or undefined for spaces
 */
export function nyanColor(
  char: string,
  charIndex: number,
  tickOffset: number,
): string | undefined {
  if (char === " ") return undefined;
  const paletteIndex = ((Math.floor(charIndex / 2) + tickOffset) % NYAN_PALETTE.length + NYAN_PALETTE.length) % NYAN_PALETTE.length;
  return NYAN_PALETTE[paletteIndex];
}
