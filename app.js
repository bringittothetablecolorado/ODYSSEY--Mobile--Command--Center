(function () {
  "use strict";

  var APP_VERSION = "ODYSSEY Mobile v1.1";
  var STORAGE_KEY = "odyssey-mobile-v1-state";
  var FEED_URL = "data/intelligence-feed.json";
  var app = document.getElementById("app");
  var feed = {
    status: "loading",
    generated_at: "",
    source_count: 0,
    healthy_source_count: 0,
    limited_source_count: 0,
    item_count: 0,
    sources: [],
    items: [],
    error: ""
  };
  var state = loadState();

  function defaultState() {
    return { launched: false, activeScreen: "launch", captures: [] };
  }

  function loadState() {
    var next = defaultState();
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return next;
      next.launched = Boolean(saved.launched);
      next.activeScreen = saved.activeScreen || next.activeScreen;
      next.captures = Array.isArray(saved.captures) ? saved.captures : [];
    } catch (error) {
      return next;
    }
    return next;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // The public feed still works when a browser blocks local storage.
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    try {
      var parsed = new URL(String(value || ""), window.location.href);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
    } catch (error) {
      return "";
    }
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function header(title, intro) {
    return '<section class="screen"><header class="topbar"><div class="brand-lockup">' +
      '<div class="brand-mark-small">&#x1F319; &#x2B50; &#x1F319;</div>' +
      '<div class="brand-title">ODYSSEY</div><div class="brand-subtitle">A Story Told in Real Time</div>' +
      '</div></header><p class="screen-kicker">' + escapeHtml(title) + '</p><h2 class="screen-title">' + escapeHtml(title) +
      '</h2><p class="screen-intro">' + escapeHtml(intro) + '</p>';
  }

  function closeScreen() {
    return "</section>";
  }

  function navigate(screen) {
    state.launched = true;
    state.activeScreen = screen;
    saveState();
    render();
  }

  function loadFeed() {
    feed.status = "loading";
    renderIfLiveScreen();
    return fetch(FEED_URL + "?v=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Feed returned " + response.status);
        return response.json();
      })
      .then(function (data) {
        feed = data;
        feed.status = "ready";
        feed.error = "";
        renderIfLiveScreen();
      })
      ["catch"](function (error) {
        feed.status = "error";
        feed.error = error.message || "The public feed is temporarily unavailable.";
        renderIfLiveScreen();
      });
  }

  function renderIfLiveScreen() {
    if (state.launched && ["home", "warroom", "timeline", "intelligence"].indexOf(state.activeScreen) !== -1) render();
  }

  function renderLaunch() {
    return '<section class="launch-screen"><div class="hero-image" aria-hidden="true"></div><div class="launch-content">' +
      '<div class="logo-mark">&#x1F319; &#x2B50; &#x1F319;</div><h1 class="wordmark">ODYSSEY</h1>' +
      '<div class="tagline">A Story Told in Real Time</div><button class="primary-button" data-action="continue">Open Command Center</button>' +
      '</div></section>';
  }

  function feedStatusCard() {
    if (feed.status === "loading") {
      return '<article class="card"><div class="card-label">Live Intelligence</div><div class="card-title">Refreshing the record…</div></article>';
    }
    if (feed.status === "error") {
      return '<article class="card"><div class="card-label">Live Intelligence</div><div class="card-title">Feed needs attention</div>' +
        '<div class="card-meta">' + escapeHtml(feed.error) + '</div><button class="detail-nav-button" data-action="refresh">Try Again</button></article>';
    }
    return '<article class="card"><div class="card-label">Live Intelligence</div><div class="stat-value">' + escapeHtml(feed.item_count) + '</div>' +
      '<div class="card-title">verified public sources</div><div class="card-meta">' + escapeHtml(feed.healthy_source_count) + ' verified sources · ' +
      escapeHtml(feed.limited_source_count || 0) + ' platform-limited · Directory checked ' + escapeHtml(formatDate(feed.generated_at)) + '</div>' +
      '<button class="detail-nav-button" data-action="refresh">Refresh Now</button></article>';
  }

  function renderHome() {
    return header("Mission Control", "The phone-ready front door to current public intelligence and field capture.") +
      feedStatusCard() +
      '<button class="card command-link-card" data-nav="intelligence"><div class="card-label">Public Source Directory</div><div class="card-title">Open the verified ODYSSEY links</div><div class="card-meta">Owned reporting, documentary profiles, and public project pages.</div></button>' +
      '<button class="quick-capture-button" data-nav="commander">+ Capture From The Field</button>' +
      '<article class="card"><div class="card-label">Protection Boundary</div><div class="card-title">Public feed outside. Private intelligence behind authentication.</div>' +
      '<div class="card-meta">The phone app does not expose or overwrite desktop master data.</div></article>' + closeScreen();
  }

  function renderMissions() {
    var missions = [
      ["Legal & Court", "Protected desktop intelligence and authenticated intake"],
      ["ODYSSEY Documentary", "Website, FilmFreeway, IMDb, production, and festival footprint"],
      ["Funding", "Fractured Atlas and grant follow-up"],
      ["Media & Investigations", "Bring It to the Table Colorado, Medium, YouTube, and story watches"]
    ];
    var html = header("Missions", "Four operating lanes. No additional rooms.");
    for (var i = 0; i < missions.length; i += 1) {
      html += '<article class="card"><div class="card-label">Mission ' + (i + 1) + '</div><div class="card-title">' + escapeHtml(missions[i][0]) + '</div><div class="card-meta">' + escapeHtml(missions[i][1]) + '</div></article>';
    }
    return html + closeScreen();
  }

  function renderWarRoom() {
    var html = header("War Room", "Source health and collection status.") + feedStatusCard();
    var sources = feed.sources || [];
    for (var i = 0; i < sources.length; i += 1) {
      var source = sources[i];
      html += '<article class="card"><div class="card-label">' + escapeHtml(String(source.status || "unknown").toUpperCase()) + '</div>' +
        '<div class="card-title">' + escapeHtml(source.name) + '</div><div class="card-meta">' + escapeHtml(source.items) + ' items · Checked ' +
        escapeHtml(formatDate(source.checked_at)) + '</div></article>';
    }
    return html + closeScreen();
  }

  function itemCard(item) {
    var url = safeUrl(item.url);
    return '<article class="card"><div class="card-label">' + escapeHtml(item.source_name) + '</div>' +
      (url ? '<a class="card-title source-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.title) + '</a>' : '<div class="card-title">' + escapeHtml(item.title) + '</div>') +
      '<div class="card-meta">' + escapeHtml(item.mission) + ' · ' + escapeHtml(item.status) + ' · ' + escapeHtml(formatDate(item.published_at || item.discovered_at)) + '</div>' +
      (item.summary ? '<div class="card-meta">' + escapeHtml(item.summary) + '</div>' : '') + '</article>';
  }

  function renderTimeline() {
    var html = header("Timeline", "Verified public ODYSSEY sources.") + feedStatusCard();
    var items = (feed.items || []).slice(0, 40);
    for (var i = 0; i < items.length; i += 1) html += itemCard(items[i]);
    return html + closeScreen();
  }

  function renderIntelligence() {
    var html = header("Intelligence", "Verified public entry points for ODYSSEY. Detailed monitoring stays private.") + feedStatusCard();
    var items = (feed.items || []).slice(0, 60);
    for (var i = 0; i < items.length; i += 1) html += itemCard(items[i]);
    return html + closeScreen();
  }

  function classify(text) {
    var value = String(text || "").toLowerCase();
    if (/court|appeal|legal|attorney|clerk|plea|registry|case/.test(value)) return "MISSION-001";
    if (/documentary|film|festival|filmfreeway|imdb|trailer|production/.test(value)) return "MISSION-002";
    if (/grant|funding|fractured atlas|donation|sponsor/.test(value)) return "MISSION-003";
    return "MISSION-004";
  }

  function intakeQueue() {
    var captures = state.captures || [];
    var html = '<article class="card"><div class="card-label">Phone Intake Queue</div><div class="card-title">' + captures.length + ' awaiting secure sync</div>';
    if (!captures.length) return html + '<div class="card-meta">Your next field note or link will appear here.</div></article>';
    for (var i = 0; i < captures.length; i += 1) {
      var capture = captures[i];
      var url = safeUrl(capture.url);
      html += '<div class="capture-row"><div class="card-title small-title">' + escapeHtml(capture.title) + '</div><div class="card-meta">' +
        escapeHtml(capture.mission) + ' · ' + escapeHtml(capture.status) + ' · ' + escapeHtml(formatDate(capture.capturedAt)) + '</div>' +
        (url ? '<a class="source-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Open source</a>' : '') +
        '<div class="card-meta">' + escapeHtml(capture.notes) + '</div></div>';
    }
    return html + '<button class="detail-nav-button" data-action="copy-intake">Copy Intake Queue</button></article>';
  }

  function renderCommander() {
    return header("Mobile Commander", "Capture information in real time and route it into the correct operating lane.") +
      '<article class="card"><div class="card-label">Live Phone Capture</div><form id="intake-form" class="capture-form">' +
      '<label>Title<input name="title" required maxlength="180" placeholder="What just happened?"></label>' +
      '<label>Link<input name="url" type="url" inputmode="url" placeholder="Paste a story, post, document, or source link"></label>' +
      '<label>Notes<textarea name="notes" rows="5" required maxlength="4000" placeholder="Record what you saw, heard, received, or need to follow up."></textarea></label>' +
      '<label>Mission<select name="mission"><option value="auto">Auto-route</option><option value="MISSION-001">Legal / Court</option><option value="MISSION-002">ODYSSEY Documentary</option><option value="MISSION-003">Funding</option><option value="MISSION-004">Media / Investigations</option></select></label>' +
      '<button class="primary-button" type="submit">Save To Phone Intake</button></form>' +
      '<div class="card-meta">Saved locally as LOCAL_PENDING_SYNC. Nothing is published, filed, sent, or added to the desktop master automatically.</div></article>' +
      intakeQueue() +
      '<article class="card"><div class="card-label">Secure Sync</div><div class="card-title">Supabase connection in progress</div>' +
      '<div class="card-meta">Once authentication is applied, this queue will synchronize privately across phone and desktop.</div></article>' + closeScreen();
  }

  function renderSettings() {
    return header("Settings", "Mobile connection and protection status.") +
      '<article class="card"><div class="card-label">Version</div><div class="card-title">' + escapeHtml(APP_VERSION) + '</div></article>' +
      '<article class="card"><div class="settings-item"><span>Public intelligence</span><span>Active</span></div>' +
      '<div class="settings-item"><span>Phone intake</span><span>Local queue active</span></div>' +
      '<div class="settings-item"><span>Private sync</span><span>Authentication pending</span></div>' +
      '<div class="settings-item"><span>Desktop master</span><span>Protected</span></div>' +
      '<div class="settings-item"><span>Automatic publishing</span><span>Disabled</span></div></article>' + closeScreen();
  }

  function bottomNav() {
    var items = [["home", "Home"], ["missions", "Missions"], ["warroom", "War Room"], ["timeline", "Timeline"], ["commander", "Commander"]];
    var html = '<nav class="bottom-nav" aria-label="Primary navigation">';
    for (var i = 0; i < items.length; i += 1) {
      html += '<button class="nav-item' + (state.activeScreen === items[i][0] ? ' active' : '') + '" data-nav="' + items[i][0] + '">' + items[i][1] + '</button>';
    }
    return html + '</nav>';
  }

  function render() {
    if (!state.launched || state.activeScreen === "launch") {
      app.innerHTML = renderLaunch();
      bind();
      return;
    }
    var screens = {
      home: renderHome,
      missions: renderMissions,
      warroom: renderWarRoom,
      timeline: renderTimeline,
      intelligence: renderIntelligence,
      commander: renderCommander,
      settings: renderSettings
    };
    var screen = screens[state.activeScreen] || renderHome;
    app.innerHTML = screen() + bottomNav();
    bind();
  }

  function bind() {
    var continueButton = app.querySelector('[data-action="continue"]');
    if (continueButton) continueButton.addEventListener("click", function () { navigate("home"); });

    var navButtons = app.querySelectorAll("[data-nav]");
    for (var i = 0; i < navButtons.length; i += 1) {
      navButtons[i].addEventListener("click", function () { navigate(this.getAttribute("data-nav")); });
    }

    var refreshButtons = app.querySelectorAll('[data-action="refresh"]');
    for (var j = 0; j < refreshButtons.length; j += 1) refreshButtons[j].addEventListener("click", loadFeed);

    var form = app.querySelector("#intake-form");
    if (form) form.addEventListener("submit", saveCapture);

    var copyButton = app.querySelector('[data-action="copy-intake"]');
    if (copyButton) copyButton.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(JSON.stringify(state.captures || [], null, 2));
    });
  }

  function saveCapture(event) {
    event.preventDefault();
    var data = new FormData(event.currentTarget);
    var title = String(data.get("title") || "").trim();
    var notes = String(data.get("notes") || "").trim();
    var url = safeUrl(data.get("url"));
    var selected = String(data.get("mission") || "auto");
    if (!title || !notes) return;
    state.captures.unshift({
      clientId: "INTAKE-" + Date.now(),
      title: title,
      notes: notes,
      url: url,
      mission: selected === "auto" ? classify(title + " " + notes + " " + url) : selected,
      status: "LOCAL_PENDING_SYNC",
      capturedAt: new Date().toISOString()
    });
    saveState();
    render();
  }

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js")["catch"](function () {});
    });
  }

  render();
  loadFeed();
}());
