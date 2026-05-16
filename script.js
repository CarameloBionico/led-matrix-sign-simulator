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
  font: document.querySelector("#fontInput"),
  color: document.querySelector("#colorInput"),
  speed: document.querySelector("#speedInput"),
  modes: [...document.querySelectorAll("input[name='mode']")],
  statusDot: document.querySelector(".status-dot"),
  editor: document.querySelector("#glyphEditor"),
  editorOpen: document.querySelector("#editorOpenButton"),
  editorClose: document.querySelector("#editorCloseButton"),
  editorCharacterList: document.querySelector("#editorCharacterList"),
  editorGrid: document.querySelector("#editorGrid"),
  editorSizeLabel: document.querySelector("#editorSizeLabel"),
  editorSave: document.querySelector("#editorSaveButton"),
  editorReset: document.querySelector("#editorResetButton"),
};

const fontCanvas = document.createElement("canvas");
const fontCtx = fontCanvas.getContext("2d", { willReadFrequently: true });
const STORAGE_KEY = "ledMatrixSignSettings";
const CUSTOM_GLYPHS_KEY = "ledMatrixCustomGlyphs";

let animationFrame = null;
let lastTime = 0;
let scrollOffset = 0;
let textPixels = [];
let textWidth = 1;
let needsTextRender = true;
let canvasSignature = "";
let customGlyphs = {};
let editorCharacter = "A";
let editorPixels = [];

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || min, min), max);
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

function loadCustomGlyphs() {
  try {
    const storedGlyphs = JSON.parse(localStorage.getItem(CUSTOM_GLYPHS_KEY));
    customGlyphs = storedGlyphs && typeof storedGlyphs === "object" ? storedGlyphs : {};
  } catch {
    customGlyphs = {};
  }
}

function saveCustomGlyphs() {
  try {
    localStorage.setItem(CUSTOM_GLYPHS_KEY, JSON.stringify(customGlyphs));
  } catch {
    // Keep the editor usable even when storage is restricted.
  }
}

function getMatrixGlyphSize(targetHeight) {
  return {
    height: targetHeight,
    width: Math.max(4, Math.round((targetHeight * 5) / 7)),
  };
}

function getCustomGlyphKey(char, targetHeight) {
  const size = getMatrixGlyphSize(targetHeight);
  return `${size.width}x${size.height}:${char}`;
}

function glyphToStrings(glyph) {
  return glyph.map((row) => row.map((active) => (active ? "1" : "0")).join(""));
}

function stringsToGlyph(glyph) {
  return glyph.map((row) => [...row].map((pixel) => pixel === "1"));
}

function getMatrixGlyph(char, targetHeight) {
  const normalizedChar = matrixFont5x7[char] ? char : "?";
  const key = getCustomGlyphKey(normalizedChar, targetHeight);

  if (customGlyphs[key]) {
    return stringsToGlyph(customGlyphs[key]);
  }

  const size = getMatrixGlyphSize(targetHeight);
  return scaleMatrixGlyph(matrixFont5x7[normalizedChar], size.width, size.height);
}

function cloneGlyph(glyph) {
  return glyph.map((row) => [...row]);
}

function openGlyphEditor() {
  controls.editor.hidden = false;
  renderCharacterList();
  loadEditorCharacter(editorCharacter);
}

function closeGlyphEditor() {
  controls.editor.hidden = true;
}

function renderCharacterList() {
  controls.editorCharacterList.replaceChildren(
    ...matrixCharacters.map((char) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `character-button${char === editorCharacter ? " is-active" : ""}`;
      button.textContent = char === " " ? "SP" : char;
      button.setAttribute("aria-label", char === " " ? "Espaco" : `Caractere ${char}`);
      button.addEventListener("click", () => {
        editorCharacter = char;
        renderCharacterList();
        loadEditorCharacter(char);
      });

      return button;
    }),
  );
}

function loadEditorCharacter(char) {
  const settings = getSettings();
  const targetHeight = getLetterHeight(settings);
  const size = getMatrixGlyphSize(targetHeight);

  editorPixels = cloneGlyph(getMatrixGlyph(char, targetHeight));
  controls.editorSizeLabel.textContent = `${char === " " ? "Espaco" : char} ${size.width}x${size.height}`;
  renderEditorGrid();
}

function renderEditorGrid() {
  controls.editorGrid.style.setProperty("--glyph-columns", editorPixels[0]?.length || 1);
  controls.editorGrid.style.setProperty("--glyph-rows", editorPixels.length || 1);
  resizeEditorGrid();
  controls.editorGrid.replaceChildren(
    ...editorPixels.flatMap((row, y) =>
      row.map((active, x) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `glyph-cell${active ? " is-active" : ""}`;
        button.setAttribute("aria-label", `${x + 1},${y + 1}`);
        button.addEventListener("click", () => {
          editorPixels[y][x] = !editorPixels[y][x];
          renderEditorGrid();
        });

        return button;
      }),
    ),
  );
}

function resizeEditorGrid() {
  if (controls.editor.hidden || editorPixels.length === 0) {
    return;
  }

  const panel = controls.editor.querySelector(".glyph-editor-panel");
  const header = controls.editor.querySelector(".glyph-editor-header");
  const actions = controls.editor.querySelector(".editor-actions");
  const columns = editorPixels[0]?.length || 1;
  const rows = editorPixels.length || 1;
  const panelStyle = getComputedStyle(panel);
  const gridStyle = getComputedStyle(controls.editorGrid);
  const gap = parseFloat(gridStyle.columnGap) || 0;
  const panelGap = parseFloat(panelStyle.rowGap) || 0;
  const panelPaddingY = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom);
  const panelPaddingX = parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight);
  const reservedHeight =
    header.offsetHeight + controls.editorCharacterList.offsetHeight + actions.offsetHeight + panelGap * 3 + panelPaddingY + 18;
  const availableHeight = Math.max(90, panel.clientHeight - reservedHeight);
  const availableWidth = Math.max(90, panel.clientWidth - panelPaddingX - 18);
  const cellByHeight = (availableHeight - gap * (rows - 1)) / rows;
  const cellByWidth = (availableWidth - gap * (columns - 1)) / columns;
  const cellSize = Math.max(12, Math.floor(Math.min(cellByHeight, cellByWidth, 54)));

  controls.editorGrid.style.setProperty("--glyph-cell-size", `${cellSize}px`);
}

function saveEditorCharacter() {
  const targetHeight = getLetterHeight(getSettings());
  const key = getCustomGlyphKey(editorCharacter, targetHeight);
  customGlyphs[key] = glyphToStrings(editorPixels);
  saveCustomGlyphs();
  markTextDirty();
}

function resetEditorCharacter() {
  const targetHeight = getLetterHeight(getSettings());
  const key = getCustomGlyphKey(editorCharacter, targetHeight);
  delete customGlyphs[key];
  saveCustomGlyphs();
  loadEditorCharacter(editorCharacter);
  markTextDirty();
}

function refreshEditorIfOpen() {
  if (!controls.editor.hidden) {
    loadEditorCharacter(editorCharacter);
  }
}

function renderTextMap(settings) {
  if (settings.font === "matrix") {
    renderMatrixTextMap(settings);
    return;
  }

  const family = {
    system: "Arial, sans-serif",
    mono: '"Courier New", monospace',
    serif: "Georgia, serif",
  }[settings.font];
  const targetHeight = getLetterHeight(settings);
  const fontSize = findFontSizeForTargetHeight(settings.message, family, targetHeight);
  const textBounds = getTextBounds(settings.message, family, fontSize);
  const glyphs = [...settings.message].map((char) => renderVectorGlyph(char, family, fontSize, targetHeight, textBounds));
  const spacing = settings.letterSpacing + 1;

  textWidth = glyphs.reduce((width, glyph) => width + glyph.width + spacing, spacing);
  textPixels = Array.from({ length: settings.rows }, () => Array.from({ length: textWidth }, () => false));

  const topOffset = Math.max(0, Math.floor((settings.rows - targetHeight) / 2));
  let cursor = spacing;

  glyphs.forEach((glyph) => {
    glyph.pixels.forEach((row, y) => {
      row.forEach((active, x) => {
        if (active && textPixels[topOffset + y]?.[cursor + x] !== undefined) {
          textPixels[topOffset + y][cursor + x] = true;
        }
      });
    });
    cursor += glyph.width + spacing;
  });

  needsTextRender = false;
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
  const targetHeight = getLetterHeight(settings);
  const size = getMatrixGlyphSize(targetHeight);
  const chars = [...normalizeMatrixText(settings.message)].map((char) => getMatrixGlyph(char, targetHeight));
  const charWidth = size.width;
  const charGap = settings.letterSpacing + Math.max(1, Math.round(charWidth * 0.12));
  const topOffset = Math.max(0, Math.floor((settings.rows - targetHeight) / 2));

  textWidth = chars.reduce((width) => width + charWidth + charGap, 0) + charGap;
  textPixels = Array.from({ length: settings.rows }, () => Array.from({ length: textWidth }, () => false));

  let cursor = charGap;
  chars.forEach((glyph) => {
    glyph.forEach((row, y) => {
      row.forEach((active, x) => {
        if (!active) {
          return;
        }

        const targetY = topOffset + y;
        const targetX = cursor + x;

        if (textPixels[targetY]?.[targetX] !== undefined) {
          textPixels[targetY][targetX] = true;
        }
      });
    });

    cursor += charWidth + charGap;
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
  markTextDirty();
  saveSettings();
});
controls.letterHeight.addEventListener("input", () => {
  markTextDirty();
  refreshEditorIfOpen();
  saveSettings();
});
controls.letterSpacing.addEventListener("input", () => {
  markTextDirty();
  saveSettings();
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
loadCustomGlyphs();
draw();
