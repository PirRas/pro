/* =========================================================
   KANTISPORTS HUB – script.js (VOLLSTAENDIG)
   Features:
   - Neue Sportarten hinzufuegen (dynamische Tabs + Seiten)
   - Spieler Rollen: student / teacher
   - Allgemeine Stats (AOTK Grundlage)
   - AOTK Students, AOTK Teacher, AOTK Gesamt (nur allgemeine Stats)
   - Sport Overall nutzt allgemeine + sportbezogene Stats
   - Vergleich nutzt allgemeine + sportbezogene Stats
   ========================================================= */

/* =========================
   1) Allgemeine Stats (AOTK Grundlage)
   ========================= */
var GENERAL_STATS = ["pace", "physic", "jump", "endurance", "coordination"];

/* AOTK Gewichte (nur allgemeine Stats) */
var AOTK_WEIGHTS = {
  pace: 0.2,
  physic: 0.2,
  jump: 0.2,
  endurance: 0.2,
  coordination: 0.2
};

/* =========================
   2) Sportarten Konfiguration
   ========================= */
var SPORTS = {
  basketball: {
    label: "Basketball",
    sportStats: ["points", "assists", "rebounds"],
    weights: { points: 0.5, assists: 0.3, rebounds: 0.2 },
    generalWeight: 0.35
  },
  volleyball: {
    label: "Volleyball",
    sportStats: ["spikes", "blocks", "aces"],
    weights: { spikes: 0.5, blocks: 0.3, aces: 0.2 },
    generalWeight: 0.35
  },
  fussball: {
    label: "Fussball",
    sportStats: ["goals", "assists", "tackles"],
    weights: { goals: 0.5, assists: 0.3, tackles: 0.2 },
    generalWeight: 0.35
  }
};

/* =========================
   3) Spieler Daten (Demo)
   ========================= */
var players = [
  {
    id: "bb_1",
    sport: "basketball",
    role: "student",
    name: "Noah Keller",
    image: "",
    general: { pace: 80, physic: 70, jump: 75, endurance: 78, coordination: 72 },
    stats: { points: 21, assists: 6, rebounds: 7 }
  },
  {
    id: "bb_2",
    sport: "basketball",
    role: "teacher",
    name: "Luca Steiner",
    image: "",
    general: { pace: 72, physic: 76, jump: 68, endurance: 74, coordination: 78 },
    stats: { points: 16, assists: 8, rebounds: 5 }
  },
  {
    id: "vb_1",
    sport: "volleyball",
    role: "student",
    name: "Mila Frei",
    image: "",
    general: { pace: 74, physic: 68, jump: 82, endurance: 70, coordination: 80 },
    stats: { spikes: 12, blocks: 3, aces: 2 }
  },
  {
    id: "fb_1",
    sport: "fussball",
    role: "student",
    name: "Amir Ajeti",
    image: "",
    general: { pace: 84, physic: 73, jump: 70, endurance: 82, coordination: 76 },
    stats: { goals: 10, assists: 5, tackles: 20 }
  }
];

/* =========================
   4) Global State
   ========================= */
var compareMode = false;
var comparePick = [];  // IDs, max 2
var activePage = "start";

/* =========================
   5) DOM Elemente holen
   ========================= */
var tabbar = document.getElementById("tabbar");

var compareModeBtn = document.getElementById("compareModeBtn");
var openAddPlayerBtn = document.getElementById("openAddPlayerBtn");
var openAddSportBtn = document.getElementById("openAddSportBtn");

var ctaAOTK = document.getElementById("ctaAOTK");
var ctaFirstSport = document.getElementById("ctaFirstSport");

var metricPlayers = document.getElementById("metricPlayers");
var metricSports = document.getElementById("metricSports");

var sportPagesMount = document.getElementById("sportPagesMount");

/* AOTK */
var aotkStudentsPanel = document.getElementById("aotkStudentsPanel");
var aotkTeacherPanel = document.getElementById("aotkTeacherPanel");
var aotkOverallPanel = document.getElementById("aotkOverallPanel");
var aotkRanking = document.getElementById("aotkRanking");

/* Modals */
var detailModal = document.getElementById("detailModal");
var closeDetailBtn = document.getElementById("closeDetailBtn");
var detailContent = document.getElementById("detailContent");

var compareModal = document.getElementById("compareModal");
var closeCompareBtn = document.getElementById("closeCompareBtn");
var compareContent = document.getElementById("compareContent");

var addPlayerModal = document.getElementById("addPlayerModal");
var closeAddPlayerBtn = document.getElementById("closeAddPlayerBtn");
var savePlayerBtn = document.getElementById("savePlayerBtn");
var addPlayerHint = document.getElementById("addPlayerHint");

/* Add Player Inputs */
var newRole = document.getElementById("newRole");
var newSport = document.getElementById("newSport");
var newName = document.getElementById("newName");
var newImage = document.getElementById("newImage");
var generalStatFields = document.getElementById("generalStatFields");
var sportStatFields = document.getElementById("sportStatFields");

/* Add Sport Modal */
var addSportModal = document.getElementById("addSportModal");
var closeAddSportBtn = document.getElementById("closeAddSportBtn");
var sportNameInput = document.getElementById("sportNameInput");
var sportKeyInput = document.getElementById("sportKeyInput");
var addSportStatBtn = document.getElementById("addSportStatBtn");
var resetSportStatBtn = document.getElementById("resetSportStatBtn");
var sportStatDefFields = document.getElementById("sportStatDefFields");
var saveSportBtn = document.getElementById("saveSportBtn");
var addSportHint = document.getElementById("addSportHint");

/* =========================
   6) Hilfsfunktionen
   ========================= */
function toNumber(x) {
  var n = Number(x);
  if (isNaN(n)) return 0;
  return n;
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showModal(modalEl) { modalEl.classList.remove("d-none"); }
function hideModal(modalEl) { modalEl.classList.add("d-none"); }

function titleRole(role) {
  return role === "teacher" ? "Lehrer" : "Schüler";
}

function clampKey(key) {
  // Key fuer Sportart: klein, nur a z 0 9 und _
  return String(key)
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("-", "_")
    .replaceAll(".", "_");
}

/* =========================
   7) Tabs und Seiten (dynamisch)
   ========================= */

/* Sort Optionen fuer sportbezogene und allgemeine Stats */
function buildSortOptionsForSport(cfg) {
  var html = "";

  cfg.sportStats.forEach(function(stat) {
    html += '<option value="sport_' + escapeHTML(stat) + '">' + escapeHTML(stat) + "</option>";
  });

  GENERAL_STATS.forEach(function(stat) {
    html += '<option value="gen_' + escapeHTML(stat) + '">' + escapeHTML(stat) + "</option>";
  });

  return html;
}

/* Erzeugt Sportseiten und Sport Tabs neu */
function buildSportPagesAndTabs() {
  /* 1) Sportseiten neu bauen */
  sportPagesMount.innerHTML = "";

  var sportKeys = Object.keys(SPORTS);

  sportKeys.forEach(function(sportKey) {
    var cfg = SPORTS[sportKey];

    var section = document.createElement("section");
    section.className = "page";
    section.setAttribute("data-page", sportKey);

    section.innerHTML =
      '<div class="page-head">' +
        "<h2>" + escapeHTML(cfg.label) + "</h2>" +
        "<p>Sortieren, vergleichen. Overall nutzt allgemeine und sportbezogene Stats.</p>" +
      "</div>" +

      '<div class="controls">' +
        '<select class="input" data-sortkey="' + escapeHTML(sportKey) + '">' +
          '<option value="name">Name</option>' +
          '<option value="overallSport">Overall</option>' +
          '<option value="aotkScore">AOTK Score</option>' +
          buildSortOptionsForSport(cfg) +
        "</select>" +

        '<select class="input" data-sortdir="' + escapeHTML(sportKey) + '">' +
          '<option value="asc">Aufsteigend</option>' +
          '<option value="desc">Absteigend</option>' +
        "</select>" +
      "</div>" +

      '<div class="cards" data-cards="' + escapeHTML(sportKey) + '"></div>';

    sportPagesMount.appendChild(section);
  });

  /* 2) Tabs neu bauen: Start, dann Sportarten, dann AOTK */
  var existingTabs = tabbar.querySelectorAll(".tab");
  var startTab = existingTabs[0];
  var aotkTab = existingTabs[existingTabs.length - 1];

  tabbar.innerHTML = "";
  tabbar.appendChild(startTab);

  sportKeys.forEach(function(sportKey) {
    var btn = document.createElement("button");
    btn.className = "tab";
    btn.type = "button";
    btn.setAttribute("data-target", sportKey);
    btn.textContent = SPORTS[sportKey].label;
    tabbar.appendChild(btn);
  });

  tabbar.appendChild(aotkTab);

  wireTabEvents();
  wireSportSortEvents();
  rebuildSportSelect();

  // Metriken
  metricSports.textContent = String(Object.keys(SPORTS).length);
}

/* Tab Events */
function wireTabEvents() {
  var tabs = tabbar.querySelectorAll(".tab");

  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      var target = tab.getAttribute("data-target");
      openPage(target);
    });
  });
}

/* Seite oeffnen */
function openPage(pageKey) {
  activePage = pageKey;

  // Tabs aktiv
  var tabs = tabbar.querySelectorAll(".tab");
  tabs.forEach(function(t) {
    t.classList.remove("active");
    if (t.getAttribute("data-target") === pageKey) t.classList.add("active");
  });

  // Alle Seiten inkl dynamische Sportseiten
  var allPages = document.querySelectorAll(".page");
  allPages.forEach(function(p) {
    p.classList.remove("active");
    if (p.getAttribute("data-page") === pageKey) p.classList.add("active");
  });

  // Spezialseiten neu rendern
  if (pageKey === "aotk") {
    renderAOTK();
  } else if (SPORTS[pageKey]) {
    renderSportCards(pageKey);
  }
}

/* CTA */
ctaAOTK.addEventListener("click", function() { openPage("aotk"); });
ctaFirstSport.addEventListener("click", function() {
  var keys = Object.keys(SPORTS);
  if (keys.length > 0) openPage(keys[0]);
});

/* =========================
   8) Normalisierung und Scores
   ========================= */

/* Min/Max fuer Werte innerhalb einer Gruppe */
function getMinMax(list, getterFn) {
  var values = list.map(function(x) { return toNumber(getterFn(x)); });
  if (values.length === 0) return { min: 0, max: 0 };
  return { min: Math.min.apply(null, values), max: Math.max.apply(null, values) };
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/* Overall Sport Score: allgemeine + sportbezogene Stats */
function computeOverallSport(player, groupPlayers, sportKey) {
  var cfg = SPORTS[sportKey];
  var gw = cfg.generalWeight;
  var sw = 1 - gw;

  // allgemeiner Teil
  var genSum = 0;
  var genWeightSum = 0;

  GENERAL_STATS.forEach(function(stat) {
    var mm = getMinMax(groupPlayers, function(p) { return p.general[stat]; });
    var n = normalize(toNumber(player.general[stat]), mm.min, mm.max);
    var w = AOTK_WEIGHTS[stat] || 0;
    genSum += w * n;
    genWeightSum += w;
  });

  if (genWeightSum === 0) genWeightSum = 1;
  var genScore = genSum / genWeightSum; // 0..1

  // sportbezogener Teil
  var sportSum = 0;
  var sportWeightSum = 0;

  cfg.sportStats.forEach(function(stat) {
    var mm2 = getMinMax(groupPlayers, function(p) { return p.stats[stat]; });
    var n2 = normalize(toNumber(player.stats[stat]), mm2.min, mm2.max);
    var w2 = cfg.weights[stat] || 0;
    sportSum += w2 * n2;
    sportWeightSum += w2;
  });

  if (sportWeightSum === 0) sportWeightSum = 1;
  var sportScore = sportSum / sportWeightSum; // 0..1

  return (gw * genScore + sw * sportScore) * 100;
}

/* AOTK Score: nur allgemeine Stats */
function computeAotkScore(player, groupPlayers) {
  var sum = 0;
  var weightSum = 0;

  GENERAL_STATS.forEach(function(stat) {
    var mm = getMinMax(groupPlayers, function(p) { return p.general[stat]; });
    var n = normalize(toNumber(player.general[stat]), mm.min, mm.max);
    var w = AOTK_WEIGHTS[stat] || 0;
    sum += w * n;
    weightSum += w;
  });

  if (weightSum === 0) weightSum = 1;
  return (sum / weightSum) * 100;
}

/* Alles neu berechnen */
function recomputeAll() {
  // Sport Overall pro Sportart
  Object.keys(SPORTS).forEach(function(sportKey) {
    var group = players.filter(function(p) { return p.sport === sportKey; });

    group.forEach(function(p) {
      p.overallSport = computeOverallSport(p, group, sportKey);
    });
  });

  // AOTK Gruppen
  var students = players.filter(function(p) { return p.role === "student"; });
  var teachers = players.filter(function(p) { return p.role === "teacher"; });

  players.forEach(function(p) {
    p.aotkScoreOverall = computeAotkScore(p, players);

    if (p.role === "student") p.aotkScoreStudent = computeAotkScore(p, students);
    else p.aotkScoreStudent = null;

    if (p.role === "teacher") p.aotkScoreTeacher = computeAotkScore(p, teachers);
    else p.aotkScoreTeacher = null;
  });

  // Start Metrik
  metricPlayers.textContent = String(players.length);
  metricSports.textContent = String(Object.keys(SPORTS).length);
}

/* =========================
   9) Sortieren und Render Sportseiten
   ========================= */
function wireSportSortEvents() {
  var sortKeys = document.querySelectorAll("[data-sortkey]");
  var sortDirs = document.querySelectorAll("[data-sortdir]");

  sortKeys.forEach(function(el) {
    el.addEventListener("change", function() {
      var sportKey = el.getAttribute("data-sortkey");
      renderSportCards(sportKey);
    });
  });

  sortDirs.forEach(function(el) {
    el.addEventListener("change", function() {
      var sportKey = el.getAttribute("data-sortdir");
      renderSportCards(sportKey);
    });
  });
}

function sortList(list, key, dir) {
  var copy = list.slice();

  copy.sort(function(a, b) {
    var av, bv;

    if (key === "name") {
      av = a.name.toLowerCase();
      bv = b.name.toLowerCase();
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    }

    if (key === "overallSport") {
      av = toNumber(a.overallSport);
      bv = toNumber(b.overallSport);
      return dir === "asc" ? (av - bv) : (bv - av);
    }

    if (key === "aotkScore") {
      av = toNumber(a.aotkScoreOverall);
      bv = toNumber(b.aotkScoreOverall);
      return dir === "asc" ? (av - bv) : (bv - av);
    }

    if (key.startsWith("sport_")) {
      var s1 = key.replace("sport_", "");
      av = toNumber(a.stats[s1]);
      bv = toNumber(b.stats[s1]);
      return dir === "asc" ? (av - bv) : (bv - av);
    }

    if (key.startsWith("gen_")) {
      var g1 = key.replace("gen_", "");
      av = toNumber(a.general[g1]);
      bv = toNumber(b.general[g1]);
      return dir === "asc" ? (av - bv) : (bv - av);
    }

    return 0;
  });

  return copy;
}

/* Card HTML */
function makeCardHTML(player, sportKey) {
  var cfg = SPORTS[sportKey];

  // Hover Infos: allgemeine + sportbezogene Stats
  var hover = "";

  GENERAL_STATS.forEach(function(stat) {
    hover += "<div>" + escapeHTML(stat) + ": " + toNumber(player.general[stat]) + "</div>";
  });

  cfg.sportStats.forEach(function(stat) {
    hover += "<div>" + escapeHTML(stat) + ": " + toNumber(player.stats[stat]) + "</div>";
  });

  var imgHTML = "";
  if (player.image && player.image.trim() !== "") {
    imgHTML = '<img src="' + escapeHTML(player.image) + '" alt="' + escapeHTML(player.name) + '">';
  } else {
    imgHTML = "<div>" + escapeHTML((player.name.split(" ")[0] || "Player")) + "</div>";
  }

  var selectedClass = comparePick.includes(player.id) ? " selected" : "";
  var overallText = (player.overallSport || 0).toFixed(1);
  var aotkText = (player.aotkScoreOverall || 0).toFixed(1);

  return (
    '<div class="card' + selectedClass + '" data-id="' + escapeHTML(player.id) + '" data-sport="' + escapeHTML(sportKey) + '">' +
      '<div class="card-img">' + imgHTML + "</div>" +
      '<div class="card-body">' +
        '<div class="card-name">' +
          "<span>" + escapeHTML(player.name) + "</span>" +
          '<span class="badge">' + overallText + "</span>" +
        "</div>" +
        '<div class="card-meta">' +
          "<span>" + escapeHTML(cfg.label) + " | " + escapeHTML(titleRole(player.role)) + "</span>" +
          "<span>AOTK " + aotkText + "</span>" +
        "</div>" +
        '<div class="card-hover">' + hover + "</div>" +
      "</div>" +
    "</div>"
  );
}

function renderSportCards(sportKey) {
  var section = document.querySelector('[data-page="' + sportKey + '"]');
  if (!section) return;

  var cardsEl = section.querySelector('[data-cards="' + sportKey + '"]');
  var sortKeyEl = section.querySelector('[data-sortkey="' + sportKey + '"]');
  var sortDirEl = section.querySelector('[data-sortdir="' + sportKey + '"]');

  if (!cardsEl || !sortKeyEl || !sortDirEl) return;

  var list = players.filter(function(p) { return p.sport === sportKey; });

  list = sortList(list, sortKeyEl.value, sortDirEl.value);

  var html = "";
  list.forEach(function(p) {
    html += makeCardHTML(p, sportKey);
  });
  cardsEl.innerHTML = html;

  // Klick auf Cards
  var cardEls = cardsEl.querySelectorAll(".card");
  cardEls.forEach(function(cardEl) {
    cardEl.addEventListener("click", function() {
      var id = cardEl.getAttribute("data-id");
      var p = players.find(function(x) { return x.id === id; });
      if (!p) return;

      if (compareMode) {
        handleComparePick(p);
        // neu rendern, damit selected sichtbar bleibt
        renderSportCards(sportKey);
      } else {
        openDetail(p);
      }
    });
  });
}

/* =========================
   10) Detail Modal
   ========================= */
function openDetail(player) {
  var cfg = SPORTS[player.sport];

  var html = "";
  html += "<h3>" + escapeHTML(player.name) + "</h3>";
  html += "<p><strong>Rolle:</strong> " + escapeHTML(titleRole(player.role)) + "</p>";
  html += "<p><strong>Sportart:</strong> " + escapeHTML(cfg.label) + "</p>";
  html += "<p><strong>Overall (Sportseite):</strong> " + (player.overallSport || 0).toFixed(1) + "</p>";
  html += "<p><strong>AOTK Score (allgemein):</strong> " + (player.aotkScoreOverall || 0).toFixed(1) + "</p>";

  html += "<h4>Allgemeine Stats</h4>";
  GENERAL_STATS.forEach(function(stat) {
    html += "<div><strong>" + escapeHTML(stat) + ":</strong> " + toNumber(player.general[stat]) + "</div>";
  });

  html += "<h4 style='margin-top:10px;'>Sportbezogene Stats</h4>";
  cfg.sportStats.forEach(function(stat) {
    html += "<div><strong>" + escapeHTML(stat) + ":</strong> " + toNumber(player.stats[stat]) + "</div>";
  });

  detailContent.innerHTML = html;
  showModal(detailModal);
}

closeDetailBtn.addEventListener("click", function() { hideModal(detailModal); });
detailModal.addEventListener("click", function(e) { if (e.target === detailModal) hideModal(detailModal); });

/* =========================
   11) Vergleichmodus
   ========================= */
function setCompareMode(on) {
  compareMode = on;
  comparePick = [];

  if (compareMode) compareModeBtn.textContent = "Vergleichmodus: AN";
  else compareModeBtn.textContent = "Vergleichmodus: AUS";
}

compareModeBtn.addEventListener("click", function() {
  setCompareMode(!compareMode);

  // wenn wir gerade auf einer Sportseite sind, neu rendern
  if (SPORTS[activePage]) renderSportCards(activePage);
});

/* Auswahl Logik */
function handleComparePick(player) {
  // 1. Auswahl
  if (comparePick.length === 0) {
    comparePick.push(player.id);
    return;
  }

  // erneuter Klick entfernt
  if (comparePick.includes(player.id)) {
    comparePick = comparePick.filter(function(id) { return id !== player.id; });
    return;
  }

  // gleiche Sportart erzwingen
  var first = players.find(function(p) { return p.id === comparePick[0]; });
  if (first && first.sport !== player.sport) {
    // wir ignorieren diesen Klick, weil falsche Sportart
    return;
  }

  // max 2
  if (comparePick.length >= 2) comparePick = [comparePick[1]];
  comparePick.push(player.id);

  if (comparePick.length === 2) {
    var a = players.find(function(p) { return p.id === comparePick[0]; });
    var b = players.find(function(p) { return p.id === comparePick[1]; });
    if (a && b) openCompare(a, b);
  }
}

/* Vergleich Anzeige: allgemeine + sportbezogene Stats */
function openCompare(a, b) {
  var cfg = SPORTS[a.sport];
  var group = players.filter(function(p) { return p.sport === a.sport; });

  // Liste der Vergleichsstats: erst allgemein, dann sportbezogen
  var allStats = [];
  GENERAL_STATS.forEach(function(s) { allStats.push({ type: "gen", key: s }); });
  cfg.sportStats.forEach(function(s) { allStats.push({ type: "sport", key: s }); });

  // Score Berechnung: gleiche Logik wie OverallSport, aber als 0..1 intern
  var gw = cfg.generalWeight;
  var sw = 1 - gw;

  // genScore
  var genSumA = 0, genSumB = 0, genWS = 0;
  GENERAL_STATS.forEach(function(stat) {
    var mm = getMinMax(group, function(p) { return p.general[stat]; });
    var na = normalize(toNumber(a.general[stat]), mm.min, mm.max);
    var nb = normalize(toNumber(b.general[stat]), mm.min, mm.max);
    var w = AOTK_WEIGHTS[stat] || 0;
    genSumA += w * na;
    genSumB += w * nb;
    genWS += w;
  });
  if (genWS === 0) genWS = 1;
  var genScoreA = genSumA / genWS;
  var genScoreB = genSumB / genWS;

  // sportScore
  var sportSumA = 0, sportSumB = 0, sportWS = 0;
  cfg.sportStats.forEach(function(stat) {
    var mm2 = getMinMax(group,pps, function(p) { return p.stats[stat]; });
  });

  // kleiner Fix: oben war Tippfehler, hier korrekt
  sportSumA = 0; sportSumB = 0; sportWS = 0;
  cfg.sportStats.forEach(function(stat) {
    var mm2 = getMinMax(group, function(p) { return p.stats[stat]; });
    var na2 = normalize(toNumber(a.stats[stat]), mm2.min, mm2.max);
    var nb2 = normalize(toNumber(b.stats[stat]), mm2.min, mm2.max);
    var w2 = cfg.weights[stat] || 0;
    sportSumA += w2 * na2;
    sportSumB += w2 * nb2;
    sportWS += w2;
  });
  if (sportWS === 0) sportWS = 1;
  var sportScoreA = sportSumA / sportWS;
  var sportScoreB = sportSumB / sportWS;

  var finalA = gw * genScoreA + sw * sportScoreA;
  var finalB = gw * genScoreB + sw * sportScoreB;

  var winnerText = "Unentschieden";
  if (finalA > finalB) winnerText = "Besser: " + a.name;
  if (finalB > finalA) winnerText = "Besser: " + b.name;

  var html = "";
  html += "<h3>" + escapeHTML(cfg.label) + " Vergleich</h3>";
  html += "<p><strong>" + escapeHTML(winnerText) + "</strong></p>";

  html += '<div class="compare-result">';
  html += "<div><strong>" + escapeHTML(a.name) + "</strong> vs <strong>" + escapeHTML(b.name) + "</strong></div>";
  html += "<div style='margin-top:8px; color: rgba(255,255,255,0.75); font-size:12px;'>";
  html += "Overall: " + (a.overallSport || 0).toFixed(1) + " | " + (b.overallSport || 0).toFixed(1);
  html += "</div>";

  allStats.forEach(function(s, index) {
    var mm;
    var va;
    var vb;

    if (s.type === "gen") {
      mm = getMinMax(group, function(p) { return p.general[s.key]; });
      va = toNumber(a.general[s.key]);
      vb = toNumber(b.general[s.key]);
    } else {
      mm = getMinMax(group, function(p) { return p.stats[s.key]; });
      va = toNumber(a.stats[s.key]);
      vb = toNumber(b.stats[s.key]);
    }

    var na = normalize(va, mm.min, mm.max);
    var nb = normalize(vb, mm.min, mm.max);

    html += "<div style='margin-top:10px;'>";
    html += "<div style='display:flex; justify-content:space-between; font-size:12px; color:rgba(255,255,255,0.75);'>";
    html += "<span>" + escapeHTML(s.key) + "</span>";
    html += "<span>" + va + " | " + vb + "</span>";
    html += "</div>";

    html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:6px;">';
    html += '<div class="bar"><div class="bar-fill" data-fill="a_' + index + '"></div></div>';
    html += '<div class="bar"><div class="bar-fill" data-fill="b_' + index + '"></div></div>';
    html += "</div>";
    html += "</div>";

    // Wir speichern die Normalwerte in data, damit wir unten animieren koennen
  });

  html += "</div>";

  compareContent.innerHTML = html;
  showModal(compareModal);

  // Animation nach dem Einfuegen
  allStats.forEach(function(s, index) {
    var mm, va, vb;

    if (s.type === "gen") {
      mm = getMinMax(group, function(p) { return p.general[s.key]; });
      va = toNumber(a.general[s.key]);
      vb = toNumber(b.general[s.key]);
    } else {
      mm = getMinMax(group, function(p) { return p.stats[s.key]; });
      va = toNumber(a.stats[s.key]);
      vb = toNumber(b.stats[s.key]);
    }

    var na = normalize(va, mm.min, mm.max);
    var nb = normalize(vb, mm.min, mm.max);

    var fillA = compareContent.querySelector('[data-fill="a_' + index + '"]');
    var fillB = compareContent.querySelector('[data-fill="b_' + index + '"]');

    requestAnimationFrame(function() {
      if (fillA) fillA.style.width = Math.round(na * 100) + "%";
      if (fillB) fillB.style.width = Math.round(nb * 100) + "%";
    });
  });
}

closeCompareBtn.addEventListener("click", function() { hideModal(compareModal); });
compareModal.addEventListener("click", function(e) { if (e.target === compareModal) hideModal(compareModal); });

/* =========================
   12) AOTK Rendering
   ========================= */
function bestByScore(list, scoreKey) {
  var best = null;
  list.forEach(function(p) {
    var v = toNumber(p[scoreKey]);
    if (!best || v > toNumber(best[scoreKey])) best = p;
  });
  return best;
}

function panelHTML(p, label) {
  if (!p) return "<div class='hint'>Keine Daten.</div>";

  var aotk = toNumber(p[label]).toFixed(1);

  return (
    "<div><strong>" + escapeHTML(p.name) + "</strong></div>" +
    "<div class='hint'>Rolle: " + escapeHTML(titleRole(p.role)) + "</div>" +
    "<div class='hint'>Sport: " + escapeHTML(SPORTS[p.sport].label) + "</div>" +
    "<div style='margin-top:6px;'><strong>AOTK Score:</strong> " + aotk + "</div>"
  );
}

function renderAOTK() {
  // Students
  var students = players.filter(function(p) { return p.role === "student"; });
  var teachers = players.filter(function(p) { return p.role === "teacher"; });

  var bestStudent = bestByScore(students, "aotkScoreStudent");
  var bestTeacher = bestByScore(teachers, "aotkScoreTeacher");
  var bestOverall = bestByScore(players, "aotkScoreOverall");

  aotkStudentsPanel.innerHTML = panelHTML(bestStudent, "aotkScoreStudent");
  aotkTeacherPanel.innerHTML = panelHTML(bestTeacher, "aotkScoreTeacher");
  aotkOverallPanel.innerHTML = panelHTML(bestOverall, "aotkScoreOverall");

  // Ranking: alle nach aotkScoreOverall
  var rank = players.slice().sort(function(a, b) {
    return toNumber(b.aotkScoreOverall) - toNumber(a.aotkScoreOverall);
  });

  var html = "";
  rank.forEach(function(p) {
    // wir nutzen makeCardHTML, aber sportKey ist p.sport
    html += makeCardHTML(p, p.sport);
  });
  aotkRanking.innerHTML = html;

  // Klick -> Detail
  var cards = aotkRanking.querySelectorAll(".card");
  cards.forEach(function(cardEl) {
    cardEl.addEventListener("click", function() {
      var id = cardEl.getAttribute("data-id");
      var p = players.find(function(x) { return x.id === id; });
      if (p) openDetail(p);
    });
  });
}

/* =========================
   13) Add Player Modal
   ========================= */
function rebuildSportSelect() {
  // Sport Dropdown neu fuellen
  newSport.innerHTML = "";
  Object.keys(SPORTS).forEach(function(sportKey) {
    var opt = document.createElement("option");
    opt.value = sportKey;
    opt.textContent = SPORTS[sportKey].label;
    newSport.appendChild(opt);
  });

  // Felder neu bauen
  buildPlayerStatFields();
}

function buildPlayerStatFields() {
  // Allgemeine Stats Felder
  generalStatFields.innerHTML = "";
  GENERAL_STATS.forEach(function(stat) {
    var row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML =
      '<input class="input" type="text" value="' + escapeHTML(stat) + '" disabled />' +
      '<input class="input" type="number" placeholder="0 bis 100" data-gen="' + escapeHTML(stat) + '" />' +
      '<button class="btn btn-ghost" type="button" disabled>OK</button>';
    generalStatFields.appendChild(row);
  });

  // Sport Stats Felder
  sportStatFields.innerHTML = "";
  var sportKey = newSport.value;
  var cfg = SPORTS[sportKey];
  if (!cfg) return;

  cfg.sportStats.forEach(function(stat) {
    var row2 = document.createElement("div");
    row2.className = "stat-row";
    row2.innerHTML =
      '<input class="input" type="text" value="' + escapeHTML(stat) + '" disabled />' +
      '<input class="input" type="number" placeholder="Wert" data-sport="' + escapeHTML(stat) + '" />' +
      '<button class="btn btn-ghost" type="button" disabled>OK</button>';
    sportStatFields.appendChild(row2);
  });

  addPlayerHint.textContent = "";
}

newSport.addEventListener("change", function() {
  buildPlayerStatFields();
});

openAddPlayerBtn.addEventListener("click", function() {
  buildPlayerStatFields();
  showModal(addPlayerModal);
});

closeAddPlayerBtn.addEventListener("click", function() {
  hideModal(addPlayerModal);
});

addPlayerModal.addEventListener("click", function(e) {
  if (e.target === addPlayerModal) hideModal(addPlayerModal);
});

savePlayerBtn.addEventListener("click", function() {
  var role = newRole.value;
  var sportKey = newSport.value;
  var name = newName.value.trim();
  var image = newImage.value.trim();

  if (name === "") {
    addPlayerHint.textContent = "Bitte Name eingeben.";
    return;
  }
  if (!SPORTS[sportKey]) {
    addPlayerHint.textContent = "Bitte Sportart wählen.";
    return;
  }

  // Allgemeine Stats lesen
  var general = {};
  GENERAL_STATS.forEach(function(stat) {
    var input = generalStatFields.querySelector('[data-gen="' + stat + '"]');
    general[stat] = toNumber(input ? input.value : 0);
  });

  // Sportbezogene Stats lesen
  var cfg = SPORTS[sportKey];
  var stats = {};
  cfg.sportStats.forEach(function(stat) {
    var input2 = sportStatFields.querySelector('[data-sport="' + stat + '"]');
    stats[stat] = toNumber(input2 ? input2.value : 0);
  });

  var newPlayerObj = {
    id: sportKey + "_" + String(Date.now()),
    sport: sportKey,
    role: role,
    name: name,
    image: image,
    general: general,
    stats: stats
  };

  players.push(newPlayerObj);

  // Reset einfache Felder
  newName.value = "";
  newImage.value = "";

  recomputeAll();

  // Wenn Sportseite aktiv ist, aktualisieren
  if (SPORTS[activePage]) renderSportCards(activePage);
  renderAOTK();

  addPlayerHint.textContent = "Spieler gespeichert.";
});

/* =========================
   14) Add Sport Modal
   ========================= */
function resetSportStatDefs() {
  sportStatDefFields.innerHTML = "";
  addSportHint.textContent = "";

  // 3 Standardfelder
  addSportStatDefRow("stat1", 1);
  addSportStatDefRow("stat2", 1);
  addSportStatDefRow("stat3", 1);
}

function addSportStatDefRow(name, weight) {
  var row = document.createElement("div");
  row.className = "stat-row";

  var nameInput = document.createElement("input");
  nameInput.className = "input";
  nameInput.type = "text";
  nameInput.placeholder = "Stat Name";
  nameInput.value = name || "";

  var weightInput = document.createElement("input");
  weightInput.className = "input";
  weightInput.type = "number";
  weightInput.placeholder = "Gewicht";
  weightInput.value = String(weight || 1);

  var delBtn = document.createElement("button");
  delBtn.className = "btn btn-ghost";
  delBtn.type = "button";
  delBtn.textContent = "X";
  delBtn.addEventListener("click", function() {
    row.remove();
  });

  row.appendChild(nameInput);
  row.appendChild(weightInput);
  row.appendChild(delBtn);

  sportStatDefFields.appendChild(row);
}

openAddSportBtn.addEventListener("click", function() {
  resetSportStatDefs();
  showModal(addSportModal);
});

closeAddSportBtn.addEventListener("click", function() {
  hideModal(addSportModal);
});

addSportModal.addEventListener("click", function(e) {
  if (e.target === addSportModal) hideModal(addSportModal);
});

addSportStatBtn.addEventListener("click", function() {
  addSportStatDefRow("", 1);
});

resetSportStatBtn.addEventListener("click", function() {
  resetSportStatDefs();
});

saveSportBtn.addEventListener("click", function() {
  var label = sportNameInput.value.trim();
  var key = clampKey(sportKeyInput.value.trim());

  if (label === "" || key === "") {
    addSportHint.textContent = "Bitte Name und Key eingeben.";
    return;
  }
  if (SPORTS[key]) {
    addSportHint.textContent = "Dieser Key existiert bereits.";
    return;
  }

  // Stats lesen
  var rows = sportStatDefFields.querySelectorAll(".stat-row");
  var sportStats = [];
  var weights = {};

  rows.forEach(function(row) {
    var inputs = row.querySelectorAll("input");
    var statName = (inputs[0] ? inputs[0].value.trim() : "");
    var statWeight = toNumber(inputs[1] ? inputs[1].value : 0);

    if (statName !== "") {
      sportStats.push(statName);
      weights[statName] = statWeight;
    }
  });

  if (sportStats.length === 0) {
    addSportHint.textContent = "Bitte mindestens einen Stat definieren.";
    return;
  }

  // Sport speichern
  SPORTS[key] = {
    label: label,
    sportStats: sportStats,
    weights: weights,
    generalWeight: 0.35
  };

  // UI neu bauen
  buildSportPagesAndTabs();
  recomputeAll();

  // Optional: direkt auf neue Sportseite gehen
  openPage(key);

  // Reset Form
  sportNameInput.value = "";
  sportKeyInput.value = "";
  addSportHint.textContent = "Sportart gespeichert.";
  hideModal(addSportModal);
});

/* =========================
   15) Init
   ========================= */
function init() {
  // Vergleichmodus aus
  setCompareMode(false);

  // Sportseiten und Tabs bauen
  buildSportPagesAndTabs();

  // Werte berechnen
  recomputeAll();

  // Startseite aktiv
  openPage("start");

  // AOTK initial
  renderAOTK();
}

init();
