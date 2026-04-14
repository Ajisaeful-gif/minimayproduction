function splitCamelCaseWords(value) {
  return String(value ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function getColourCode(colour) {
  return String(colour ?? "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6) ?? "";
}

export function normalizeColourLabel(colour) {
  const rawColour = String(colour ?? "").trim().replace(/\s+/g, " ");

  if (!rawColour) {
    return "";
  }

  const colourCode = getColourCode(rawColour);
  let colourTail = rawColour.slice(colourCode.length).trim();

  if (!colourTail) {
    return colourCode;
  }

  if (/\s+-\s+/.test(colourTail)) {
    const [, ...colourParts] = colourTail.split(/\s+-\s+/);
    colourTail = colourParts.join("-").trim();
  }

  const normalizedTail = colourTail
    .split("-")
    .map((part) => splitCamelCaseWords(part))
    .filter(Boolean)
    .join("-");

  if (!normalizedTail) {
    return colourCode;
  }

  return `${colourCode} ${normalizedTail}`.trim();
}

export function normalizeColourKey(colour) {
  return normalizeColourLabel(colour)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
