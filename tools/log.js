const COLORS = {
  reset: "\x1b[0m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

function colorFor(level) {
  return COLORS[level] || "";
}

function escapeData(s) {
  return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

function log(level, header, lines = []) {
  const color = colorFor(level);
  const reset = COLORS.reset;
  const prefix = `[${level}] `;

  console.error(color ? `${color}${prefix}${header}${reset}` : prefix + header);
  for (const line of lines) {
    console.error(color ? `${color}${prefix}${line}${reset}` : prefix + line);
  }

  if (isGitHubActions && (level === "error" || level === "warn")) {
    const message = escapeData([header, ...lines].join(" "));
    console.log( level === "error" ? `::error::${message}` : `::warning::${message}`);
  }
}

function logError(title, lines = []) {
  log("error", title, lines);
}
function logWarning(title, lines = []) {
  log("warn", title, lines);
}

module.exports = { log, logError, logWarning };