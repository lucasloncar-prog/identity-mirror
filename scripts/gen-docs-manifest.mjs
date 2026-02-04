import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const documentsDir = path.join(projectRoot, "public", "documents");
const manifestPath = path.join(documentsDir, "manifest.json");

function titleFromFilename(filename) {
  const base = filename.replace(/\.pdf$/i, "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*\d+\s*\)\s*$/, "")
    .trim();
}

async function main() {
  const entries = await fs.readdir(documentsDir, { withFileTypes: true });

  const pdfFiles = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  const manifest = {
    documents: pdfFiles.map((file) => ({
      title: titleFromFilename(file),
      file,
    })),
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  process.stdout.write(
    `Wrote ${manifest.documents.length} document(s) to ${path.relative(projectRoot, manifestPath)}\n`
  );
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + "\n");
  process.exitCode = 1;
});
