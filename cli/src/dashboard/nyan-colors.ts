/**
 * Nyan cat rainbow color palette — 256-step smooth interpolation.
 * Linear RGB interpolation between the 6 classic nyan cat stripe colors.
 */

/** The 6 anchor colors from the classic nyan cat trail (top to bottom). */
const ANCHOR_COLORS = [
  "#FF0000", // Red
  "#FF9008", // Orange
  "#F6FF00", // Yellow
  "#7CFF27", // Green
  "#5FFBFF", // Cyan
  "#6400FF", // Purple
] as const;

/** Parse a hex color string to [r, g, b] tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Format [r, g, b] tuple as a hex color string. */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

/** Build a 256-step interpolated palette from the anchor colors. */
function buildInterpolatedPalette(): readonly string[] {
  const anchors = ANCHOR_COLORS.map(hexToRgb);
  const segmentCount = anchors.length;
  const stepsPerSegment = 256 / segmentCount; // ~42.67
  const palette: string[] = [];

  for (let i = 0; i < 256; i++) {
    const segment = Math.floor(i / stepsPerSegment);
    const t = (i - segment * stepsPerSegment) / stepsPerSegment;
    const from = anchors[segment % segmentCount];
    const to = anchors[(segment + 1) % segmentCount];
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    palette.push(rgbToHex(r, g, b));
  }

  return Object.freeze(palette);
}

/** 256-step interpolated nyan cat rainbow palette. */
export const NYAN_PALETTE = buildInterpolatedPalette();

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
  const paletteIndex = ((charIndex + tickOffset) % 256 + 256) % 256;
  return NYAN_PALETTE[paletteIndex];
}
