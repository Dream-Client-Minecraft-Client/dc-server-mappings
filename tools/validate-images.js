#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { log, logError } = require("./log");

const FIX_MODE = process.argv.includes("--fix");

function serverName(manifestPath) {
  return path.basename(path.dirname(manifestPath));
}

function getImageDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      const width =
        (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height =
        (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      return { width, height };
    }
    const header = buffer.subarray(0, 8).toString("hex");
    throw new Error(
      `Nieprawidłowy plik PNG (nagłówek: 0x${header}). ` +
        "Przekonwertuj plik na PNG, np. przez ImageMagick: `magick input.jpg output.png`.",
    );
  } catch (error) {
    throw new Error(`Nie można odczytać wymiarów obrazu: ${error.message}`);
  }
}

function resizeWithPowerShell(filePath, width, height) {
  const abs = path.resolve(filePath);
  const tmp = abs + ".tmp.png";
  const script = [
    `Add-Type -AssemblyName System.Drawing`,
    `$src = [System.Drawing.Image]::FromFile('${abs}')`,
    `$bmp = New-Object System.Drawing.Bitmap(${width}, ${height})`,
    `$g = [System.Drawing.Graphics]::FromImage($bmp)`,
    `$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic`,
    `$g.DrawImage($src, 0, 0, ${width}, ${height})`,
    `$g.Dispose()`,
    `$src.Dispose()`,
    `$bmp.Save('${tmp}', [System.Drawing.Imaging.ImageFormat]::Png)`,
    `$bmp.Dispose()`,
    `Move-Item -Force '${tmp}' '${abs}'`,
  ].join("; ");

  const { execSync } = require("child_process");
  execSync(`powershell -NoProfile -Command "${script}"`, { stdio: "pipe" });
}

function checkBackground(filePath) {
  try {
    const { width, height } = getImageDimensions(filePath);
    if (width === 1920 && height === 1080) return true;

    if (FIX_MODE) {
      log("info", `${serverName(filePath)}: tło ${width}x${height} → naprawiam do 1920x1080...`);
      resizeWithPowerShell(filePath, 1920, 1080);
      log("info", `${serverName(filePath)}: tło naprawione ✓`);
      return true;
    }

    const rel = path.relative(process.cwd(), filePath);
    logError(
      `${serverName(filePath)}: nieprawidłowe wymiary tła: ${width}x${height} (wymagane: 1920x1080).`,
      [
        "Jak naprawić: zmień rozmiar obrazu na dokładnie 1920x1080.",
        "",
        "Jak naprawić automatycznie:",
        `  npm run fix`,
      ],
    );
    return false;
  } catch (error) {
    if (FIX_MODE && error.message.includes("Nieprawidłowy plik PNG")) {
      log("info", `${serverName(filePath)}: plik nie jest PNG → konwertuję i skaluję do 1920x1080...`);
      resizeWithPowerShell(filePath, 1920, 1080);
      log("info", `${serverName(filePath)}: tło naprawione ✓`);
      return true;
    }
    const rel = path.relative(process.cwd(), filePath);
    log(
      "error",
      `${serverName(filePath)}: błąd walidacji tła: ${error.message}`,
      [`Wskazówka: upewnij się, że plik istnieje i jest prawidłowym PNG. Uruchom: file "${rel}"`],
    );
    return false;
  }
}

function checkIcon(filePath) {
  try {
    const { width, height } = getImageDimensions(filePath);
    const MIN = 64, MAX = 512;
    if (width >= MIN && width <= MAX && height >= MIN && height <= MAX && width === height)
      return true;

    if (FIX_MODE) {
      const size = Math.min(Math.max(Math.min(width, height), MIN), MAX);
      const snapped = [64, 128, 256, 512].reduce((a, b) =>
        Math.abs(b - size) < Math.abs(a - size) ? b : a,
      );
      log("info", `${serverName(filePath)}: ikona ${width}x${height} → naprawiam do ${snapped}x${snapped}...`);
      resizeWithPowerShell(filePath, snapped, snapped);
      log("info", `${serverName(filePath)}: ikona naprawiona ✓`);
      return true;
    }

    const rel = path.relative(process.cwd(), filePath);
    const lines = [
      `Ikona ma ${width}x${height} (wymagane: kwadrat między ${MIN}x${MIN} a ${MAX}x${MAX}).`,
    ];
    if (width !== height) lines.push("Problem: ikona nie jest kwadratem.");
    if (width < MIN || width > MAX) lines.push("Problem: wymiary ikony są poza dozwolonym zakresem.");
    lines.push(
      "",
      "Jak naprawić: utwórz kwadratowy PNG i zmień jego rozmiar (np. 256x256).",
      "",
      "Jak naprawić automatycznie:",
      `  npm run fix`,
    );
    logError(`${serverName(filePath)}: nieprawidłowe wymiary ikony`, lines);
    return false;
  } catch (error) {
    if (FIX_MODE && error.message.includes("Nieprawidłowy plik PNG")) {
      log("info", `${serverName(filePath)}: plik nie jest PNG → konwertuję i skaluję do 256x256...`);
      resizeWithPowerShell(filePath, 256, 256);
      log("info", `${serverName(filePath)}: ikona naprawiona ✓`);
      return true;
    }
    const rel = path.relative(process.cwd(), filePath);
    log(
      "error",
      `${serverName(filePath)}: błąd walidacji ikony: ${error.message}`,
      [`Wskazówka: upewnij się, że plik istnieje i jest prawidłowym PNG. Uruchom: file "${rel}"`],
    );
    return false;
  }
}

function validateServerAssets(manifestPath) {
  try {
    const entry = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const entryDir = path.dirname(manifestPath);
    const assets = entry.assets;

    // "assets" oraz każde z pól "icon"/"background" wewnątrz są w pełni opcjonalne
    // i niezależne od siebie — serwer może nie mieć żadnego, tylko jeden z nich,
    // albo oba naraz. Walidujemy wymiary/istnienie tylko tego, co faktycznie podano.
    if (!assets) return true;

    let allValid = true;

    if (assets.background) {
      const bgPath = path.join(entryDir, assets.background);
      if (!fs.existsSync(bgPath)) {
        logError(
          `Nie znaleziono tła dla ${serverName(manifestPath)}: ${assets.background}`,
          [
            "Jak naprawić: upewnij się, że ścieżka w manifeście jest poprawna i plik istnieje.",
            '  "assets": { "background": "./bg.png" }',
          ],
        );
        allValid = false;
      } else if (!checkBackground(bgPath)) {
        allValid = false;
      }
    }

    if (assets.icon) {
      const iconPath = path.join(entryDir, assets.icon);
      if (!fs.existsSync(iconPath)) {
        logError(
          `Nie znaleziono ikony dla ${serverName(manifestPath)}: ${assets.icon}`,
          [
            "Jak naprawić: upewnij się, że ścieżka w manifeście jest poprawna i plik istnieje.",
            '  "assets": { "icon": "./icon.png" }',
          ],
        );
        allValid = false;
      } else if (!checkIcon(iconPath)) {
        allValid = false;
      }
    }

    return allValid;
  } catch (error) {
    logError(`Błąd przy sprawdzaniu grafik dla ${serverName(manifestPath)}: ${error.message}`);
    return false;
  }
}

function findServers() {
  const serversDir = path.join(__dirname, "..", "servers");
  const manifests = [];

  function walkDir(dir) {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) walkDir(fullPath);
      else if (file === "manifest.json") manifests.push(fullPath);
    }
  }

  walkDir(serversDir);
  return manifests;
}

function main() {
  const manifestFiles = findServers();
  if (manifestFiles.length === 0) {
    log("error", "Nie znaleziono żadnych plików manifest.json.");
    process.exit(1);
  }

  if (FIX_MODE) log("info", "Tryb --fix: automatyczna naprawa wymiarów obrazów.");

  let allValid = true;
  for (const p of manifestFiles) if (!validateServerAssets(p)) allValid = false;

  if (allValid) {
    log("info", "Wszystkie sprawdzenia grafik zaliczone!");
    process.exit(0);
  }
  process.exit(1);
}

if (require.main === module) main();

module.exports = { validateServerAssets, checkBackground, checkIcon, findServers };