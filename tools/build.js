#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { log, logError } = require("./log");

function buildOutput() {
  const serversDir = path.join(__dirname, "..", "servers");
  const outputDir = path.join(__dirname, "..", "dist");
  const outputPath = path.join(outputDir, "dc-mappings.json");

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  log("info", "Skanuję katalog servers...");

  const entryFolders = fs
    .readdirSync(serversDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => n !== "dist");

  log( "info", `Znalezione wpisy (${entryFolders.length}): ${entryFolders.join(", ")}`);

  const output = {
    servers: {},
    metadata: {
      totalServers: 0,
      builtAt: new Date().toISOString(),
      sourceFolders: entryFolders,
    },
  };

  let processedCount = 0;
  let errorCount = 0;

  for (const folderName of entryFolders) {
    const folderPath = path.join(serversDir, folderName);
    const manifestPath = path.join(folderPath, "manifest.json");

    try {
      if (!fs.existsSync(manifestPath)) {
        log("warn", `Brak manifest.json w ${folderName}`);
        continue;
      }

      const entry = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      if (!entry.id || !entry.name || !entry.addresses || !entry.categories) {
        log( "warn", `Nieprawidłowy manifest w ${folderName}: brakujące wymagane pola`);
        errorCount++;
        continue;
      }

      const processed = copyAssets(entry, folderName, folderPath, outputDir);
      output.servers[entry.id] = processed;
      processedCount++;
      log("info", `Przetworzono ${folderName} (id: ${entry.id})`);
    } catch (error) {
      logError(`Błąd podczas przetwarzania ${folderName}:`, [error.message]);
      errorCount++;
    }
  }

  output.metadata.totalServers = processedCount;
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  log("info", "Podsumowanie:");
  log("info", `Przetworzone: ${processedCount}`);
  log("info", `Błędy: ${errorCount}`);
  log("info", `Wynik: ${outputPath}`);

  return { success: processedCount, errors: errorCount, outputPath };
}

function copyAssets(entry, folderName, sourceFolderPath, outputDir) {
  const processed = { ...entry };
  if (!entry.assets) return processed;

  const assetsDir = path.join(outputDir, "assets", folderName);
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  if (entry.assets.icon) {
    const src = path.join(
      sourceFolderPath,
      entry.assets.icon.replace("./", ""),
    );
    const dest = path.join(assetsDir, "icon.png");
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      processed.assets = {
        ...processed.assets,
        icon: `./assets/${folderName}/icon.png`,
      };
    }
  }

  if (entry.assets.background) {
    const src = path.join(
      sourceFolderPath,
      entry.assets.background.replace("./", ""),
    );
    const dest = path.join(assetsDir, "background.png");
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      processed.assets = {
        ...processed.assets,
        background: `./assets/${folderName}/background.png`,
      };
    }
  }

  return processed;
}

function validateOutput(outputPath) {
  try {
    const data = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    log("info", "Walidacja pliku wynikowego...");
    let isValid = true;

    for (const [serverId, serverData] of Object.entries(data.servers)) {
      if (!serverData.id) {
        log("error", `${serverId}: Brak id`);
        isValid = false;
      }
      if (!serverData.name) {
        log("error", `${serverId}: Brak name`);
        isValid = false;
      }
      if (!serverData.addresses || !serverData.addresses[0]) {
        log("error", `${serverId}: Brak addresses`);
        isValid = false;
      }
      if (!serverData.categories || !serverData.categories[0]) {
        log("error", `${serverId}: Brak categories`);
        isValid = false;
      }
      if (!serverData.assets?.icon || !serverData.assets?.background) {
        log("error", `${serverId}: Brak wymaganych zasobów graficznych`);
        isValid = false;
      }
    }

    if (isValid) log("info", "Walidacja pliku wynikowego zakończona pomyślnie");
  } catch (error) {
    logError("Błąd walidacji pliku wynikowego:", [error.message]);
  }
}

if (require.main === module) {
  log("info", "Rozpoczynam budowanie...\n");
  const result = buildOutput();
  if (result.success > 0) {
    log("info", "\nBudowanie zakończone pomyślnie!");
    validateOutput(result.outputPath);
  } else {
    log("error", "\nŻaden wpis nie został poprawnie przetworzony");
    process.exit(1);
  }
}

module.exports = { buildOutput, validateOutput };