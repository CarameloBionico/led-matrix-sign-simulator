const canvas = document.querySelector("#ledCanvas");
const ctx = canvas.getContext("2d");

const controls = {
  message: document.querySelector("#messageInput"),
  width: document.querySelector("#widthInput"),
  height: document.querySelector("#heightInput"),
  gap: document.querySelector("#gapInput"),
  ledSize: document.querySelector("#ledSizeInput"),
  letterHeight: document.querySelector("#letterHeightInput"),
  letterSpacing: document.querySelector("#letterSpacingInput"),
  letterHeightValue: document.querySelector("#letterHeightValue"),
  font: document.querySelector("#fontInput"),
  fontStatus: document.querySelector("#fontStatusLabel"),
  fontHeight: document.querySelector("#fontHeightInput"),
  fontFamilyName: document.querySelector("#fontFamilyNameLabel"),
  fontEditorHeight: document.querySelector("#fontEditorHeightLabel"),
  fontMonospace: document.querySelector("#fontMonospaceInput"),
  fontDefaultAdvance: document.querySelector("#fontDefaultAdvanceInput"),
  fontSaveAs: document.querySelector("#fontSaveAsButton"),
  fontSaveAsMain: document.querySelector("#fontSaveAsMainButton"),
  color: document.querySelector("#colorInput"),
  speed: document.querySelector("#speedInput"),
  modes: [...document.querySelectorAll("input[name='mode']")],
  statusDot: document.querySelector(".status-dot"),
  editor: document.querySelector("#glyphEditor"),
  editorOpen: document.querySelector("#editorOpenButton"),
  editorClose: document.querySelector("#editorCloseButton"),
  fontDerive: document.querySelector("#fontDeriveButton"),
  fontExport: document.querySelector("#fontExportButton"),
  fontImport: document.querySelector("#fontImportButton"),
  fontDelete: document.querySelector("#fontDeleteButton"),
  fontImportInput: document.querySelector("#fontImportInput"),
  guideToggle: document.querySelector("#guideToggleButton"),
  editorNewCharacter: document.querySelector("#editorNewCharacterInput"),
  editorAddCharacter: document.querySelector("#editorAddCharacterButton"),
  editorCopyCharacter: document.querySelector("#editorCopyCharacterButton"),
  editorPasteCharacter: document.querySelector("#editorPasteCharacterButton"),
  fontPreview: document.querySelector("#fontPreview"),
  glyphWidth: document.querySelector("#glyphWidthInput"),
  glyphAdvance: document.querySelector("#glyphAdvanceInput"),
  glyphOffsetX: document.querySelector("#glyphOffsetXInput"),
  glyphOffsetY: document.querySelector("#glyphOffsetYInput"),
  fontBaseline: document.querySelector("#fontBaselineInput"),
  fontAscent: document.querySelector("#fontAscentInput"),
  fontDescent: document.querySelector("#fontDescentInput"),
  fontCapHeight: document.querySelector("#fontCapHeightInput"),
  fontXHeight: document.querySelector("#fontXHeightInput"),
  editorGrid: document.querySelector("#editorGrid"),
  editorSave: document.querySelector("#editorSaveButton"),
  editorReset: document.querySelector("#editorResetButton"),
};

const fontCanvas = document.createElement("canvas");
const fontCtx = fontCanvas.getContext("2d", { willReadFrequently: true });
const STORAGE_KEY = "ledMatrixSignSettings";
const FONT_LIBRARY_KEY = "ledMatrixFontLibrary";
const FONT_LIBRARY_VERSION = 2;

let animationFrame = null;
let lastTime = 0;
let scrollOffset = 0;
let textPixels = [];
let textWidth = 1;
let needsTextRender = true;
let canvasSignature = "";
let fontLibrary = null;
let activeFont = null;
let activeFontSignature = "";
let activeFontIsProjected = false;
let activeFontMode = "exact";
let activeSourceFont = null;
let editorCharacter = "A";
let editorPixels = [];
let editorMetrics = {
  advance: 0,
  offsetX: 0,
  offsetY: 0,
};
let editorClipboard = null;
let editorStrokeValue = null;
let editorGuidesVisible = true;

const clamp = (value, min, max) => {
  const number = Number(value);
  const minimum = Number(min);
  const maximum = Number(max);

  return Math.min(Math.max(Number.isFinite(number) ? number : minimum, minimum), maximum);
};
const normalizeMatrixText = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const matrixFont5x7 = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "00000", "01100", "00100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "11100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00001", "00001", "00001", "00001", "10001", "10001", "01110"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

const matrixCharacters = Object.keys(matrixFont5x7);
const baseFont5x7 = createBaseFont5x7();

function getSettings() {
  return {
    columns: clamp(controls.width.value, 16, 512),
    rows: clamp(controls.height.value, 7, 48),
    gap: clamp(controls.gap.value, 1, 8),
    ledSize: clamp(controls.ledSize.value, 4, 14),
    letterHeight: clamp(controls.letterHeight.value, 45, 100) / 100,
    letterSpacing: clamp(controls.letterSpacing.value, 0, 8),
    color: controls.color.value,
    font: controls.font.value,
    speed: clamp(controls.speed.value, 1, 12),
    mode: document.querySelector("input[name='mode']:checked").value,
    message: controls.message.value.trim() || " ",
  };
}

function getControlState() {
  return {
    message: controls.message.value,
    width: controls.width.value,
    height: controls.height.value,
    gap: controls.gap.value,
    ledSize: controls.ledSize.value,
    letterHeight: controls.letterHeight.value,
    letterSpacing: controls.letterSpacing.value,
    font: controls.font.value,
    color: controls.color.value,
    speed: controls.speed.value,
    mode: document.querySelector("input[name='mode']:checked").value,
  };
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getControlState()));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function restoreSettings() {
  try {
    const storedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!storedSettings || typeof storedSettings !== "object") {
      return;
    }

    Object.entries(storedSettings).forEach(([key, value]) => {
      if (key === "mode") {
        const mode = controls.modes.find((control) => control.value === value);

        if (mode) {
          mode.checked = true;
        }

        return;
      }

      if (controls[key] && typeof value === "string") {
        controls[key].value = value;
      }
    });

    syncNumberBounds(controls.height);
    syncNumberBounds(controls.width);
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures for the same reason.
    }
  }
}

function createBaseFont5x7() {
  return {
    format: "led-matrix-font",
    version: 1,
    id: "classic-matrix-5x7-7px",
    familyId: "classic-matrix-5x7",
    familyName: "Classic Matrix 5x7",
    name: "Classic Matrix 5x7 - 7px",
    description: "Fonte bitmap base 5x7 para letreiros LED.",
    sourceFontId: null,
    encoding: "unicode",
    readonly: true,
    createdAt: "2026-05-16T00:00:00.000Z",
    updatedAt: "2026-05-16T00:00:00.000Z",
    metrics: {
      units: "led",
      mode: "monospace",
      height: 7,
      baseline: 6,
      ascent: 6,
      descent: 0,
      capHeight: 7,
      xHeight: 5,
      defaultAdvance: 5,
      defaultLetterSpacing: 1,
      defaultWordSpacing: 4,
      fallback: "?",
    },
    glyphs: Object.fromEntries(
      Object.entries(matrixFont5x7).map(([char, rows]) => [
        char,
        createGlyph({
          char,
          rows,
          width: rows[0]?.length || 0,
          height: rows.length,
          advance: rows[0]?.length || 0,
          category: getCharacterCategory(char),
        }),
      ]),
    ),
    composites: {},
  };
}

function createGlyph({ char, rows, width, height, advance, offsetX = 0, offsetY = 0, category = "symbol" }) {
  return {
    codepoint: getCodepoint(char),
    name: getGlyphName(char),
    category,
    width,
    height,
    advance,
    offsetX,
    offsetY,
    anchors: createDefaultAnchors(width, height),
    rows: normalizeGlyphRows(rows, width, height),
  };
}

function createDefaultAnchors(width, height) {
  return {
    accent: { x: Math.floor(width / 2), y: 0 },
    top: { x: Math.floor(width / 2), y: 0 },
    center: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    cedilla: { x: Math.floor(width / 2), y: height },
  };
}

function getCharacterCategory(char) {
  if (/^[A-Z]$/.test(char)) {
    return "uppercase";
  }

  if (/^[0-9]$/.test(char)) {
    return "number";
  }

  if (char === " ") {
    return "space";
  }

  return "symbol";
}

function getCodepoint(char) {
  return [...char].map((part) => `U+${part.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(" ");
}

function getGlyphName(char) {
  return char === " " ? "SPACE" : `GLYPH ${char}`;
}

function normalizeGlyphRows(rows, width, height) {
  return Array.from({ length: height }, (_, y) => {
    const row = rows[y] || "";
    return row.padEnd(width, "0").slice(0, width);
  });
}

function loadFontLibrary() {
  try {
    const storedLibrary = JSON.parse(localStorage.getItem(FONT_LIBRARY_KEY));
    fontLibrary =
      storedLibrary &&
      typeof storedLibrary === "object" &&
      storedLibrary.version === FONT_LIBRARY_VERSION &&
      Array.isArray(storedLibrary.customFonts)
        ? storedLibrary
        : createEmptyFontLibrary();
  } catch {
    fontLibrary = createEmptyFontLibrary();
  }

  repairFontLibrary();
}

function createEmptyFontLibrary() {
  return {
    version: FONT_LIBRARY_VERSION,
    baseFonts: [baseFont5x7],
    customFonts: [],
    activeFontId: null,
  };
}

function repairFontLibrary() {
  if (!fontLibrary?.customFonts) {
    return;
  }

  fontLibrary.customFonts = fontLibrary.customFonts.map((font) => {
    if (font.familyId !== baseFont5x7.familyId) {
      return font;
    }

    return {
      ...font,
      familyName: baseFont5x7.familyName,
      name: `${baseFont5x7.familyName} - ${font.metrics.height}px`,
    };
  });
  saveFontLibrary();
}

function saveFontLibrary() {
  try {
    localStorage.setItem(FONT_LIBRARY_KEY, JSON.stringify(fontLibrary));
  } catch {
    // Keep editing usable even when storage is restricted.
  }
}

function isValidFont(font) {
  return (
    font &&
    font.format === "led-matrix-font" &&
    Number(font.version) >= 1 &&
    typeof font.id === "string" &&
    typeof font.name === "string" &&
    font.metrics &&
    Number.isInteger(font.metrics.height) &&
    Number.isInteger(font.metrics.baseline) &&
    typeof font.metrics.fallback === "string" &&
    font.glyphs &&
    Object.values(font.glyphs).every(isValidGlyph)
  );
}

function isValidFontFamilyBundle(bundle) {
  return (
    bundle &&
    bundle.format === "led-matrix-font-family" &&
    Number(bundle.version) >= 1 &&
    typeof bundle.familyId === "string" &&
    typeof bundle.familyName === "string" &&
    Array.isArray(bundle.fonts) &&
    bundle.fonts.length > 0
  );
}

function isValidGlyph(glyph) {
  return (
    glyph &&
    Number.isInteger(glyph.width) &&
    Number.isInteger(glyph.height) &&
    Number.isInteger(glyph.advance) &&
    Number.isInteger(glyph.offsetX) &&
    Number.isInteger(glyph.offsetY) &&
    Array.isArray(glyph.rows) &&
    glyph.rows.length === glyph.height &&
    glyph.rows.every((row) => typeof row === "string" && row.length === glyph.width && /^[01]*$/.test(row))
  );
}

function normalizeFont(font) {
  const timestamp = new Date().toISOString();

  return {
    ...font,
    format: "led-matrix-font",
    version: 1,
    id: font.id || `imported-${Date.now()}`,
    familyId: font.familyId || font.id || `imported-${Date.now()}`,
    familyName: font.familyName || font.name || "Fonte importada",
    name: font.name || "Fonte importada",
    encoding: font.encoding || "unicode",
    readonly: false,
    createdAt: font.createdAt || timestamp,
    updatedAt: timestamp,
    metrics: {
      units: "led",
      mode: "monospace",
      defaultWordSpacing: 4,
      ...font.metrics,
    },
    glyphs: Object.fromEntries(
      Object.entries(font.glyphs).map(([char, glyph]) => [
        char,
        {
          ...glyph,
          codepoint: glyph.codepoint || getCodepoint(char),
          name: glyph.name || getGlyphName(char),
          category: glyph.category || getCharacterCategory(char),
          anchors: glyph.anchors || createDefaultAnchors(glyph.width, glyph.height),
          rows: normalizeGlyphRows(glyph.rows, glyph.width, glyph.height),
        },
      ]),
    ),
    composites: font.composites || {},
  };
}

function upsertCustomFont(font) {
  const index = fontLibrary.customFonts.findIndex((customFont) => customFont.id === font.id);

  if (index >= 0) {
    fontLibrary.customFonts[index] = font;
    return;
  }

  fontLibrary.customFonts.push(font);
}

function replaceCustomFontFamily(fonts) {
  const [firstFont] = fonts;

  fontLibrary.customFonts = fontLibrary.customFonts.filter((font) => font.familyId !== firstFont.familyId);
  fonts.forEach(upsertCustomFont);
}

function getMatrixGlyphSize(targetHeight) {
  return {
    height: targetHeight,
    width: Math.max(4, Math.round((targetHeight * 5) / 7)),
  };
}

function getAllFonts() {
  return [baseFont5x7, ...(fontLibrary?.customFonts || [])];
}

function getFontById(fontId) {
  return getAllFonts().find((font) => font.id === fontId);
}

function getFontFamilies() {
  const families = new Map();

  getAllFonts().forEach((font) => {
    if (!families.has(font.familyId)) {
      families.set(font.familyId, font.familyName);
    }
  });

  return [...families.entries()].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

function hasFontFamilyName(familyName) {
  return getFontFamilies().some((family) => family.name.localeCompare(familyName, "pt-BR", { sensitivity: "base" }) === 0);
}

function promptUniqueFontFamilyName(message, suggestedName) {
  const familyName = window.prompt(message, suggestedName)?.trim();

  if (!familyName) {
    return null;
  }

  if (hasFontFamilyName(familyName)) {
    window.alert("Ja existe uma familia de fonte com esse nome.");
    return null;
  }

  return familyName;
}

function renderFontFamilyOptions() {
  const selected = controls.font.value || baseFont5x7.familyId;

  controls.font.replaceChildren(
    ...getFontFamilies().map((family) => {
      const option = document.createElement("option");
      option.value = family.id;
      option.textContent = family.name;
      return option;
    }),
  );
  controls.font.value = getFontFamilies().some((family) => family.id === selected) ? selected : baseFont5x7.familyId;
}

function slugifyId(value) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "fonte"
  );
}

function getFontsForFamily(familyId) {
  return getAllFonts()
    .filter((font) => font.familyId === familyId)
    .sort((left, right) => left.metrics.height - right.metrics.height || Number(left.readonly) - Number(right.readonly));
}

function getBestFontForHeight(familyId, targetHeight) {
  const fonts = getFontsForFamily(familyId);

  return fonts.reduce((best, font) =>
    Math.abs(font.metrics.height - targetHeight) < Math.abs(best.metrics.height - targetHeight) ? font : best,
  );
}

function projectFont(baseFont, { targetHeight, familyId = baseFont.familyId, familyName = baseFont.familyName, id, name }) {
  const size = getMatrixGlyphSize(targetHeight);
  const timestamp = new Date().toISOString();

  return {
    format: "led-matrix-font",
    version: 1,
    id: id || `${baseFont.id}-projected-${size.height}px`,
    familyId,
    familyName,
    name: name || `${familyName} - ${size.height}px`,
    description: `Fonte projetada a partir de ${baseFont.name}.`,
    sourceFontId: baseFont.id,
    encoding: "unicode",
    readonly: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    metrics: {
      ...baseFont.metrics,
      mode: "monospace",
      height: size.height,
      baseline: size.height - 1,
      ascent: size.height - 1,
      descent: 0,
      capHeight: size.height,
      xHeight: Math.max(1, Math.round(size.height * 5 / 7)),
      defaultAdvance: size.width,
      defaultLetterSpacing: 1,
      defaultWordSpacing: Math.max(4, Math.round(size.width * 0.8)),
      fallback: baseFont.metrics.fallback,
    },
    glyphs: Object.fromEntries(
      Object.entries(baseFont.glyphs).map(([char, glyph]) => {
        const scaledRows = glyphToStrings(scaleMatrixGlyph(glyph.rows, size.width, size.height));

        return [
          char,
          createGlyph({
            char,
            rows: scaledRows,
            width: size.width,
            height: size.height,
            advance: size.width,
            category: glyph.category,
          }),
        ];
      }),
    ),
    composites: {},
  };
}

function embedFontInCanvas(baseFont, { canvasHeight, familyId = baseFont.familyId, familyName = baseFont.familyName, id, name, sourceFontId }) {
  const topOffset = Math.max(0, Math.floor((canvasHeight - baseFont.metrics.height) / 2));
  const baseline = Math.min(canvasHeight - 1, topOffset + baseFont.metrics.baseline);
  const timestamp = new Date().toISOString();

  return {
    ...structuredClone(baseFont),
    id: id || `${baseFont.id}-canvas-${canvasHeight}px`,
    familyId,
    familyName,
    name: name || `${familyName} - ${canvasHeight}px`,
    description: `Fonte materializada em canvas de ${canvasHeight}px a partir de ${baseFont.name}.`,
    sourceFontId: sourceFontId || baseFont.sourceFontId || baseFont.id,
    sourceProjectionHeight: baseFont.metrics.height,
    readonly: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    metrics: {
      ...baseFont.metrics,
      height: canvasHeight,
      baseline,
      ascent: baseline,
      descent: Math.max(0, canvasHeight - baseline - 1),
      capHeight: Math.min(baseFont.metrics.capHeight || baseFont.metrics.height, canvasHeight),
      xHeight: Math.min(baseFont.metrics.xHeight || baseFont.metrics.height, canvasHeight),
    },
    glyphs: Object.fromEntries(
      Object.entries(baseFont.glyphs).map(([char, glyph]) => {
        const width = glyph.width;
        const rows = Array.from({ length: canvasHeight }, () => Array.from({ length: width }, () => false));

        glyph.rows.forEach((row, y) => {
          [...row].forEach((pixel, x) => {
            if (pixel !== "1") {
              return;
            }

            const targetY = topOffset + glyph.offsetY + y;

            if (rows[targetY]?.[x] !== undefined) {
              rows[targetY][x] = true;
            }
          });
        });

        return [
          char,
          createGlyph({
            char,
            rows: glyphToStrings(rows),
            width,
            height: canvasHeight,
            advance: glyph.advance,
            offsetX: glyph.offsetX,
            offsetY: 0,
            category: glyph.category,
          }),
        ];
      }),
    ),
  };
}

function ensureActiveFont(settings = getSettings()) {
  const targetHeight = getLetterHeight(settings);
  const familyId = controls.font.value || baseFont5x7.familyId;
  const exactFont = getFontsForFamily(familyId).find((font) => font.metrics.height === targetHeight);
  const isFullHeight = targetHeight === settings.rows;
  const sourceFont = exactFont || getBestFontForHeight(familyId, targetHeight) || baseFont5x7;
  const font = exactFont && isFullHeight ? exactFont : projectFont(sourceFont, { targetHeight, familyId, familyName: sourceFont.familyName });
  const mode = exactFont && isFullHeight ? "exact" : isFullHeight ? "simulated" : "projected";
  const nextSignature = `${font.id}:${mode}:${settings.rows}:${targetHeight}`;

  if (activeFontSignature !== nextSignature) {
    activeFont = font;
    activeFontSignature = nextSignature;
    activeFontIsProjected = mode === "projected";
    activeFontMode = mode;
    activeSourceFont = sourceFont;
    fontLibrary.activeFontId = mode === "exact" ? font.id : null;
  }

  controls.letterSpacing.value = activeFont.metrics.defaultLetterSpacing;
  return activeFont;
}

function persistActiveFontForEditing() {
  if (activeFontMode !== "simulated" && !activeFont.readonly) {
    return;
  }

  const font = structuredClone(activeFont);
  const familyId = controls.font.value || font.familyId;

  font.id = `${familyId}-${font.metrics.height}px`;
  font.familyId = familyId;
  font.familyName = activeSourceFont?.familyName || font.familyName;
  font.name = `${font.familyName} - ${font.metrics.height}px`;
  font.sourceFontId = activeSourceFont?.id || font.sourceFontId;
  font.readonly = false;
  font.createdAt = new Date().toISOString();
  font.updatedAt = font.createdAt;
  upsertCustomFont(font);
  fontLibrary.activeFontId = font.id;
  activeFont = font;
  activeSourceFont = font;
  activeFontMode = "exact";
  activeFontIsProjected = false;
  activeFontSignature = `${font.id}:exact:${getSettings().rows}:${font.metrics.height}`;
  saveFontLibrary();
}

function updateControlReadouts(settings = getSettings()) {
  const targetHeight = getLetterHeight(settings);
  const font = ensureActiveFont(settings);

  controls.letterHeightValue.textContent = `${targetHeight}px`;
  controls.fontHeight.value = activeFontIsProjected && activeSourceFont ? activeSourceFont.metrics.height : font.metrics.height;
  controls.fontStatus.textContent =
    activeFontMode === "projected" ? "Projetada, derivar" : activeFontMode === "simulated" ? "Simulada, editar" : "Exata";
  controls.fontDerive.disabled = !activeFontIsProjected;
  controls.fontDelete.disabled = !fontLibrary.customFonts.some((customFont) => customFont.familyId === font.familyId);
}

function syncGlobalMetricInputs() {
  const font = ensureActiveFont();
  const height = font.metrics.height;

  controls.fontFamilyName.textContent = font.familyName;
  controls.fontEditorHeight.textContent = `${height}px`;
  controls.fontMonospace.checked = font.metrics.mode !== "proportional";
  controls.fontDefaultAdvance.value = font.metrics.defaultAdvance;
  controls.fontDefaultAdvance.max = Math.max(controls.fontDefaultAdvance.max, height * 4, font.metrics.defaultAdvance);
  controls.fontBaseline.min = 1;
  controls.fontBaseline.max = height;
  controls.fontAscent.max = height;
  controls.fontDescent.max = height;
  controls.fontCapHeight.max = height;
  controls.fontXHeight.max = height;
  controls.fontBaseline.value = font.metrics.baseline + 1;
  controls.fontAscent.value = font.metrics.ascent;
  controls.fontDescent.value = font.metrics.descent;
  controls.fontCapHeight.value = font.metrics.capHeight;
  controls.fontXHeight.value = font.metrics.xHeight;
}

function setFontMonospaceMode() {
  const font = ensureActiveFont();
  const isMonospace = controls.fontMonospace.checked;

  font.metrics.mode = isMonospace ? "monospace" : "proportional";
  if (isMonospace) {
    const advance = clamp(font.metrics.defaultAdvance, controls.fontDefaultAdvance.min, controls.fontDefaultAdvance.max);
    font.metrics.defaultAdvance = advance;
    Object.values(font.glyphs).forEach((glyph) => {
      glyph.advance = advance;
    });
    editorMetrics.advance = advance;
  }
  font.updatedAt = new Date().toISOString();
  saveFontLibrary();
  syncEditorMetricInputs();
  syncGlobalMetricInputs();
  renderEditorGrid();
  renderFontPreview();
  markTextDirty();
}

function resizeGlyphRows(rows, width, height) {
  return normalizeGlyphRows(rows, width, height);
}

function updateDefaultAdvance() {
  const font = ensureActiveFont();
  const width = clamp(controls.fontDefaultAdvance.value, controls.fontDefaultAdvance.min, controls.fontDefaultAdvance.max);

  font.metrics.defaultAdvance = width;
  if (font.metrics.mode !== "proportional") {
    Object.values(font.glyphs).forEach((glyph) => {
      glyph.width = width;
      glyph.advance = width;
      glyph.rows = resizeGlyphRows(glyph.rows, width, glyph.height);
      glyph.anchors = createDefaultAnchors(width, glyph.height);
    });
    if (font.glyphs[editorCharacter]) {
      const glyph = font.glyphs[editorCharacter];
      editorPixels = cloneGlyph(stringsToGlyph(glyph.rows));
      editorMetrics.advance = width;
      editorMetrics.offsetX = glyph.offsetX;
      editorMetrics.offsetY = glyph.offsetY;
    }
  }
  font.updatedAt = new Date().toISOString();
  saveFontLibrary();
  syncEditorMetricInputs();
  syncGlobalMetricInputs();
  renderEditorGrid();
  renderFontPreview();
  markTextDirty();
}

function saveActiveFontAs() {
  const source = ensureActiveFont();
  const suggestedName = `${source.familyName} copia`;
  const familyName = promptUniqueFontFamilyName("Nome da nova familia de fonte:", suggestedName);

  if (!familyName) {
    return;
  }

  const timestamp = Date.now();
  const familyId = `${slugifyId(familyName)}-${timestamp}`;
  const font = structuredClone(source);

  font.id = `${familyId}-${font.metrics.height}px`;
  font.familyId = familyId;
  font.familyName = familyName;
  font.name = `${font.familyName} - ${font.metrics.height}px`;
  font.readonly = false;
  font.sourceFontId = source.id;
  font.createdAt = new Date().toISOString();
  font.updatedAt = font.createdAt;
  upsertCustomFont(font);
  renderFontFamilyOptions();
  controls.font.value = familyId;
  fontLibrary.activeFontId = font.id;
  activeFont = font;
  activeSourceFont = font;
  activeFontMode = "exact";
  activeFontIsProjected = false;
  activeFontSignature = `${font.id}:exact:${getSettings().rows}:${font.metrics.height}`;
  saveFontLibrary();
  saveSettings();
  syncGlobalMetricInputs();
  loadEditorCharacter(editorCharacter);
  markTextDirty();
}

function deleteActiveFont() {
  const font = ensureActiveFont();
  const familyId = font.familyId;
  const fontsToDelete = fontLibrary.customFonts.filter((customFont) => customFont.familyId === familyId);
  const familyName = getFontFamilies().find((family) => family.id === familyId)?.name || font.familyName;

  if (fontsToDelete.length === 0) {
    return;
  }

  const confirmed = window.confirm(
    `Apagar a fonte "${familyName}"? Essa acao remove ${fontsToDelete.length} variacao(oes) salva(s) neste navegador.`,
  );

  if (!confirmed) {
    return;
  }

  fontLibrary.customFonts = fontLibrary.customFonts.filter((customFont) => customFont.familyId !== familyId);
  fontLibrary.activeFontId = null;
  controls.font.value = baseFont5x7.familyId;
  activeFont = null;
  activeSourceFont = null;
  activeFontSignature = "";
  activeFontMode = "exact";
  activeFontIsProjected = false;
  saveFontLibrary();
  renderFontFamilyOptions();
  controls.font.value = baseFont5x7.familyId;
  ensureActiveFont();
  updateControlReadouts(getSettings());
  refreshEditorIfOpen();
  markTextDirty();
  saveSettings();
}

function updateGlobalFontMetric(control, key) {
  const font = ensureActiveFont();

  font.metrics[key] =
    key === "baseline" ? clamp(control.value, control.min, control.max) - 1 : clamp(control.value, control.min, control.max);
  font.updatedAt = new Date().toISOString();
  saveFontLibrary();
  syncGlobalMetricInputs();
  renderEditorGrid();
  renderFontPreview();
  markTextDirty();
}

function materializeProjectedFontAsDerivedFamily(familyName) {
  if (!activeFontIsProjected) {
    return false;
  }

  const settings = getSettings();
  const projectedFont = ensureActiveFont(settings);
  const sourceFont = activeSourceFont || ensureActiveFont(settings);
  const familyId = `${sourceFont.familyId || sourceFont.id}-derived-${Date.now()}`;
  const font = embedFontInCanvas(projectedFont, {
    canvasHeight: settings.rows,
    familyId,
    familyName,
    id: `${familyId}-${settings.rows}px`,
    name: `${familyName} - ${settings.rows}px`,
    sourceFontId: sourceFont.id,
  });

  upsertCustomFont(font);
  renderFontFamilyOptions();
  controls.font.value = familyId;
  controls.letterHeight.value = 100;
  fontLibrary.activeFontId = font.id;
  activeFont = font;
  activeFontIsProjected = false;
  activeFontMode = "exact";
  activeSourceFont = font;
  activeFontSignature = `${font.id}:exact:${settings.rows}:${settings.rows}`;
  saveFontLibrary();
  saveSettings();
  updateControlReadouts(getSettings());
  refreshEditorIfOpen();
  markTextDirty();
  return true;
}

function deriveProjectedFont() {
  const sourceFont = activeSourceFont || ensureActiveFont();
  const baseFamilyName = sourceFont.familyName || sourceFont.name;
  const familyName = promptUniqueFontFamilyName("Nome da fonte derivada:", `${baseFamilyName} - derivada`);

  if (!familyName) {
    return;
  }

  materializeProjectedFontAsDerivedFamily(familyName);
}

function glyphToStrings(glyph) {
  return glyph.map((row) => row.map((active) => (active ? "1" : "0")).join(""));
}

function stringsToGlyph(glyph) {
  return glyph.map((row) => [...row].map((pixel) => pixel === "1"));
}

function getGlyph(font, char) {
  return font.glyphs[char] || font.glyphs[font.metrics.fallback] || font.glyphs["?"];
}

function resolveMatrixChar(font, char) {
  if (font.glyphs[char]) {
    return char;
  }

  const normalizedChar = normalizeMatrixText(char);
  return font.glyphs[normalizedChar] ? normalizedChar : char;
}

function cloneGlyph(glyph) {
  return glyph.map((row) => [...row]);
}

function syncEditorClipboardControls() {
  controls.editorPasteCharacter.disabled = !editorClipboard;
  controls.editorPasteCharacter.title = editorClipboard
    ? `Colar matriz copiada de ${editorClipboard.char === " " ? "Espaco" : editorClipboard.char}`
    : "Copie um caractere antes de colar";
}

function openGlyphEditor() {
  ensureActiveFont();
  persistActiveFontForEditing();

  controls.editor.hidden = false;
  syncGlobalMetricInputs();
  renderFontPreview();
  loadEditorCharacter(editorCharacter);
}

function closeGlyphEditor() {
  controls.editor.hidden = true;
}

function renderFontPreview() {
  const font = ensureActiveFont();
  const characters = Object.keys(font.glyphs).sort((left, right) => left.localeCompare(right, "pt-BR"));

  controls.fontPreview.replaceChildren(
    ...characters.map((char) => {
      const glyph = getGlyph(font, char);
      const button = document.createElement("button");
      const label = document.createElement("span");
      const grid = document.createElement("span");

      button.type = "button";
      button.className = `preview-glyph${char === editorCharacter ? " is-active" : ""}`;
      button.setAttribute("aria-label", char === " " ? "Espaco" : `Editar ${char}`);
      button.addEventListener("click", () => {
        editorCharacter = char;
        renderFontPreview();
        loadEditorCharacter(char);
      });

      label.className = "preview-glyph-label";
      label.textContent = char === " " ? "SP" : char;

      grid.className = "preview-glyph-grid";
      grid.style.gridTemplateColumns = `repeat(${glyph.width}, var(--preview-led-size))`;

      glyph.rows.forEach((row) => {
        [...row].forEach((pixel) => {
          const led = document.createElement("span");
          led.className = `preview-led${pixel === "1" ? " is-active" : ""}`;
          grid.append(led);
        });
      });

      button.append(grid, label);
      return button;
    }),
  );
}

function loadEditorCharacter(char) {
  const settings = getSettings();
  const font = ensureActiveFont(settings);
  const glyph = getGlyph(font, char);

  editorPixels = cloneGlyph(stringsToGlyph(glyph.rows));
  editorMetrics = {
    advance: glyph.advance,
    offsetX: glyph.offsetX,
    offsetY: glyph.offsetY,
  };
  syncEditorMetricInputs();
  syncGlobalMetricInputs();
  syncEditorClipboardControls();
  renderFontPreview();
  renderEditorGrid();
}

function syncEditorMetricInputs() {
  const font = ensureActiveFont();
  const width = editorPixels[0]?.length || 1;
  const isMonospace = font.metrics.mode !== "proportional";

  if (isMonospace) {
    editorMetrics.advance = font.metrics.defaultAdvance;
  }
  controls.glyphWidth.value = editorPixels[0]?.length || 1;
  controls.glyphAdvance.value = isMonospace ? font.metrics.defaultAdvance : editorMetrics.advance;
  controls.glyphAdvance.disabled = isMonospace;
  controls.glyphAdvance.title = isMonospace ? "Advance bloqueado no modo monoespacado" : "";
  controls.glyphOffsetX.value = editorMetrics.offsetX;
  controls.glyphOffsetY.value = editorMetrics.offsetY;
  controls.glyphOffsetX.min = -width;
  controls.glyphOffsetX.max = Math.max(width, editorMetrics.advance, font.metrics.defaultAdvance);
  controls.glyphOffsetY.min = -editorPixels.length;
  controls.glyphOffsetY.max = font.metrics.height;
}

function resizeGlyphPixels(nextWidth) {
  const width = clamp(nextWidth, controls.glyphWidth.min, controls.glyphWidth.max);
  const currentWidth = editorPixels[0]?.length || 0;

  if (width === currentWidth) {
    return;
  }

  editorPixels = editorPixels.map((row) =>
    Array.from({ length: width }, (_, x) => (x < currentWidth ? Boolean(row[x]) : false)),
  );
  syncEditorMetricInputs();
  renderEditorGrid();
}

function updateEditorMetric(control, key) {
  if (key === "advance" && ensureActiveFont().metrics.mode !== "proportional") {
    syncEditorMetricInputs();
    return;
  }

  editorMetrics[key] = clamp(control.value, control.min, control.max);
  control.value = editorMetrics[key];
  syncEditorMetricInputs();
  renderEditorGrid();
}

function copyEditorCharacter() {
  if (editorPixels.length === 0) {
    return;
  }

  editorClipboard = {
    char: editorCharacter,
    pixels: cloneGlyph(editorPixels),
    metrics: { ...editorMetrics },
  };
  syncEditorClipboardControls();
}

function pasteEditorCharacter() {
  if (!editorClipboard) {
    return;
  }

  editorPixels = cloneGlyph(editorClipboard.pixels);
  editorMetrics = { ...editorClipboard.metrics };
  if (ensureActiveFont().metrics.mode !== "proportional") {
    editorMetrics.advance = ensureActiveFont().metrics.defaultAdvance;
  }
  syncEditorMetricInputs();
  renderEditorGrid();
}

function applyEditorStroke(glyphX, glyphY, value, cell) {
  if (editorPixels[glyphY]?.[glyphX] === undefined || editorPixels[glyphY][glyphX] === value) {
    return;
  }

  editorPixels[glyphY][glyphX] = value;
  cell.classList.toggle("is-active", value);
}

function setEditorGuideLine(name, value) {
  controls.editorGrid.style.setProperty(`--glyph-${name}`, value);
}

function createGuide({ className, label }) {
  const guide = document.createElement("span");

  guide.className = className;
  guide.dataset.label = label;

  return guide;
}

function syncGuideToggle() {
  controls.editorGrid.classList.toggle("guides-hidden", !editorGuidesVisible);
  controls.guideToggle.textContent = editorGuidesVisible ? "Ocultar guias" : "Mostrar guias";
  controls.guideToggle.setAttribute("aria-pressed", String(editorGuidesVisible));
}

function renderEditorGrid() {
  const pixelWidth = editorPixels[0]?.length || 1;
  const font = ensureActiveFont();
  const displayLeft = Math.min(0, editorMetrics.offsetX);
  const displayTop = Math.min(0, editorMetrics.offsetY);
  const displayRight = Math.max(editorMetrics.advance, editorMetrics.offsetX + pixelWidth, 1);
  const displayBottom = Math.max(font.metrics.height, editorMetrics.offsetY + editorPixels.length, 1);
  const displayWidth = displayRight - displayLeft;
  const displayHeight = displayBottom - displayTop;

  controls.editorGrid.style.setProperty("--glyph-columns", displayWidth);
  controls.editorGrid.style.setProperty("--glyph-rows", displayHeight);
  setEditorGuideLine("baseline", font.metrics.baseline - displayTop);
  setEditorGuideLine("advance", editorMetrics.advance - displayLeft);
  setEditorGuideLine("ascent-line", Math.max(0, font.metrics.baseline - font.metrics.ascent + 1 - displayTop));
  setEditorGuideLine("descent-line", Math.min(displayHeight, font.metrics.baseline + font.metrics.descent + 1 - displayTop));
  setEditorGuideLine("cap-line", Math.max(0, font.metrics.baseline - font.metrics.capHeight + 1 - displayTop));
  setEditorGuideLine("x-line", Math.max(0, font.metrics.baseline - font.metrics.xHeight + 1 - displayTop));
  syncGuideToggle();
  resizeEditorGrid();
  controls.editorGrid.replaceChildren(
    createGuide({ className: "glyph-guide glyph-guide-horizontal glyph-guide-ascent", label: "Ascent" }),
    createGuide({ className: "glyph-guide glyph-guide-horizontal glyph-guide-cap", label: "Cap" }),
    createGuide({ className: "glyph-guide glyph-guide-horizontal glyph-guide-xheight", label: "X" }),
    createGuide({ className: "glyph-guide glyph-guide-horizontal glyph-guide-baseline", label: "Base" }),
    createGuide({ className: "glyph-guide glyph-guide-horizontal glyph-guide-descent", label: "Desc" }),
    createGuide({ className: "glyph-guide glyph-guide-vertical glyph-guide-advance", label: "Adv" }),
    ...Array.from({ length: displayHeight }, (_, displayY) =>
      Array.from({ length: displayWidth }, (_, x) => {
        const fontX = x + displayLeft;
        const fontY = displayY + displayTop;
        const glyphX = fontX - editorMetrics.offsetX;
        const glyphY = fontY - editorMetrics.offsetY;
        const isEditable = glyphY >= 0 && glyphY < editorPixels.length && glyphX >= 0 && glyphX < pixelWidth;
        const active = isEditable && Boolean(editorPixels[glyphY][glyphX]);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `glyph-cell${active ? " is-active" : ""}${isEditable ? "" : " is-guide-cell"}`;
        button.setAttribute("aria-label", `${fontX},${fontY}`);
        button.disabled = !isEditable;

        if (isEditable) {
          button.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) {
              return;
            }

            event.preventDefault();
            editorStrokeValue = !editorPixels[glyphY][glyphX];
            applyEditorStroke(glyphX, glyphY, editorStrokeValue, button);
          });
          button.addEventListener("pointerenter", (event) => {
            if (editorStrokeValue === null || (event.buttons & 1) !== 1) {
              return;
            }

            applyEditorStroke(glyphX, glyphY, editorStrokeValue, button);
          });
          button.addEventListener("keydown", (event) => {
            if (event.key !== " " && event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            applyEditorStroke(glyphX, glyphY, !editorPixels[glyphY][glyphX], button);
          });
        }

        return button;
      }),
    ).flat(),
  );
}

function addEditorCharacter() {
  const [char] = [...controls.editorNewCharacter.value.trim()];

  if (!char) {
    return;
  }

  const font = ensureActiveFont();
  const width = font.metrics.defaultAdvance;
  const height = font.metrics.height;

  if (!font.glyphs[char]) {
    font.glyphs[char] = createGlyph({
      char,
      rows: Array.from({ length: height }, () => "0".repeat(width)),
      width,
      height,
      advance: width,
      category: getCharacterCategory(char),
    });
    font.updatedAt = new Date().toISOString();
    saveFontLibrary();
  }

  editorCharacter = char;
  controls.editorNewCharacter.value = "";
  loadEditorCharacter(char);
  renderFontPreview();
  markTextDirty();
}

function resizeEditorGrid() {
  if (controls.editor.hidden || editorPixels.length === 0) {
    return;
  }

  const panel = controls.editor.querySelector(".glyph-editor-panel");
  const header = controls.editor.querySelector(".glyph-editor-header");
  const globalMetrics = controls.editor.querySelector(".font-global-metrics");
  const preview = controls.editor.querySelector(".font-preview");
  const createRow = controls.editor.querySelector(".character-create");
  const metricsRow = controls.editor.querySelector(".glyph-metrics");
  const editArea = controls.editor.querySelector(".glyph-edit-area");
  const columns = editorPixels[0]?.length || 1;
  const rows = editorPixels.length || 1;
  const panelStyle = getComputedStyle(panel);
  const gridStyle = getComputedStyle(controls.editorGrid);
  const gap = parseFloat(gridStyle.columnGap) || 0;
  const panelGap = parseFloat(panelStyle.rowGap) || 0;
  const panelPaddingY = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom);
  const panelPaddingX = parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight);
  const reservedHeight =
    header.offsetHeight +
    globalMetrics.offsetHeight +
    preview.offsetHeight +
    createRow.offsetHeight +
    panelGap * 4 +
    panelPaddingY +
    18;
  const availableHeight = Math.max(90, panel.clientHeight - reservedHeight);
  const availableWidth = Math.max(90, editArea.clientWidth - metricsRow.offsetWidth - 40);
  const cellByHeight = (availableHeight - gap * (rows - 1)) / rows;
  const cellByWidth = (availableWidth - gap * (columns - 1)) / columns;
  const cellSize = Math.max(12, Math.floor(Math.min(cellByHeight, cellByWidth, 54)));

  controls.editorGrid.style.setProperty("--glyph-cell-size", `${cellSize}px`);
}

function saveEditorCharacter() {
  const font = ensureActiveFont();
  const width = editorPixels[0]?.length || 0;
  const height = editorPixels.length;
  const advance = font.metrics.mode !== "proportional" ? font.metrics.defaultAdvance : editorMetrics.advance;

  font.glyphs[editorCharacter] = createGlyph({
    char: editorCharacter,
    rows: glyphToStrings(editorPixels),
    width,
    height,
    advance,
    offsetX: editorMetrics.offsetX,
    offsetY: editorMetrics.offsetY,
    category: getCharacterCategory(editorCharacter),
  });
  font.updatedAt = new Date().toISOString();
  saveFontLibrary();
  loadEditorCharacter(editorCharacter);
  renderFontPreview();
  markTextDirty();
}

function inferFontContentHeight(font) {
  return Object.entries(font.glyphs).reduce((height, [char, glyph]) => {
    if (char === " ") {
      return height;
    }

    const bounds = glyph.rows.reduce(
      (glyphBounds, row, y) => {
        [...row].forEach((pixel) => {
          if (pixel === "1") {
            glyphBounds.top = Math.min(glyphBounds.top, y);
            glyphBounds.bottom = Math.max(glyphBounds.bottom, y);
          }
        });

        return glyphBounds;
      },
      { top: Infinity, bottom: -Infinity },
    );

    return bounds.bottom >= bounds.top ? Math.max(height, bounds.bottom - bounds.top + 1) : height;
  }, 0);
}

function getDefaultFontForReset(font, settings) {
  const sourceFont = getFontById(font.sourceFontId);
  const sourceProjectionHeight = font.sourceProjectionHeight || inferFontContentHeight(font);

  if (sourceFont && sourceProjectionHeight && sourceProjectionHeight < font.metrics.height) {
    return embedFontInCanvas(projectFont(sourceFont, { targetHeight: sourceProjectionHeight }), {
      canvasHeight: font.metrics.height,
      familyId: font.familyId,
      familyName: font.familyName,
      sourceFontId: sourceFont.id,
    });
  }

  return projectFont(baseFont5x7, { targetHeight: getLetterHeight(settings) });
}

function resetEditorCharacter() {
  const settings = getSettings();
  const font = ensureActiveFont(settings);
  const resetFont = getDefaultFontForReset(font, settings);

  if (resetFont.glyphs[editorCharacter]) {
    font.glyphs[editorCharacter] = resetFont.glyphs[editorCharacter];
    font.updatedAt = new Date().toISOString();
    saveFontLibrary();
  }

  loadEditorCharacter(editorCharacter);
  renderFontPreview();
  markTextDirty();
}

function exportActiveFontFamily() {
  const font = ensureActiveFont();
  const familyFonts = getFontsForFamily(font.familyId).map((familyFont) => ({
    ...familyFont,
    updatedAt: familyFont.id === font.id ? new Date().toISOString() : familyFont.updatedAt,
  }));
  const payload = JSON.stringify(
    {
      format: "led-matrix-font-family",
      version: 1,
      familyId: font.familyId,
      familyName: getFontFamilies().find((family) => family.id === font.familyId)?.name || font.familyName,
      exportedAt: new Date().toISOString(),
      fonts: familyFonts,
    },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${font.familyId}-family.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function requestFontImport() {
  controls.fontImportInput.value = "";
  controls.fontImportInput.click();
}

function importFontFile(event) {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(reader.result);
      const fonts = isValidFontFamilyBundle(payload)
        ? payload.fonts.map((font) =>
            normalizeFont({
              ...font,
              familyId: payload.familyId,
              familyName: payload.familyName,
              name: `${payload.familyName} - ${font.metrics?.height || "?"}px`,
            }),
          )
        : [normalizeFont(payload)];

      if (!fonts.every(isValidFont)) {
        throw new Error("Formato de fonte invalido.");
      }

      replaceCustomFontFamily(fonts);
      const font = fonts[0];
      fontLibrary.activeFontId = font.id;
      renderFontFamilyOptions();
      controls.font.value = font.familyId;
      controls.height.value = font.metrics.height;
      controls.letterHeight.value = 100;
      activeFont = font;
      activeFontMode = "exact";
      activeFontIsProjected = false;
      activeSourceFont = font;
      activeFontSignature = `${font.id}:exact:${getSettings().rows}:${font.metrics.height}`;
      saveFontLibrary();
      saveSettings();
      markTextDirty();
      refreshEditorIfOpen();
    } catch (error) {
      window.alert(error.message || "Nao foi possivel importar a fonte.");
    }
  });

  reader.readAsText(file);
}

function refreshEditorIfOpen() {
  if (!controls.editor.hidden) {
    loadEditorCharacter(editorCharacter);
  }
}

function renderTextMap(settings) {
  renderMatrixTextMap(settings);
}

function findFontSizeForTargetHeight(message, family, targetHeight) {
  let bestSize = targetHeight;
  let bestDelta = Infinity;

  for (let size = targetHeight; size <= targetHeight * 3; size += 1) {
    const bounds = getTextBounds(message, family, size);
    const delta = Math.abs(bounds.height - targetHeight);

    if (delta < bestDelta) {
      bestDelta = delta;
      bestSize = size;
    }

    if (bounds.height >= targetHeight) {
      break;
    }
  }

  return bestSize;
}

function getTextBounds(text, family, fontSize) {
  const padding = fontSize;
  fontCtx.font = `700 ${fontSize}px ${family}`;
  const width = Math.max(1, Math.ceil(fontCtx.measureText(text || " ").width + padding * 2));
  const height = Math.max(1, Math.ceil(fontSize * 3));

  fontCanvas.width = width;
  fontCanvas.height = height;
  fontCtx.clearRect(0, 0, width, height);
  fontCtx.fillStyle = "#fff";
  fontCtx.font = `700 ${fontSize}px ${family}`;
  fontCtx.textBaseline = "alphabetic";
  fontCtx.fillText(text || " ", padding, fontSize + padding / 2);

  return findActiveBounds(fontCtx.getImageData(0, 0, width, height).data, width, height);
}

function renderVectorGlyph(char, family, fontSize, targetHeight, textBounds) {
  if (char === " ") {
    return {
      width: Math.max(3, Math.round(targetHeight * 0.38)),
      pixels: Array.from({ length: targetHeight }, () => []),
    };
  }

  const padding = fontSize;
  fontCtx.font = `700 ${fontSize}px ${family}`;
  const canvasWidth = Math.max(1, Math.ceil(fontCtx.measureText(char).width + padding * 2));
  const canvasHeight = Math.max(1, Math.ceil(fontSize * 3));

  fontCanvas.width = canvasWidth;
  fontCanvas.height = canvasHeight;
  fontCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  fontCtx.fillStyle = "#fff";
  fontCtx.font = `700 ${fontSize}px ${family}`;
  fontCtx.textBaseline = "alphabetic";
  fontCtx.fillText(char, padding, fontSize + padding / 2);

  const image = fontCtx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  const bounds = findActiveBounds(image, canvasWidth, canvasHeight);

  if (bounds.width === 0 || bounds.height === 0) {
    return {
      width: Math.max(3, Math.round(targetHeight * 0.38)),
      pixels: Array.from({ length: targetHeight }, () => []),
    };
  }

  const sourceHeight = Math.max(1, textBounds.height);
  const targetWidth = Math.max(1, Math.round((bounds.width * targetHeight) / sourceHeight));
  const pixels = Array.from({ length: targetHeight }, (_, y) =>
    Array.from({ length: targetWidth }, (_, x) => {
      const sourceX = bounds.left + Math.min(bounds.width - 1, Math.floor((x * bounds.width) / targetWidth));
      const sourceY = textBounds.top + Math.min(sourceHeight - 1, Math.floor((y * sourceHeight) / targetHeight));
      return image[(sourceY * canvasWidth + sourceX) * 4 + 3] > 60;
    }),
  );

  return { width: targetWidth, pixels };
}

function findActiveBounds(image, width, height) {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (image[(y * width + x) * 4 + 3] <= 60) {
        continue;
      }

      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(0, right - left + 1),
    height: Math.max(0, bottom - top + 1),
  };
}

function renderMatrixTextMap(settings) {
  const font = ensureActiveFont(settings);
  const chars = [...settings.message].map((char) => getGlyph(font, resolveMatrixChar(font, char)));
  const letterSpacing = font.metrics.defaultLetterSpacing;
  const topOffset = Math.max(0, Math.floor((settings.rows - font.metrics.height) / 2));

  textWidth = chars.reduce((width, glyph) => width + glyph.advance + letterSpacing, letterSpacing);
  textPixels = Array.from({ length: settings.rows }, () => Array.from({ length: textWidth }, () => false));

  let cursor = letterSpacing;
  chars.forEach((glyph) => {
    glyph.rows.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel !== "1") {
          return;
        }

        const targetY = topOffset + glyph.offsetY + y;
        const targetX = cursor + glyph.offsetX + x;

        if (textPixels[targetY]?.[targetX] !== undefined) {
          textPixels[targetY][targetX] = true;
        }
      });
    });

    cursor += glyph.advance + letterSpacing;
  });

  needsTextRender = false;
}

function scaleMatrixGlyph(glyph, targetWidth, targetHeight) {
  const sourceHeight = glyph.length;
  const sourceWidth = glyph[0]?.length || 0;
  const pixels = Array.from({ length: targetHeight }, () => Array.from({ length: targetWidth }, () => false));

  glyph.forEach((row, sourceY) => {
    const startY = Math.round((sourceY * targetHeight) / sourceHeight);
    const endY = Math.round(((sourceY + 1) * targetHeight) / sourceHeight);

    [...row].forEach((pixel, sourceX) => {
      if (pixel !== "1") {
        return;
      }

      const startX = Math.round((sourceX * targetWidth) / sourceWidth);
      const endX = Math.round(((sourceX + 1) * targetWidth) / sourceWidth);

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          if (pixels[y]?.[x] !== undefined) {
            pixels[y][x] = true;
          }
        }
      }
    });
  });

  return pixels;
}

function getLetterHeight(settings) {
  return Math.max(5, Math.min(settings.rows, Math.round(settings.rows * settings.letterHeight)));
}

function resizeCanvas(settings) {
  const pitch = settings.ledSize + settings.gap;
  const width = settings.columns * pitch + settings.gap;
  const height = settings.rows * pitch + settings.gap;
  const ratio = window.devicePixelRatio || 1;
  const nextSignature = `${width}x${height}@${ratio}`;

  if (nextSignature === canvasSignature) {
    return { width, height };
  }

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.aspectRatio = `${width} / ${height}`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  canvasSignature = nextSignature;

  return { width, height };
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function drawLed(x, y, active, rgb, settings) {
  const pitch = settings.ledSize + settings.gap;
  const cx = settings.gap + x * pitch + settings.ledSize / 2;
  const cy = settings.gap + y * pitch + settings.ledSize / 2;
  const radius = settings.ledSize / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);

  if (active) {
    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.74)`;
    ctx.shadowBlur = Math.max(8, settings.ledSize * 1.8);
  } else {
    ctx.fillStyle = "rgba(54, 60, 58, 0.34)";
    ctx.shadowBlur = 0;
  }

  ctx.fill();
  ctx.shadowBlur = 0;
}

function draw(now = 0) {
  const settings = getSettings();
  updateControlReadouts(settings);

  if (needsTextRender) {
    renderTextMap(settings);
  }

  const dimensions = resizeCanvas(settings);

  const rgb = hexToRgb(settings.color);
  const elapsed = Math.min(50, now - lastTime || 16);
  lastTime = now;

  if (settings.mode === "scroll") {
    scrollOffset = (scrollOffset + (settings.speed * elapsed) / 120) % (textWidth + settings.columns);
  } else {
    scrollOffset = Math.max(0, Math.floor((textWidth - settings.columns) / 2));
  }

  ctx.clearRect(0, 0, dimensions.width, dimensions.height);
  ctx.fillStyle = "#060707";
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  for (let y = 0; y < settings.rows; y += 1) {
    for (let x = 0; x < settings.columns; x += 1) {
      const sourceX =
        settings.mode === "scroll"
          ? Math.floor(x + scrollOffset - settings.columns)
          : Math.floor(x - Math.max(0, Math.floor((settings.columns - textWidth) / 2)) + scrollOffset);
      const active = sourceX >= 0 && sourceX < textWidth && textPixels[y]?.[sourceX];
      drawLed(x, y, active, rgb, settings);
    }
  }

  controls.statusDot.style.backgroundColor = settings.color;
  controls.statusDot.style.boxShadow = `0 0 14px ${settings.color}, 0 0 30px ${settings.color}88`;

  animationFrame = requestAnimationFrame(draw);
}

function markTextDirty() {
  needsTextRender = true;
  scrollOffset = 0;
}

function syncNumberBounds(input) {
  input.value = clamp(input.value, input.min, input.max);
}

controls.message.addEventListener("input", () => {
  markTextDirty();
  saveSettings();
});
controls.font.addEventListener("input", () => {
  fontLibrary.activeFontId = null;
  activeFontSignature = "";
  markTextDirty();
  refreshEditorIfOpen();
  saveSettings();
});
controls.letterHeight.addEventListener("input", () => {
  markTextDirty();
  refreshEditorIfOpen();
  saveSettings();
});
controls.letterSpacing.addEventListener("input", () => {
  controls.letterSpacing.value = ensureActiveFont().metrics.defaultLetterSpacing;
});
controls.height.addEventListener("input", () => {
  syncNumberBounds(controls.height);
  markTextDirty();
  refreshEditorIfOpen();
  saveSettings();
});
controls.width.addEventListener("input", () => {
  syncNumberBounds(controls.width);
  markTextDirty();
  saveSettings();
});

[controls.gap, controls.ledSize, controls.color, controls.speed, ...controls.modes].forEach((control) => {
  control.addEventListener("input", () => {
    if (control.name === "mode") {
      scrollOffset = 0;
    }

    saveSettings();
  });
});

controls.editorOpen.addEventListener("click", openGlyphEditor);
controls.editorClose.addEventListener("click", closeGlyphEditor);
controls.editorSave.addEventListener("click", saveEditorCharacter);
controls.editorReset.addEventListener("click", resetEditorCharacter);
controls.editorAddCharacter.addEventListener("click", addEditorCharacter);
controls.editorCopyCharacter.addEventListener("click", copyEditorCharacter);
controls.editorPasteCharacter.addEventListener("click", pasteEditorCharacter);
controls.fontMonospace.addEventListener("change", setFontMonospaceMode);
controls.fontDefaultAdvance.addEventListener("input", updateDefaultAdvance);
controls.fontSaveAs.addEventListener("click", saveActiveFontAs);
controls.fontSaveAsMain.addEventListener("click", saveActiveFontAs);
controls.fontDerive.addEventListener("click", deriveProjectedFont);
controls.guideToggle.addEventListener("click", () => {
  editorGuidesVisible = !editorGuidesVisible;
  syncGuideToggle();
});
controls.editorNewCharacter.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addEditorCharacter();
  }
});
controls.glyphWidth.addEventListener("input", () => resizeGlyphPixels(controls.glyphWidth.value));
controls.glyphAdvance.addEventListener("input", () => updateEditorMetric(controls.glyphAdvance, "advance"));
controls.glyphOffsetX.addEventListener("input", () => updateEditorMetric(controls.glyphOffsetX, "offsetX"));
controls.glyphOffsetY.addEventListener("input", () => updateEditorMetric(controls.glyphOffsetY, "offsetY"));
window.addEventListener("pointerup", () => {
  editorStrokeValue = null;
});
window.addEventListener("pointercancel", () => {
  editorStrokeValue = null;
});
controls.fontBaseline.addEventListener("input", () => updateGlobalFontMetric(controls.fontBaseline, "baseline"));
controls.fontAscent.addEventListener("input", () => updateGlobalFontMetric(controls.fontAscent, "ascent"));
controls.fontDescent.addEventListener("input", () => updateGlobalFontMetric(controls.fontDescent, "descent"));
controls.fontCapHeight.addEventListener("input", () => updateGlobalFontMetric(controls.fontCapHeight, "capHeight"));
controls.fontXHeight.addEventListener("input", () => updateGlobalFontMetric(controls.fontXHeight, "xHeight"));
controls.fontExport.addEventListener("click", exportActiveFontFamily);
controls.fontImport.addEventListener("click", requestFontImport);
controls.fontDelete.addEventListener("click", deleteActiveFont);
controls.fontImportInput.addEventListener("change", importFontFile);
controls.editor.addEventListener("click", (event) => {
  if (event.target === controls.editor) {
    closeGlyphEditor();
  }
});

window.addEventListener("resize", () => {
  resizeEditorGrid();

  if (!animationFrame) {
    draw();
  }
});

restoreSettings();
loadFontLibrary();
renderFontFamilyOptions();
ensureActiveFont();
draw();
