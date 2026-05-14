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
};

const fontCanvas = document.createElement("canvas");
const fontCtx = fontCanvas.getContext("2d", { willReadFrequently: true });

let animationFrame = null;
let lastTime = 0;
let scrollOffset = 0;
let textPixels = [];
let textWidth = 1;
let needsTextRender = true;
let canvasSignature = "";

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || min, min), max);
const normalizeMatrixText = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const matrixFont = {
  " ": ["0000000", "0000000", "0000000", "0000000", "0000000", "0000000", "0000000", "0000000", "0000000"],
  "-": ["0000000", "0000000", "0000000", "0000000", "0111110", "0000000", "0000000", "0000000", "0000000"],
  ".": ["0000000", "0000000", "0000000", "0000000", "0000000", "0000000", "0000000", "0011000", "0011000"],
  "!": ["0011000", "0011000", "0011000", "0011000", "0011000", "0000000", "0011000", "0011000", "0000000"],
  "?": ["0111110", "1000001", "0000001", "0000010", "0001100", "0011000", "0000000", "0011000", "0000000"],
  "0": ["0111110", "1000001", "1000011", "1000101", "1001001", "1010001", "1100001", "1000001", "0111110"],
  "1": ["0011000", "0111000", "0011000", "0011000", "0011000", "0011000", "0011000", "0011000", "1111111"],
  "2": ["0111110", "1000001", "0000001", "0000010", "0001100", "0011000", "0110000", "1000000", "1111111"],
  "3": ["1111110", "0000001", "0000001", "0001110", "0000001", "0000001", "0000001", "1000001", "0111110"],
  "4": ["0000110", "0001110", "0010110", "0100110", "1000110", "1111111", "0000110", "0000110", "0000110"],
  "5": ["1111111", "1000000", "1000000", "1111110", "0000001", "0000001", "0000001", "1000001", "0111110"],
  "6": ["0011110", "0100000", "1000000", "1000000", "1111110", "1000001", "1000001", "1000001", "0111110"],
  "7": ["1111111", "0000001", "0000010", "0000100", "0001000", "0010000", "0100000", "0100000", "0100000"],
  "8": ["0111110", "1000001", "1000001", "1000001", "0111110", "1000001", "1000001", "1000001", "0111110"],
  "9": ["0111110", "1000001", "1000001", "1000001", "0111111", "0000001", "0000001", "0000010", "0111100"],
  A: ["0011100", "0100010", "1000001", "1000001", "1111111", "1000001", "1000001", "1000001", "1000001"],
  B: ["1111110", "1000001", "1000001", "1000001", "1111110", "1000001", "1000001", "1000001", "1111110"],
  C: ["0111110", "1000001", "1000000", "1000000", "1000000", "1000000", "1000000", "1000001", "0111110"],
  D: ["1111100", "1000010", "1000001", "1000001", "1000001", "1000001", "1000001", "1000010", "1111100"],
  E: ["1111111", "1000000", "1000000", "1000000", "1111110", "1000000", "1000000", "1000000", "1111111"],
  F: ["1111111", "1000000", "1000000", "1000000", "1111110", "1000000", "1000000", "1000000", "1000000"],
  G: ["0111110", "1000001", "1000000", "1000000", "1001111", "1000001", "1000001", "1000001", "0111110"],
  H: ["1000001", "1000001", "1000001", "1000001", "1111111", "1000001", "1000001", "1000001", "1000001"],
  I: ["0111110", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000", "0111110"],
  J: ["0001111", "0000010", "0000010", "0000010", "0000010", "0000010", "1000010", "1000010", "0111100"],
  K: ["1000001", "1000010", "1000100", "1001000", "1110000", "1001000", "1000100", "1000010", "1000001"],
  L: ["1000000", "1000000", "1000000", "1000000", "1000000", "1000000", "1000000", "1000000", "1111111"],
  M: ["1000001", "1100011", "1110111", "1011101", "1010101", "1000001", "1000001", "1000001", "1000001"],
  N: ["1000001", "1100001", "1110001", "1011001", "1001101", "1000111", "1000011", "1000001", "1000001"],
  O: ["0111110", "1000001", "1000001", "1000001", "1000001", "1000001", "1000001", "1000001", "0111110"],
  P: ["1111110", "1000001", "1000001", "1000001", "1111110", "1000000", "1000000", "1000000", "1000000"],
  Q: ["0111110", "1000001", "1000001", "1000001", "1000001", "1001001", "1000101", "1000010", "0111101"],
  R: ["1111110", "1000001", "1000001", "1000001", "1111110", "1001000", "1000100", "1000010", "1000001"],
  S: ["0111111", "1000000", "1000000", "1000000", "0111110", "0000001", "0000001", "0000001", "1111110"],
  T: ["1111111", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000"],
  U: ["1000001", "1000001", "1000001", "1000001", "1000001", "1000001", "1000001", "1000001", "0111110"],
  V: ["1000001", "1000001", "1000001", "1000001", "0100010", "0100010", "0010100", "0010100", "0001000"],
  W: ["1000001", "1000001", "1000001", "1000001", "1010101", "1011101", "1110111", "1100011", "1000001"],
  X: ["1000001", "1000001", "0100010", "0010100", "0001000", "0010100", "0100010", "1000001", "1000001"],
  Y: ["1000001", "1000001", "0100010", "0010100", "0001000", "0001000", "0001000", "0001000", "0001000"],
  Z: ["1111111", "0000001", "0000010", "0000100", "0001000", "0010000", "0100000", "1000000", "1111111"],
};

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
  const chars = [...normalizeMatrixText(settings.message)].map((char) => matrixFont[char] || matrixFont["?"]);
  const targetHeight = getLetterHeight(settings);
  const charWidth = Math.max(4, Math.round((targetHeight * 7) / 9));
  const charGap = settings.letterSpacing + Math.max(1, Math.round(charWidth * 0.12));
  const topOffset = Math.max(0, Math.floor((settings.rows - targetHeight) / 2));

  textWidth = chars.reduce((width) => width + charWidth + charGap, 0) + charGap;
  textPixels = Array.from({ length: settings.rows }, () => Array.from({ length: textWidth }, () => false));

  let cursor = charGap;
  chars.forEach((glyph) => {
    for (let y = 0; y < targetHeight; y += 1) {
      const glyphY = Math.min(8, Math.floor((y * 9) / targetHeight));

      for (let x = 0; x < charWidth; x += 1) {
        const glyphX = Math.min(6, Math.floor((x * 7) / charWidth));
        const pixel = glyph[glyphY][glyphX];

        if (pixel !== "1") {
          continue;
        }

        const targetY = topOffset + y;
        const targetX = cursor + x;

        if (textPixels[targetY]?.[targetX] !== undefined) {
          textPixels[targetY][targetX] = true;
        }
      }
    }

    cursor += charWidth + charGap;
  });

  needsTextRender = false;
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

controls.message.addEventListener("input", markTextDirty);
controls.font.addEventListener("input", markTextDirty);
controls.letterHeight.addEventListener("input", markTextDirty);
controls.letterSpacing.addEventListener("input", markTextDirty);
controls.height.addEventListener("input", () => {
  syncNumberBounds(controls.height);
  markTextDirty();
});
controls.width.addEventListener("input", () => {
  syncNumberBounds(controls.width);
  markTextDirty();
});

[controls.gap, controls.ledSize, controls.color, controls.speed, ...controls.modes].forEach((control) => {
  control.addEventListener("input", () => {
    if (control.name === "mode") {
      scrollOffset = 0;
    }
  });
});

window.addEventListener("resize", () => {
  if (!animationFrame) {
    draw();
  }
});

draw();
