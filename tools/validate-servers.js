#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

const rootSchemaPath = path.join(
  __dirname,
  "..",
  "servers",
  "manifest-schema.json",
);
const rootSchema = JSON.parse(fs.readFileSync(rootSchemaPath, "utf8"));

const { log, logError, logWarning } = require("./log");

function serverName(manifestPath) {
  return path.basename(path.dirname(manifestPath));
}

function getSnippetAroundIndex(text, index, contextLines = 2) {
  const lines = text.split(/\r?\n/);
  index = Math.max(0, Math.min(index || 0, text.length));
  let charCount = 0;
  let lineNum = 0;
  for (; lineNum < lines.length; lineNum++) {
    const next = charCount + lines[lineNum].length + 1;
    if (index < next) break;
    charCount = next;
  }
  const start = Math.max(0, lineNum - contextLines);
  const end = Math.min(lines.length - 1, lineNum + contextLines);
  const snippet = lines
    .slice(start, end + 1)
    .map((l, i) => `${String(start + i + 1).padStart(4)} | ${l}`)
    .join("\n");
  return { line: lineNum + 1, snippet };
}

function getLineAndColumnFromIndex(text, index) {
  const lines = text.split(/\r?\n/);
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const len = lines[i].length + 1;
    if (index < count + len)
      return { line: i + 1, column: index - count + 1, lineText: lines[i] };
    count += len;
  }
  return {
    line: lines.length,
    column: lines[lines.length - 1].length,
    lineText: lines[lines.length - 1],
  };
}

function findPropertySnippet(entryText, instancePath) {
  if (!instancePath || instancePath === "") return null;
  const prop = instancePath.split("/").filter(Boolean).pop();
  if (!prop) return null;
  const escaped = prop.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`"${escaped}"\\s*:`, "i");
  const match = entryText.match(regex);
  if (!match) return null;
  return getSnippetAroundIndex(entryText, match.index || 0, 2);
}

function suggestFix(error) {
  const suggestions = [];
  switch (error.keyword) {
    case "enum":
      if (error.params?.allowedValues)
        suggestions.push( `Dozwolone wartości: ${JSON.stringify(error.params.allowedValues)}`);
      suggestions.push(
        "Poprawka: wybierz jedną z dozwolonych wartości (sprawdź pisownię i wielkość liter).",
      );
      break;
    case "required":
      if (error.params?.missingProperty)
        suggestions.push(`Brakujące pole: ${error.params.missingProperty}`);
      suggestions.push( "Poprawka: dodaj brakujące pole z odpowiednią wartością.");
      break;
    case "type":
      if (error.params?.type)
        suggestions.push(`Oczekiwany typ: ${error.params.type}`);
      suggestions.push( "Poprawka: upewnij się, że wartość ma właściwy typ JSON.");
      break;
    case "additionalProperties":
      if (error.params?.additionalProperty)
        suggestions.push(
          `Nieoczekiwane pole: ${error.params.additionalProperty}`,
        );
      suggestions.push("Poprawka: usuń lub zmień nazwę tego pola.");
      break;
    case "pattern":
      suggestions.push( "Poprawka: upewnij się, że wartość pasuje do wymaganego wzorca.");
      if (error.instancePath.includes("id"))
        suggestions.push( "Pole id musi składać się z małych liter, cyfr i myślników (np. moj-serwer).");
      if (error.instancePath.includes("languages"))
        suggestions.push( "Kody języków muszą mieć 2 duże litery, np. PL, EN, DE.");
      break;
    default:
      suggestions.push( "Poprawka: zapoznaj się z regułą schematu i dostosuj manifest.");
  }
  suggestions.push("Wskazówka: po edycji uruchom `npm run validate` ponownie.");
  return suggestions;
}

function validateManifest(manifestPath, schemaPath = null) {
  const rel = path.relative(process.cwd(), manifestPath).replace(/\\/g, '/');
  if (!rel.match(/^[a-z0-9/._-]+$/)) {
    const badChars = [...rel]
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => !c.match(/[a-z0-9/._-]/));
    const details = badChars.map(({ c, i }) => {
        const segments = rel.split(/[/\\]/);
        let pos = 0;
        let segIdx = 0;
        for (let s = 0; s < segments.length; s++) {
            if (i < pos + segments[s].length) { segIdx = s; break; }
            pos += segments[s].length + 1;
        }
        const col = i - pos + 1;
        return `  znak '${c}' (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')}) w segmencie ${segIdx + 1} ("${segments[segIdx]}"), pozycja ${col}`;
    }).join("\n");
    log("error", `${rel}: Niedozwolone znaki w ścieżce:\n${details}`);
    return false;
  }

  let entryText;
  try {
    entryText = fs.readFileSync(manifestPath, "utf8");
  } catch (err) {
    log("error", `${rel}: Nie można odczytać pliku: ${err.message}`);
    return false;
  }

  let entry;
  try {
    entry = JSON.parse(entryText);
  } catch (err) {
    const msg = err?.message ?? String(err);
    const posMatch = msg.match(/position\s*(\d+)/i);
    let pos = posMatch ? parseInt(posMatch[1], 10) : null;
    if (pos === null) {
      const trailing = entryText.match(/,\s*[\]\}]/);
      if (trailing && typeof trailing.index === "number") pos = trailing.index;
    }
    if (pos !== null) {
      const { line, column } = getLineAndColumnFromIndex(entryText, pos);
      const lines = entryText.split(/\r?\n/);
      const start = Math.max(0, line - 3);
      const end = Math.min(lines.length - 1, line + 1);
      const snippetLines = [];
      for (let i = start; i <= end; i++) {
        const prefix = `${String(i + 1).padStart(3)} | `;
        snippetLines.push(prefix + lines[i]);
        if (i === line - 1)
          snippetLines.push(
            " ".repeat(prefix.length + Math.max(0, column - 1)) + "^",
          );
      }
      snippetLines.push( "", "Wskazówka: sprawdź przecinki na końcu, brakujące cudzysłowy lub nieprawidłowe nawiasy.");
      log( "error", `${rel}: SyntaxError: ${msg} (${line}:${column})`, snippetLines);
    } else {
      logError(`Błąd składni JSON w ${rel}: ${msg}`, [
        "JSON jest nieprawidłowy. Najczęstsze przyczyny: przecinki na końcu, brakujące cudzysłowy lub obce znaki.",
      ]);
    }
    return false;
  }

  const schema = schemaPath ? JSON.parse(fs.readFileSync(schemaPath, "utf8")) : rootSchema;
  const validate = ajv.compile(schema);
  const valid = validate(entry);

  if (!valid) {
    logError(`Walidacja nieudana dla ${rel}:`, []);
    validate.errors.forEach((error) => {
      const pathString = error.instancePath || "/";
      const lines = [`${pathString}: ${error.message}`];
      const snippetInfo = findPropertySnippet(entryText, error.instancePath);
      if (snippetInfo)
        lines.push(
          "",
          `kod (okolice linii ${snippetInfo.line}):`,
          ...snippetInfo.snippet.split("\n"),
        );
      const suggestions = suggestFix(error);
      if (suggestions.length)
        lines.push("", "sugestie:", ...suggestions.map((s) => `  - ${s}`));
      logError(`  ${pathString}`, lines);
    });
    return false;
  }

  // Dodatkowe sprawdzenie: id musi zgadzać się z nazwą folderu
  const folderName = path.basename(path.dirname(manifestPath));
  if (entry.id !== folderName) {
    logError(
      `${rel}: Pole "id" (${entry.id}) musi zgadzać się z nazwą folderu (${folderName}).`,
      [`Poprawka: zmień nazwę folderu lub ustaw id na "${folderName}".`],
    );
    return false;
  }

  return true;
}

function validateServerAssets(manifestPath) {
  try {
    const entry = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const entryDir = path.dirname(manifestPath);
    const assets = entry.assets;

    // "assets" jest w pełni opcjonalne, tak samo jak "icon" i "background" osobno —
    // serwer może nie mieć żadnych zasobów wizualnych, tylko jeden z nich, albo oba.
    if (!assets) return true;

    let allValid = true;

    for (const [key, relPath] of Object.entries(assets)) {
      const absPath = path.join(entryDir, relPath);
      if (!fs.existsSync(absPath)) {
        logError( `Zasób "${key}" nie znaleziony dla ${serverName(manifestPath)}: ${relPath}`);
        allValid = false;
      }
    }

    return allValid;
  } catch (_) {
    return false;
  }
}

async function checkServerOnline(manifestPath) {
  try {
    const entry = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const name = serverName(manifestPath);
    const addresses = entry.addresses;

    if (!addresses || addresses.length === 0) return true;

    const address = addresses[0];
    const apiUrl = `https://api.mcsrvstat.us/3/${encodeURIComponent(address)}`;

    try {
      const https = require("https");
      const response = await new Promise((resolve, reject) => {
        const req = https.get(
          apiUrl,
          { headers: { "User-Agent": "DC-Server-Mappings-Checker/1.0" } },
          (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          },
        );
        req.on("error", reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error("Timeout żądania"));
        });
      });

      if (!response.online) {
        logWarning(`Serwer ${name} (${address}) wydaje się być OFFLINE`, [
          "To tylko ostrzeżenie — walidacja jest kontynuowana.",
          "Serwer może być chwilowo niedostępny lub w konserwacji.",
        ]);
      } else {
        const maintenanceKeywords = [
          "maintenance",
          "konserwacja",
          "downtime",
          "offline",
          "updating",
          "restart",
          "restarting",
        ];
        let motdText = "";
        if (response.motd?.clean)
          motdText = response.motd.clean.join(" ").toLowerCase();
        else if (response.motd?.raw)
          motdText = response.motd.raw.join(" ").toLowerCase();

        const found = maintenanceKeywords.filter((kw) => motdText.includes(kw));
        if (found.length > 0) {
          logWarning(
            `Serwer ${name} (${address}) może być w trybie KONSERWACJI`,
            [
              `MOTD zawiera: ${found.join(", ")}`,
              `MOTD: ${response.motd?.clean?.join(" | ") ?? "N/A"}`,
            ],
          );
        }
      }
    } catch (error) {
      logWarning(`Nie można sprawdzić statusu serwera ${name} (${address})`, [
        `Błąd: ${error.message}`,
        "Może to być chwilowy problem sieciowy — walidacja jest kontynuowana.",
      ]);
    }
  } catch (_) {}
  return true;
}

function findServers() {
  const serversDir = path.join(__dirname, "..", "servers");
  const manifests = [];
  const missing = [];

  for (const entry of fs.readdirSync(serversDir)) {
    const fullPath = path.join(serversDir, entry);
    if (!fs.statSync(fullPath).isDirectory()) continue;
    const manifestPath = path.join(fullPath, "manifest.json");
    if (fs.existsSync(manifestPath)) manifests.push(manifestPath);
    else missing.push(entry);
  }

  return { manifests, missing };
}

async function main() {
  const args = process.argv.slice(2);
  const foldersArg = args.find((a) => a.startsWith("--folders="));
  let filterFolders = null;

  if (foldersArg) {
    const list = foldersArg.split("=")[1];
    if (list) {
      filterFolders = list
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      log( "info", `Sprawdzam tylko wskazane foldery: ${filterFolders.join(", ")}`);
    }
  }

  const { manifests: allManifests, missing: missingManifests } = findServers();

  let manifestFiles = allManifests;
  if (filterFolders?.length) {
    manifestFiles = allManifests.filter((p) =>
      filterFolders.includes(path.basename(path.dirname(p))),
    );
    if (manifestFiles.length === 0) {
      log("info", "Nie znaleziono pasujących folderów do sprawdzenia.");
      process.exit(0);
    }
  }

  if (manifestFiles.length === 0 && missingManifests.length === 0) {
    log("error", "Nie znaleziono żadnych plików manifest.json.");
    process.exit(1);
  }

  let allValid = true;

  const relevantMissing = filterFolders
    ? missingManifests.filter((d) => filterFolders.includes(d))
    : missingManifests;
  for (const dirName of relevantMissing) {
    logError(`Brak manifest.json dla wpisu: ${dirName}`);
    allValid = false;
  }

  for (const manifestPath of manifestFiles) {
    const entryDir = path.dirname(manifestPath);
    const localSchema = path.join(entryDir, "manifest-schema.json");
    const schemaPath = fs.existsSync(localSchema) ? localSchema : null;

    const entryValid = validateManifest(manifestPath, schemaPath);
    const assetsValid = validateServerAssets(manifestPath);
    await checkServerOnline(manifestPath);

    if (!entryValid || !assetsValid) allValid = false;
  }

  if (allValid) {
    log("info", "Wszystkie sprawdzenia zaliczone!");
    process.exit(0);
  }
  process.exit(1);
}

if (require.main === module) {
  main().catch((error) => {
    log("error", `Nieoczekiwany błąd: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  validateManifest,
  validateServerAssets,
  checkServerOnline,
  findServers,
};