// build.js — generuje content/schedule.md z data/schedule.csv
// ES module (import) — wymagane gdy package.json ma "type": "module"
// Uruchomienie: node scripts/build.js  (z głównego folderu repo)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname nie istnieje w ES modules — odtwarzamy go
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");   // folder główny repo (nad scripts/)

// ── Ścieżki ───────────────────────────────────────────────────────────────────
const CSV_PATH = path.join(ROOT, "data", "schedule.csv");
const OUT_PATH = path.join(ROOT, "content", "schedule.md");

// ── Ikony statusów ────────────────────────────────────────────────────────────
const STATUS_ICONS = {
  "live":        "🔴 Live",
  "premiera":    "💎 Premiera",
  "film":        "🎬 Seria",
  "short":       "📱 Short",
  "rzutoka":     "👁️ Rzut oka",
  "techniczne":  "🔧 Techniczne",
  "ciekawostki": "💡 Ciekawostka",
};

// ── Parser CSV ────────────────────────────────────────────────────────────────
function splitCSVLine(line) {
  const cols = []; let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cols.push(cur.trim()); cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) throw new Error("CSV ma mniej niż 2 linie");
  const header = lines[0].split(",").map(h => h.trim());
  return lines.slice(1)
    .filter(line => line.trim() !== "")
    .map((line, idx) => {
      const cols = splitCSVLine(line);
      if (cols.length !== header.length) {
        console.warn(`  ⚠ Linia ${idx + 2}: oczekiwano ${header.length} kolumn, jest ${cols.length} — pomijam`);
        return null;
      }
      return Object.fromEntries(header.map((h, i) => [h, cols[i]]));
    })
    .filter(Boolean);
}

// ── Generator Markdown ────────────────────────────────────────────────────────
function generateMarkdown(rows) {
  const now = new Date().toLocaleDateString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  let md = `---
title: Harmonogram
tags: []
---

<div class="j33-description">
  <p>☕ <strong>Nowe odcinki</strong> zazwyczaj pojawiają się o 16:00.</p>
  <p>🔴 <strong>Na żywo:</strong> Transmisje LIVE ogłaszam w zakładce Społeczność.</p>
  <p style="font-size:0.85em;opacity:0.7;"><em>Plan to tylko zarys — czasem taktyka wymaga korekty w trakcie tury.</em></p>
  <p style="font-size:0.8em;opacity:0.5;">Ostatnia aktualizacja: ${now}</p>
</div>

<table class="schedule">
<thead>
  <tr><th>Data</th><th>Seria</th><th>Odcinek</th><th>Typ</th></tr>
</thead>
<tbody>
`;

  for (const row of rows) {
    const statusRaw = (row.status || "film").toLowerCase().trim();
    const typeClass = statusRaw.replace(/\s+/g, "");
    const icon      = STATUS_ICONS[typeClass] || "🎬 Film";
    md += `<tr class="type-${typeClass}">
  <td class="date-cell">${row.date   || ""}</td>
  <td>${row.series || ""}</td>
  <td>${row.title  || ""}</td>
  <td class="status-cell">${icon}</td>
</tr>\n`;
  }

  md += `</tbody></table>\n`;
  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────────
try {
  console.log(`→ Czytam: ${CSV_PATH}`);
  if (!fs.existsSync(CSV_PATH)) throw new Error(`Plik nie istnieje: ${CSV_PATH}`);

  const rows = parseCSV(fs.readFileSync(CSV_PATH, "utf-8"));
  console.log(`  ✓ Wczytano ${rows.length} wierszy`);

  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUT_PATH, generateMarkdown(rows), "utf-8");
  console.log(`  ✓ Zapisano: ${OUT_PATH}`);
} catch (err) {
  console.error(`✗ Błąd: ${err.message}`);
  process.exit(1);
}
