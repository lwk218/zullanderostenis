export const WHATSAPP_NUMBER = "523412401891";
export const CATALOG_LIMIT = 3000;

export function parseSizes(input) {
  if (typeof input !== "string") return [];
  const tokens = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const out = [];
  for (const tok of tokens) {
    const m = tok.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const hasHalf = m[1].includes(".") || m[2].includes(".");
      const step = hasHalf ? 0.5 : 1;
      const dir = a <= b ? 1 : -1;
      for (let v = a; dir === 1 ? v <= b : v >= b; v += step * dir) {
        const rounded = Math.round(v * 10) / 10;
        out.push(
          Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
        );
      }
    } else out.push(tok);
  }
  const unique = Array.from(new Set(out));
  unique.sort((x, y) => {
    const ax = Number(x),
      ay = Number(y);
    const xn = Number.isFinite(ax) && x !== "";
    const yn = Number.isFinite(ay) && y !== "";
    if (xn && yn) return ax - ay;
    if (xn && !yn) return -1;
    if (!xn && yn) return 1;
    return x.localeCompare(y);
  });
  return unique;
}

export function norm(s) {
  return String(s || "")
    .toLowerCase()
    .trim();
}

export function primaryColor(color) {
  const t = norm(color)
    .replace(/[,]+/g, " ")
    .trim();
  if (!t) return "";
  return t.split(/\s+/)[0] || "";
}

export const COLOR_MAP = {
  blanco: "#ffffff",
  negro: "#1a1a1a",
  rojo: "#e53e3e",
  azul: "#3182ce",
  rosa: "#ed64a6",
  verde: "#38a169",
  gris: "#a0aec0",
  amarillo: "#ecc94b",
  naranja: "#ed8936",
  morado: "#805ad5",
  cafe: "#8b6f47",
  beige: "#f5e6d3",
  dorado: "#d4a017",
  plateado: "#c0c0c0",
  celeste: "#63b3ed",
  coral: "#fc8181",
  turquesa: "#38b2ac",
  lila: "#b794f6",
  vino: "#742a2a",
  crema: "#fefcbf",
};

export function colorToHex(name) {
  return COLOR_MAP[name] || "#d4d4d4";
}

export function canonSegment(seg) {
  const s = norm(seg);
  if (!s) return "";
  if (s === "nina") return "niña";
  if (s === "nino") return "niño";
  return s;
}

export function segmentMatchesFilter(itemSegRaw, filterSegRaw) {
  const itemSeg = canonSegment(itemSegRaw);
  const seg = canonSegment(filterSegRaw);
  if (!seg) return true;
  if (seg === "dama" || seg === "caballero") {
    return itemSeg === seg || itemSeg === "unisex";
  }
  return itemSeg === seg;
}

export function supportUrl() {
  const lines = [
    "Hola, necesito soporte con la página de Zul Landeros Tenis.",
    "¿Me pueden ayudar por favor?",
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    lines.join("\n")
  )}`;
}

export function orderUrl({ brand, model, size, link }) {
  const lines = [
    `¡Hola! Me interesa adquirir el modelo ${model} de la marca ${brand}.`,
    `Talla: ${size || "—"}`,
    `Link: ${link}`,
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    lines.join("\n")
  )}`;
}
