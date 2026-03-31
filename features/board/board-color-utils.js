export function parseHexColor(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) {
    return null;
  }

  let hex = match[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const number = Number.parseInt(hex, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

export function parseColorToRgb(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }

  const rgbMatch = trimmed
    .replace(/\s+/g, "")
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/i);
  if (!rgbMatch) {
    return null;
  }

  return {
    r: Number(rgbMatch[1]),
    g: Number(rgbMatch[2]),
    b: Number(rgbMatch[3]),
  };
}

export function colorsMatch(a, b) {
  const aRgb = parseColorToRgb(a);
  const bRgb = parseColorToRgb(b);
  if (!aRgb || !bRgb) {
    return false;
  }

  return aRgb.r === bRgb.r && aRgb.g === bRgb.g && aRgb.b === bRgb.b;
}

export function mixRgb(base, target, amount) {
  const ratio = Math.min(1, Math.max(0, Number(amount) || 0));
  return {
    r: Math.round(base.r + (target.r - base.r) * ratio),
    g: Math.round(base.g + (target.g - base.g) * ratio),
    b: Math.round(base.b + (target.b - base.b) * ratio),
  };
}

export function rgbToString(rgb) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
