import fs from "fs";

// Odczyt pliku - upewnij się, że ścieżka jest poprawna względem miejsca uruchomienia
const csv = fs.readFileSync("data/schedule.csv", "utf-8").trim();
const lines = csv.split("\n");
const header = lines[0].split(",");
const rows = lines.slice(1);

// build.js - fragment generujący treść
let content = `---
title: Harmonogram parzenia kawy
---

<div class="j33-description">
  <p>☕ <strong>Wieczna Pauza:</strong> Nowe odcinki zazwyczaj pojawiają się o 16:00.</p>
  <p>🔴 <strong>Na żywo:</strong> Transmisje LIVE ogłaszam w zakładce Społeczność – tam kawa smakuje najlepiej wspólnie.</p>
  <p style="font-size: 0.85em; opacity: 0.8;"><em>Pamiętaj: Plan to tylko zarys. Czasem taktyka wymaga korekty w trakcie tury.</em></p>
</div>

<table class="schedule">
<thead>
  <tr><th>Data</th><th>Seria</th><th>Odcinek</th><th>Typ</th></tr>
</thead>
<tbody>
`;

rows.forEach(line => {
  const values = line.match(/(".*?"|[^",]+|(?<=,)(?=,)|(?<=,)$)/g)
    .map(v => v.replace(/^"|"$/g, "").trim());  
  
  const row = Object.fromEntries(header.map((c, i) => [c.trim(), values[i]]));
  
  // Pobieramy status, zamieniamy na małe litery i usuwamy zbędne spacje
  const statusValue = row.status?.toLowerCase().trim() || "film";

  // Klasa CSS będzie generowana dynamicznie (np. type-live, type-premiera, type-film)
  //const typeClass = statusValue; 
  const typeClass = statusValue.replace(/\s+/g, ''); // usuwa spacje, np "rzut oka"

  // W samym generowaniu HTML używamy switcha lub prostego mapowania dla ikon:
  const statusIcons = {
    "live": "🔴 Live",
    "premiera": "💎 Premiera",
    "film": "🎬 Film",
    "short": "📱 Short",
	"rzutoka": "👁️ Rzut oka",
	"techniczne": "🔧 Techniczne",
	"ciekawostki": "💡 Ciekawostka"	
  };
  const displayStatus = statusIcons[statusValue] || "🎬 Film";

//  content += `
//  <tr class="type-${typeClass}">
//    <td class="date-cell">${row.date || ""}</td>
//    <td>${row.series || ""}</td>
//    <td>${row.title || ""}</td>
//    <td class="status-cell">${displayStatus}</td>
//  </tr>`;
content += `
<tr class="type-${typeClass}">
  <td class="date-cell">${row.date || ""}</td>
  <td>${row.series || ""}</td>
  <td>${row.title || ""}</td>
  <td class="status-cell">${statusIcons[statusValue] || "🎬 Film"}</td>
</tr>`;


});

content += `</tbody></table>`;
fs.writeFileSync("./content/schedule.md", content);
