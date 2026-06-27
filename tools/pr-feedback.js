module.exports = async ({ github, context, core }) => {
  const fs = require("fs");

  let checkOutput = "";
  let assetsOutput = "";

  try {
    checkOutput = fs.readFileSync("validate-output.log", "utf8");
  } catch (_) {
    checkOutput = "Brak wyników sprawdzenia";
  }
  try {
    assetsOutput = fs.readFileSync("images-output.log", "utf8");
  } catch (_) {
    assetsOutput = "Brak wyników sprawdzenia grafik";
  }

  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

  const warnings = checkOutput.match(/\[warn\].*$/gm) || [];
  const errors = checkOutput.match(/\[error\].*$/gm) || [];
  const assetErrors = assetsOutput.match(/\[error\].*$/gm) || [];
  const allErrors = [...new Set([...errors, ...assetErrors])];

  const checkedFolders = process.env.CHECKED_FOLDERS || "N/A";

  let comment = "## 🔍 Wyniki walidacji DC Server Mappings\n\n";

  if (allErrors.length === 0 && warnings.length === 0) {
    comment +=
      "✅ **Wszystkie sprawdzenia zaliczone!** Twój wpis wygląda poprawnie.\n";
  } else {
    if (allErrors.length > 0) {
      comment += "### ❌ Błędy\n\n";
      allErrors.forEach((err) => {
        comment += `- 🔴 ${stripAnsi(err.replace(/\[error\]\s*/, ""))}\n`;
      });
      comment += "\n";
    }
    if (warnings.length > 0) {
      comment += "### ⚠️ Ostrzeżenia\n\n";
      warnings.forEach((warn) => {
        comment += `- 🟡 ${stripAnsi(warn.replace(/\[warn\]\s*/, ""))}\n`;
      });
      comment += "\n";
    }
  }

  comment += "---\n";
  comment += `**Sprawdzone foldery:** \`${checkedFolders}\``;

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });

  const existing = comments.find(
    (c) => c.user.type === "Bot" && c.body.includes("DC Server Mappings"),
  );

  if (existing) {
    core.info("Aktualizuję istniejący komentarz PR");
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body: comment,
    });
  } else {
    core.info("Tworzę nowy komentarz PR");
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: comment,
    });
  }
};