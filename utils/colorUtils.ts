// --- Color Utility Functions ---

/**
 * Converts a hex color string to an HSL (Hue, Saturation, Lightness) array.
 * @param hex - The hex color string (e.g., '#0D9488').
 * @returns A tuple [hue, saturation, lightness].
 */
export function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

/**
 * Converts an HSL color value to a hex string.
 * @param h - Hue (0-360).
 * @param s - Saturation (0-100).
 * @param l - Lightness (0-100).
 * @returns The hex color string.
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
  else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
  else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
  else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
  else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
  else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
  const toHex = (c: number) => ('0' + Math.round((c + m) * 255).toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generates a vibrant, dynamic color scale
export function generateColorScale(baseColor: string, count: number): string[] {
  const scale: string[] = [];
  const [baseH, baseS, baseL] = hexToHsl(baseColor);
  for (let i = 0; i < count; i++) {
    // Rotate hue by the golden angle for pleasing distribution
    const hue = (baseH + i * 137.5) % 360;
    // Vary saturation and lightness slightly for more dynamism
    const saturation = baseS - (i % 3) * 5;
    const lightness = baseL + (i % 4) * 5;
    scale.push(hslToHex(hue, Math.max(40, saturation), Math.min(70, lightness)));
  }
  return scale;
} 