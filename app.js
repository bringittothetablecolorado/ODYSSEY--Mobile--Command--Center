(function () {
  "use strict";

  var MARK = "&#x1F319; &#x2B50; &#x1F319;";
  var STORAGE_KEY = "odyssey-pwa-v1-state";
  var VERSION = "Odyssey PWA v1.0";
  var app = document.getElementById("app");

  var ODYSSEY_READONLY_SNAPSHOT = null;
  var odyssey = null;

  var state = loadLocalState();

  function defaultState() {
    return {
      launched: false,
      activeScreen: "launch",
      lastUpdated: new Date().toISOString()
    };
  }

  function loadLocalState() {
    return defaultState();
  }

  function saveLocalState() {
    state.lastUpdated = new Date().toISOString();
    // Phase 3 is a read-only preview. Navigation state stays in memory and is not persisted.
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function metaJoin(items) {
    return items.join(" &bull; ");
  }

  function navigate(screen) {
    state.activeScreen = screen;
    if (screen !== "launch") {
      state.launched = true;
    }
    saveLocalState();
    renderApp();
  }

  function continueJourney() {
    navigate("home");
  }

  function renderApp() {
    if (!state.launched || state.activeScreen === "launch") {
      app.innerHTML = renderLaunch();
      bindLaunch();
      return;
    }

    var screen = state.activeScreen || "home";
    var html = "";
    if (screen === "home") html = renderHome();
    else if (screen === "missions") html = renderMissions();
    else if (screen.indexOf("mission-detail:") === 0) html = renderMissionDetail(screen.split(":")[1]);
    else if (screen === "warroom") html = renderWarRoom();
    else if (screen === "timeline") html = renderTimeline();
    else if (screen === "evidence") html = renderEvidenceWorkspace();
    else if (screen === "commanderbrief") html = renderCommanderBriefWorkspace();
    else if (screen === "executiveboard") html = renderExecutiveBoard();
    else if (screen === "strategicforecast") html = renderStrategicForecast();
    else if (screen === "commander") html = renderAICommanderDashboard();
    else if (screen === "intake") html = renderMobileIntake();
    else if (screen === "legacy") html = renderLegacy();
    else if (screen === "intelligence") html = renderIntelligence();
    else if (screen === "story") html = renderStory();
    else if (screen === "profile") html = renderProfile();
    else if (screen === "settings") html = renderSettings();
    else if (screen === "more") html = renderMore();
    else html = renderHome();

    app.innerHTML = html + renderBottomNavigation(screen);
    bindNavigation();
  }

  function renderLaunch() {
    return '' +
      '<section class="launch-screen">' +
      '<div class="hero-image" aria-hidden="true"></div>' +
      '<div class="launch-content">' +
      '<div class="logo-mark">' + MARK + '</div>' +
      '<h1 class="wordmark">ODYSSEY</h1>' +
      '<div class="tagline">A Story Told in Real Time</div>' +
      '<button class="primary-button" data-action="continue">Continue The Journey</button>' +
      '</div>' +
      '</section>';
  }

  function renderHeader(title, intro) {
    return '' +
      '<section class="screen">' +
      '<header class="topbar">' +
      '<div class="brand-lockup">' +
      '<div class="brand-mark-small">' + MARK + '</div>' +
      '<div class="brand-title">ODYSSEY</div>' +
      '<div class="brand-subtitle">A Story Told in Real Time</div>' +
      '</div>' +
      '</header>' +
      '<p class="screen-kicker">' + escapeHtml(title) + '</p>' +
      '<h2 class="screen-title">' + escapeHtml(title) + '</h2>' +
      '<p class="screen-intro">' + escapeHtml(intro) + '</p>';
  }

  function closeScreen() {
    return '</section>';
  }

  function renderHome() {
    return renderHeader("Home", "The command center for what matters now, what is moving, and what must be protected.") +
      '<article class="card hero-card">' +
      '<div class="card-label">Current Mission</div>' +
      '<div class="card-title">' + escapeHtml(odyssey.currentMission.title) + '</div>' +
      '<div class="card-meta">' + metaJoin([escapeHtml(odyssey.currentMission.priority), escapeHtml(odyssey.currentMission.status), odyssey.currentMission.progress + "% complete"]) + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + odyssey.currentMission.progress + '%"></div></div>' +
      '</article>' +
      '<div class="stat-row">' +
      '<article class="card"><div class="card-label">Momentum</div><div class="stat-value">' + odyssey.momentum.score + '</div><div class="card-meta">' + metaJoin([escapeHtml(odyssey.momentum.trend), escapeHtml(odyssey.momentum.energy), escapeHtml(odyssey.momentum.recentWin)]) + '</div></article>' +
      '<article class="card"><div class="card-label">Top Risk</div><div class="card-title">' + escapeHtml(odyssey.risk.title) + '</div><div class="card-meta">' + escapeHtml(odyssey.risk.mitigation) + '</div></article>' +
      '</div>' +
      '<article class="card"><div class="card-label">Top Opportunity</div><div class="card-title">' + escapeHtml(odyssey.opportunity.title) + '</div><div class="card-meta">' + metaJoin(["Expected value: " + escapeHtml(odyssey.opportunity.value), "Confidence: " + escapeHtml(odyssey.opportunity.confidence), escapeHtml(odyssey.opportunity.action)]) + '</div></article>' +
      '<button class="card command-link-card" data-nav="executiveboard"><div class="card-label">Executive Board</div><div class="card-title">Open strategic overview</div><div class="card-meta">Mission rankings, readiness, forecast, alerts, and weekly command objectives.</div></button>' +
      '<button class="quick-capture-button" data-nav="intake">+ Quick Capture</button>' +
      '<article class="card"><div class="card-label">Legacy Snapshot</div><div class="card-title">Legacy Score ' + odyssey.legacy.score + '</div><div class="card-meta">' + metaJoin([escapeHtml(odyssey.legacy.book), escapeHtml(odyssey.legacy.documentary), escapeHtml(odyssey.legacy.platform)]) + '</div></article>' +
      renderExecutiveMemoryCard() +
      renderRecordCountsCard() +
      closeScreen();
  }

  function renderMissions() {
    var html = renderHeader("Missions", "Active Odyssey missions and action structure from the read-only mobile snapshot.");
    html += '<article class="card"><div class="card-label">Priority Mission</div><div class="card-title">' + escapeHtml(odyssey.currentMission.title) + '</div><div class="card-meta">Next action: ' + escapeHtml(odyssey.currentMission.nextAction) + '</div><div class="progress-track"><div class="progress-fill" style="width:' + odyssey.currentMission.progress + '%"></div></div></article>';
    html += '<div class="mission-list">';
    for (var i = 0; i < odyssey.missions.length; i += 1) {
      html += missionCard(odyssey.missions[i]);
    }
    html += '</div>';
    html += renderActionCenterCard();
    html += '<article class="card"><div class="card-label">Daily / Weekly Focus</div><div class="card-title">' + escapeHtml(ODYSSEY_READONLY_SNAPSHOT.actionCenter.dailyFocus) + '</div><div class="card-meta">' + escapeHtml(ODYSSEY_READONLY_SNAPSHOT.actionCenter.weeklyFocus) + '</div></article>';
    html += '<article class="card"><div class="card-label">Outcome Forecast</div><div class="card-title">Read-only Odyssey mobile command view</div><div class="card-meta">' + escapeHtml(odyssey.currentMission.forecast) + '</div></article>';
    return html + closeScreen();
  }

  function renderWarRoom() {
    var room = odyssey.warRoom;
    var html = renderHeader("WAR ROOM", "Live Mission Operations");
    html += '<article class="card war-priority-card">' +
      '<div class="card-label">Current Priority</div>' +
      '<div class="war-priority-row">' +
      '<div><div class="card-title">' + escapeHtml(room.currentPriority.mission) + '</div><div class="card-meta">Next Action: ' + escapeHtml(room.currentPriority.nextAction) + '</div></div>' +
      statusBadge(room.currentPriority.status) +
      '</div>' +
      '</article>';

    html += '<article class="card"><div class="card-label">Commander Brief</div>' + renderMetricGrid(room.commanderBrief) + '</article>';

    html += '<article class="card"><div class="card-label">Mission Health</div>';
    for (var i = 0; i < room.missionHealth.length; i += 1) {
      html += missionHealthRow(room.missionHealth[i]);
    }
    html += '</article>';

    html += '<article class="card"><div class="card-label">Recent Events</div>' + renderEventFeed(odyssey.eventLogger.slice(0, 4)) + '</article>';

    html += '<article class="card"><div class="card-label">Strategic Alerts</div>';
    for (var k = 0; k < room.strategicAlerts.length; k += 1) {
      html += strategicAlert(room.strategicAlerts[k]);
    }
    html += '</article>';

    return html + closeScreen();
  }

  function statusBadge(status) {
    return '<span class="status-badge status-' + escapeHtml(status.toLowerCase()) + '">' + escapeHtml(status) + '</span>';
  }

  function missionHealthRow(mission) {
    return '<div class="health-row">' +
      '<div class="health-heading"><div><div class="card-title small-title">' + escapeHtml(mission.id) + '</div><div class="card-meta">' + escapeHtml(mission.name) + '</div></div>' +
      '<div class="health-score">' + mission.health + '%</div></div>' +
      '<div class="health-track"><div class="health-fill health-' + escapeHtml(mission.status.toLowerCase()) + '" style="width:' + mission.health + '%"></div></div>' +
      '<div class="health-status">' + statusBadge(mission.status) + '</div>' +
      '</div>';
  }

  function strategicAlert(alert) {
    return '<div class="alert-item alert-' + escapeHtml(alert.level.toLowerCase()) + '">' +
      '<div class="alert-top">' + statusBadge(alert.level) + '<div class="card-title small-title">' + escapeHtml(alert.title) + '</div></div>' +
      '<div class="card-meta">' + escapeHtml(alert.detail) + '</div>' +
      '</div>';
  }

  function missionCard(mission) {
    return '<button class="card compact-card mission-card-button" data-nav="mission-detail:' + escapeHtml(mission.id) + '">' +
      '<div class="mission-card-top"><div><div class="card-label">' + escapeHtml(mission.id) + ' &bull; Priority ' + escapeHtml(mission.priority) + '</div><div class="card-title">' + escapeHtml(mission.title) + '</div></div>' + statusBadge(mission.status) + '</div>' +
      '<div class="card-meta">' + metaJoin([mission.progress + "%", escapeHtml(mission.nextAction)]) + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + mission.progress + '%"></div></div>' +
      '</button>';
  }

  function getMission(id) {
    for (var i = 0; i < odyssey.missions.length; i += 1) {
      if (odyssey.missions[i].id === id) return odyssey.missions[i];
    }
    return null;
  }

  function renderMissionDetail(id) {
    var detail = odyssey.missionDetails[id];
    var mission = getMission(id);
    if (!detail && mission) {
      detail = {
        id: mission.id,
        title: mission.title,
        status: mission.status,
        priority: mission.priority,
        owner: mission.owner,
        objective: mission.forecast,
        currentAction: mission.nextAction,
        health: [["Overall Health", mission.progress + "%"]],
        deadlines: ["Next review"],
        evidenceInventory: ["Mission materials"],
        risks: ["Needs detailed workspace"],
        successConditions: ["Mission progress tracked"],
        activityFeed: ["Mission selected"],
        commanderNotes: ["Detailed workspace pending."]
      };
    }
    if (!detail) {
      return renderHeader("Mission Detail", "Mission workspace unavailable.") +
        '<article class="card"><div class="card-label">Missing Mission</div><div class="card-title">No mission found.</div></article>' +
        missionDetailNavigation() +
        closeScreen();
    }

    var html = renderHeader(detail.id, detail.title);
    html += '<article class="card mission-detail-hero">' +
      '<div class="mission-detail-header"><div><div class="card-title">' + escapeHtml(detail.title) + '</div><div class="card-meta">Priority: ' + escapeHtml(detail.priority) + ' &bull; Owner: ' + escapeHtml(detail.owner) + '</div></div>' + statusBadge(detail.status) + '</div>' +
      '</article>';
    html += detailSection("Mission Objective", '<div class="card-meta">' + escapeHtml(detail.objective) + '</div>');
    html += detailSection("Current Action", '<div class="card-title">' + escapeHtml(detail.currentAction) + '</div>');
    html += detailSection("Mission Health", renderMetricGrid(detail.health));
    html += detailSection("Deadlines", renderBulletList(detail.deadlines));
    html += detailSection("Evidence Inventory", renderBulletList(detail.evidenceInventory));
    html += detailSection("Risks", renderBulletList(detail.risks));
    html += detailSection("Success Conditions", renderBulletList(detail.successConditions));
    html += detailSection("Activity Feed", renderBulletList(detail.activityFeed));
    html += detailSection("Commander Notes", renderBulletList(detail.commanderNotes));
    html += missionDetailNavigation();
    return html + closeScreen();
  }

  function detailSection(label, body) {
    return '<article class="card"><div class="card-label">' + escapeHtml(label) + '</div>' + body + '</article>';
  }

  function missionDetailNavigation() {
    return '<article class="card"><div class="card-label">Navigation</div><div class="detail-nav-grid">' +
      '<button class="detail-nav-button" data-nav="missions">Back to Missions</button>' +
      '<button class="detail-nav-button" data-nav="timeline">Open Timeline</button>' +
      '<button class="detail-nav-button" data-nav="warroom">Open War Room</button>' +
      '<button class="detail-nav-button" data-nav="evidence">Open Evidence</button>' +
      '<button class="detail-nav-button" data-nav="commanderbrief">Open Commander Brief</button>' +
      '</div></article>';
  }

  function renderEvidenceWorkspace() {
    var detail = odyssey.missionDetails["MISSION-001"];
    return renderHeader("Evidence", "MISSION-001 evidence inventory workspace.") +
      '<article class="card"><div class="card-label">MISSION-001</div><div class="card-title">Evidence Inventory</div>' + renderBulletList(detail.evidenceInventory) + '</article>' +
      renderConnectedDocuments("MISSION-001") +
      '<article class="card"><div class="card-label">Read-Only Mode</div><div class="card-meta">This screen displays evidence categories only. It does not create, modify, upload, delete, or verify evidence.</div></article>' +
      missionDetailNavigation() +
      closeScreen();
  }

  function renderCommanderBriefWorkspace() {
    var detail = odyssey.missionDetails["MISSION-001"];
    return renderHeader("Commander Brief", "MISSION-001 command focus.") +
      '<article class="card"><div class="card-label">Current Action</div><div class="card-title">' + escapeHtml(detail.currentAction) + '</div></article>' +
      '<article class="card"><div class="card-label">Commander Notes</div>' + renderBulletList(detail.commanderNotes) + '</article>' +
      '<article class="card"><div class="card-label">Success Conditions</div>' + renderBulletList(detail.successConditions) + '</article>' +
      missionDetailNavigation() +
      closeScreen();
  }

  function renderAICommanderDashboard() {
    var commander = odyssey.commanderDashboard;
    var html = renderHeader("Commander", "Daily command screen for what needs attention now.");
    html += '<article class="card executive-readiness-card"><div class="card-label">Commander Brief</div><div class="card-title">' + escapeHtml(commander.date) + '</div><div class="card-meta">Priority Mission: ' + escapeHtml(commander.todaysPriority.primaryMission) + ' &bull; Colorado Court of Appeals</div></article>';
    html += '<article class="card war-priority-card"><div class="card-label">Today\'s Priority</div><div class="card-title">' + escapeHtml(commander.todaysPriority.primaryMission) + '</div><div class="card-meta">Reason: ' + escapeHtml(commander.todaysPriority.reason) + '</div><div class="card-meta">Recommended Action: ' + escapeHtml(commander.todaysPriority.recommendedAction) + '</div></article>';
    html += '<button class="quick-capture-button" data-nav="intake">+ Add To Odyssey</button>';
    html += '<article class="card"><div class="card-label">Mission Status</div>';
    for (var i = 0; i < odyssey.warRoom.missionHealth.length; i += 1) {
      html += executiveMissionRow([odyssey.warRoom.missionHealth[i].id, odyssey.warRoom.missionHealth[i].name, odyssey.warRoom.missionHealth[i].status, odyssey.warRoom.missionHealth[i].health + "%"]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Critical Items</div>' + renderBulletList(commander.criticalItems) + '</article>';
    html += '<article class="card"><div class="card-label">Pipeline Watch</div>' + renderMetricGrid(commander.pipelineStatus) + '</article>';
    html += '<article class="card"><div class="card-label">Commander Recommendation</div><div class="card-title">' + escapeHtml(commander.recommendation.topPriority) + '</div><div class="card-meta">Reason: ' + escapeHtml(commander.recommendation.reason) + '</div><div class="card-meta">Suggested Next Action: ' + escapeHtml(commander.recommendation.suggestedNextAction) + '</div><div class="card-meta">Risk: ' + escapeHtml(commander.recommendation.riskLevel) + '</div><div class="card-meta">Expected Outcome: ' + escapeHtml(commander.recommendation.expectedOutcome) + '</div></article>';
    html += '<article class="card"><div class="card-label">Upcoming Deadlines</div>';
    for (var j = 0; j < commander.upcomingDeadlines.length; j += 1) {
      html += '<div class="forecast-row"><div class="card-title small-title">' + escapeHtml(commander.upcomingDeadlines[j][1]) + '</div><div class="card-meta">' + metaJoin([escapeHtml(commander.upcomingDeadlines[j][0]), escapeHtml(commander.upcomingDeadlines[j][2])]) + '</div></div>';
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Recent Events</div>' + renderEventFeed(odyssey.eventLogger.slice(0, 5)) + '</article>';
    html += '<article class="card"><div class="card-label">New Intake Today</div>' + renderIntakeTodayList(odyssey.mobileIntake.newIntakeToday) + '<div class="card-meta">Legal mail is always routed to MISSION-001 and flagged LEGAL_REVIEW_NEEDED. Deadline items appear in Commander alerts.</div></article>';
    html += '<article class="card"><div class="card-label">Strategic Alerts</div>';
    for (var k = 0; k < commander.strategicAlerts.length; k += 1) {
      html += '<div class="alert-item alert-' + impactClass(commander.strategicAlerts[k][2]) + '"><div class="alert-top">' + statusBadge(alertStatusFromImpact(commander.strategicAlerts[k][2])) + '<div class="card-title small-title">' + escapeHtml(commander.strategicAlerts[k][0]) + '</div></div><div class="card-meta">' + escapeHtml(commander.strategicAlerts[k][1]) + '</div></div>';
    }
    html += '</article>';
    return html + closeScreen();
  }

  function renderMobileIntake() {
    var intake = odyssey.mobileIntake;
    var html = renderHeader("Add To Odyssey", "Capture the record. Let Odyssey route it.");
    html += '<article class="card intake-hero-card"><div class="card-label">Mobile Intake Screen</div><div class="card-title">' + escapeHtml(intake.title) + '</div><div class="card-meta">' + escapeHtml(intake.subtitle) + '</div></article>';
    html += '<article class="card"><div class="card-label">Quick Capture</div><div class="intake-grid">';
    for (var i = 0; i < intake.options.length; i += 1) {
      html += renderIntakeOption(intake.options[i]);
    }
    html += '</div><div class="card-meta">Prototype intake only. Capture controls do not upload, save, submit, publish, file, contact, or alter evidence.</div></article>';
    html += '<article class="card"><div class="card-label">Auto-Classification Rules</div>' + renderRuleRows(intake.classificationRules) + '</article>';
    html += '<article class="card"><div class="card-label">Mission Routing</div>' + renderRuleRows(intake.routeRules) + '</article>';
    html += '<article class="card"><div class="card-label">Auto-Route Review Summary</div>';
    for (var j = 0; j < intake.autoRouteSummary.length; j += 1) {
      html += renderAutoRouteSummary(intake.autoRouteSummary[j]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Daily Background Sync Plan</div>' + renderBulletList(intake.dailySync) + '</article>';
    html += '<article class="card"><div class="card-label">Safety Rules</div>' + renderBulletList(intake.safety) + '</article>';
    return html + closeScreen();
  }

  function renderIntakeOption(option) {
    return '<button class="intake-option" type="button" data-intake-title="' + escapeHtml(option.title) + '" data-intake-route="' + escapeHtml(option.route) + '">' +
      '<span class="intake-option-title">' + escapeHtml(option.title) + '</span>' +
      '<span class="intake-option-route">' + escapeHtml(option.route) + '</span>' +
      '<span class="intake-option-meta">' + escapeHtml(option.summary) + '</span>' +
      '<span class="intake-option-type">' + escapeHtml(option.eventType) + '</span>' +
      '</button>';
  }

  function renderRuleRows(items) {
    var html = '<div class="rule-list">';
    for (var i = 0; i < items.length; i += 1) {
      html += '<div class="rule-row"><div class="card-title small-title">' + escapeHtml(items[i][0]) + '</div><div class="card-meta">' + escapeHtml(items[i][1]) + '</div></div>';
    }
    html += '</div>';
    return html;
  }

  function renderAutoRouteSummary(item) {
    return '<div class="auto-route-card">' +
      '<div class="card-title small-title">' + escapeHtml(item.eventId) + ' &bull; ' + escapeHtml(item.mission) + '</div>' +
      '<div class="card-meta">' + metaJoin([escapeHtml(item.dateReceived), escapeHtml(item.sourceType), "Priority: " + escapeHtml(item.priority), "Confidence: " + escapeHtml(item.confidence)]) + '</div>' +
      '<div class="card-meta">Source: ' + escapeHtml(item.sourceName) + '</div>' +
      '<div class="card-meta">Summary: ' + escapeHtml(item.summary) + '</div>' +
      '<div class="card-meta">Deadline Detected: ' + escapeHtml(item.deadlineDetected) + ' &bull; Status: ' + escapeHtml(item.status) + '</div>' +
      '<div class="card-meta">Suggested Action: ' + escapeHtml(item.suggestedAction) + '</div>' +
      '<div class="card-meta">Attachment Link: ' + escapeHtml(item.attachmentLink) + ' &bull; Action: ' + escapeHtml(item.relatedAction) + ' &bull; Outcome: ' + escapeHtml(item.relatedOutcome) + '</div>' +
      '</div>';
  }

  function renderIntakeTodayList(items) {
    var html = '<div class="intake-today-list">';
    for (var i = 0; i < items.length; i += 1) {
      html += '<div class="intake-today-row"><div><div class="card-title small-title">' + escapeHtml(items[i][0]) + '</div><div class="card-meta">' + escapeHtml(items[i][2]) + '</div></div><div class="intake-count">' + escapeHtml(items[i][1]) + '</div></div>';
    }
    html += '</div>';
    return html;
  }

  function renderExecutiveBoard() {
    var board = odyssey.executiveBoard;
    var html = renderHeader("Executive Board", "Highest-level strategic command dashboard for all Odyssey missions.");
    html += '<article class="card executive-readiness-card"><div class="card-label">Odyssey Readiness</div><div class="stat-value">' + board.readiness.health + '%</div><div class="card-title">' + escapeHtml(board.readiness.status) + '</div><div class="progress-track"><div class="progress-fill" style="width:' + board.readiness.health + '%"></div></div></article>';
    html += '<article class="card"><div class="card-label">Mission Rankings</div>';
    for (var i = 0; i < board.missionRankings.length; i += 1) {
      html += executiveMissionRow(board.missionRankings[i]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Strategic Forecast</div>';
    for (var j = 0; j < board.forecast.length; j += 1) {
      html += forecastRow(board.forecast[j]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Mission Health Board</div>';
    for (var k = 0; k < board.missionHealth.length; k += 1) {
      html += executiveHealthRow(board.missionHealth[k]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Strategic Alerts</div>';
    for (var a = 0; a < board.strategicAlerts.length; a += 1) {
      html += boardAlert(board.strategicAlerts[a]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Weekly Commander Brief</div>' + renderMetricGrid(board.weeklyBrief) + '</article>';
    html += '<article class="card"><div class="card-label">Executive Metrics</div>' + renderMetricGrid(board.metrics) + '</article>';
    html += executiveBoardNavigation();
    return html + closeScreen();
  }

  function executiveMissionRow(item) {
    return '<div class="executive-row"><div><div class="card-title small-title">' + escapeHtml(item[0]) + '</div><div class="card-meta">' + escapeHtml(item[1]) + ' &bull; ' + escapeHtml(item[3]) + '</div></div>' + statusBadge(item[2]) + '</div>';
  }

  function forecastRow(item) {
    return '<div class="forecast-row"><div class="card-title small-title">' + escapeHtml(item[0]) + '</div><div class="card-meta">' + metaJoin([escapeHtml(item[1]), escapeHtml(item[2]), escapeHtml(item[3])]) + '</div></div>';
  }

  function executiveHealthRow(item) {
    return '<div class="health-row">' +
      '<div class="health-heading"><div class="card-title small-title">' + escapeHtml(item[0]) + '</div><div class="health-score">' + item[1] + '%</div></div>' +
      '<div class="health-track"><div class="health-fill health-' + escapeHtml(item[2].toLowerCase()) + '" style="width:' + item[1] + '%"></div></div>' +
      '<div class="health-status">' + statusBadge(item[2]) + '</div>' +
      '</div>';
  }

  function boardAlert(item) {
    return '<div class="alert-item alert-' + escapeHtml(item[0].toLowerCase()) + '">' +
      '<div class="alert-top">' + statusBadge(item[0]) + '<div class="card-title small-title">' + escapeHtml(item[1]) + '</div></div>' +
      '</div>';
  }

  function executiveBoardNavigation() {
    return '<article class="card"><div class="card-label">Navigation</div><div class="detail-nav-grid">' +
      '<button class="detail-nav-button" data-nav="missions">Open Mission Portfolio</button>' +
      '<button class="detail-nav-button" data-nav="warroom">Open War Room</button>' +
      '<button class="detail-nav-button" data-nav="timeline">Open Timeline</button>' +
      '<button class="detail-nav-button" data-nav="commanderbrief">Open Commander Brief</button>' +
      '<button class="detail-nav-button" data-nav="strategicforecast">Open Strategic Forecast</button>' +
      '</div></article>';
  }

  function renderStrategicForecast() {
    var board = odyssey.executiveBoard;
    var html = renderHeader("Strategic Forecast", "Executive forecast across the Odyssey mission portfolio.");
    html += '<article class="card"><div class="card-label">Forecast</div>';
    for (var i = 0; i < board.forecast.length; i += 1) {
      html += forecastRow(board.forecast[i]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Read-Only Mode</div><div class="card-meta">This forecast summarizes current mission posture. It does not create decisions, submit applications, publish content, file documents, or modify records.</div></article>';
    html += executiveBoardNavigation();
    return html + closeScreen();
  }

  function renderExecutiveMemoryCard() {
    return '<article class="card">' +
      '<div class="card-label">Executive Memory</div>' +
      '<div class="card-title">Active project focus</div>' +
      '<div class="card-meta">' + escapeHtml(ODYSSEY_READONLY_SNAPSHOT.executiveMemory.activeProjectFocus) + '</div>' +
      renderBulletList(ODYSSEY_READONLY_SNAPSHOT.executiveMemory.currentPriorities) +
      '</article>';
  }

  function renderRecordCountsCard() {
    return '<article class="card">' +
      '<div class="card-label">Mission Control Snapshot</div>' +
      '<div class="card-title">Desktop data preview</div>' +
      renderMetricGrid(ODYSSEY_READONLY_SNAPSHOT.missionControl.recordCounts) +
      '</article>';
  }

  function renderActionCenterCard() {
    var items = ODYSSEY_READONLY_SNAPSHOT.actionCenter.currentActionItems;
    var html = '<article class="card"><div class="card-label">Action Center</div><div class="card-title">Current action items</div>';
    for (var i = 0; i < items.length; i += 1) {
      html += '<div class="action-row">' +
        '<div class="card-title small-title">' + escapeHtml(items[i].title) + '</div>' +
        '<div class="card-meta">' + metaJoin([escapeHtml(items[i].project), escapeHtml(items[i].priority), escapeHtml(items[i].status)]) + '</div>' +
        '<div class="card-meta">Reason: ' + escapeHtml(items[i].reason) + '</div>' +
        '<div class="card-meta">Next: ' + escapeHtml(items[i].nextStep) + '</div>' +
        '</div>';
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Next Recommended Move</div><div class="card-title">' + escapeHtml(ODYSSEY_READONLY_SNAPSHOT.actionCenter.nextRecommendedMove) + '</div><div class="card-meta">' + metaJoin(["Pending: " + ODYSSEY_READONLY_SNAPSHOT.actionCenter.pendingItems, "Completed: " + ODYSSEY_READONLY_SNAPSHOT.actionCenter.completedItems]) + '</div></article>';
    return html;
  }

  function renderMetricGrid(items) {
    var html = '<div class="metric-grid">';
    for (var i = 0; i < items.length; i += 1) {
      html += '<div class="metric-item"><span>' + escapeHtml(items[i][0]) + '</span><strong>' + escapeHtml(items[i][1]) + '</strong></div>';
    }
    html += '</div>';
    return html;
  }

  function renderBulletList(items) {
    var html = '<ul class="clean-list">';
    for (var i = 0; i < items.length; i += 1) {
      html += '<li>' + escapeHtml(items[i]) + '</li>';
    }
    html += '</ul>';
    return html;
  }

  function renderTimeline() {
    var html = renderHeader("Timeline", "Unified mission timeline across appeals, documentary, grants, and public communications.");
    html += '<article class="card"><div class="card-label">Timeline Engine</div><div class="card-title">ODYSSEY_TIMELINE_ENGINE_v1</div><div class="card-meta">Mission-wide chronology for MISSION-001 through MISSION-004.</div></article>';
    html += '<article class="card"><div class="card-label">Unified Timeline</div>';
    for (var i = 0; i < odyssey.operationalTimeline.length; i += 1) {
      html += timelineEventCard(odyssey.operationalTimeline[i]);
    }
    html += '</article>';
    html += '<article class="card"><div class="card-label">Event Logger</div><div class="card-title">ODYSSEY_EVENT_LOGGER_v1</div>' + renderEventFeed(odyssey.eventLogger) + '</article>';
    return html + closeScreen();
  }

  function timelineEventCard(event) {
    return '<div class="timeline-event-card">' +
      '<div class="timeline-line"><div class="timeline-dot"></div><div><div class="card-title small-title">' + escapeHtml(event.id) + ' &bull; ' + escapeHtml(event.mission) + '</div><div class="card-meta">' + metaJoin([escapeHtml(event.date), escapeHtml(event.type), escapeHtml(event.impact), escapeHtml(event.status)]) + '</div><div class="card-meta">' + escapeHtml(event.description) + '</div><div class="card-meta">Source: ' + escapeHtml(event.source) + ' &bull; Action: ' + escapeHtml(event.relatedAction) + ' &bull; Outcome: ' + escapeHtml(event.relatedOutcome) + '</div></div></div>' +
      '</div>';
  }

  function timelineSection(label, items) {
    var html = '<article class="card"><div class="card-label">' + escapeHtml(label) + '</div>';
    for (var i = 0; i < items.length; i += 1) {
      html += timelineItem(items[i][0], items[i][1]);
    }
    html += '</article>';
    return html;
  }

  function timelineItem(title, meta) {
    return '<div class="timeline-line"><div class="timeline-dot"></div><div><div class="card-title small-title">' + escapeHtml(title) + '</div><div class="card-meta">' + escapeHtml(meta) + '</div></div></div>';
  }

  function renderEventFeed(events) {
    var html = '<div class="event-feed">';
    for (var i = 0; i < events.length; i += 1) {
      html += '<div class="event-item"><div class="event-time">' + escapeHtml(events[i].date.slice(5)) + '</div><div><div class="card-title small-title">' + escapeHtml(events[i].id) + '</div><div class="card-meta">' + metaJoin([escapeHtml(events[i].mission), escapeHtml(events[i].type), escapeHtml(events[i].impact), escapeHtml(events[i].status)]) + '</div><div class="card-meta">' + escapeHtml(events[i].description) + '</div></div></div>';
    }
    html += '</div>';
    return html;
  }

  function impactClass(impact) {
    if (impact === "CRITICAL") return "red";
    if (impact === "HIGH" || impact === "MEDIUM") return "yellow";
    return "green";
  }

  function alertStatusFromImpact(impact) {
    if (impact === "CRITICAL") return "RED";
    if (impact === "HIGH" || impact === "MEDIUM") return "YELLOW";
    return "GREEN";
  }

  function renderLegacy() {
    return renderHeader("Legacy", "The long-term impact layer: book, documentary, platform, community, and public record.") +
      '<article class="card"><div class="card-label">Legacy Score</div><div class="stat-value">' + odyssey.legacy.score + '</div><div class="card-meta">Direction: Building &bull; Signal: platform legacy emerging</div></article>' +
      '<div class="card-grid">' +
      '<article class="card"><div class="card-label">Book Progress</div><div class="card-title">Building</div><div class="card-meta">' + escapeHtml(odyssey.legacy.book) + '</div></article>' +
      '<article class="card"><div class="card-label">Documentary Progress</div><div class="card-title">Developing</div><div class="card-meta">' + escapeHtml(odyssey.legacy.documentary) + '</div></article>' +
      '<article class="card"><div class="card-label">Platform Progress</div><div class="card-title">Active</div><div class="card-meta">' + escapeHtml(odyssey.legacy.platform) + '</div></article>' +
      '<article class="card"><div class="card-label">Community Impact</div><div class="card-title">Emerging</div><div class="card-meta">' + escapeHtml(odyssey.legacy.community) + '</div></article>' +
      '</div>' +
      '<article class="card"><div class="card-label">Public Impact</div><div class="card-meta">' + escapeHtml(odyssey.legacy.publicImpact) + '</div></article>' +
      closeScreen();
  }

  function renderIntelligence() {
    return renderHeader("Intelligence", "A read-only executive briefing from the exported Odyssey snapshot.") +
      '<article class="card"><div class="card-label">Strategic Briefing</div><div class="card-title">Protect master data while previewing real Odyssey priorities.</div><div class="card-meta">' + escapeHtml(ODYSSEY_READONLY_SNAPSHOT.executiveMemory.legacyMissionDirection) + '</div></article>' +
      '<article class="card"><div class="card-label">Strategic Notes</div>' + renderBulletList(ODYSSEY_READONLY_SNAPSHOT.executiveMemory.strategicNotes) + '</article>' +
      '<article class="card"><div class="card-label">Top Opportunity</div><div class="card-title">' + escapeHtml(odyssey.opportunity.title) + '</div><div class="card-meta">' + escapeHtml(odyssey.opportunity.action) + '</div></article>' +
      '<article class="card"><div class="card-label">Top Risk</div><div class="card-title">' + escapeHtml(odyssey.risk.title) + '</div><div class="card-meta">' + metaJoin(["Impact: " + escapeHtml(odyssey.risk.impact), "Probability: " + escapeHtml(odyssey.risk.probability), escapeHtml(odyssey.risk.mitigation)]) + '</div></article>' +
      '<article class="card"><div class="card-label">Recommended Move</div><div class="card-title">' + escapeHtml(ODYSSEY_READONLY_SNAPSHOT.actionCenter.nextRecommendedMove) + '</div><div class="card-meta">This keeps Odyssey mobile useful without giving the PWA write access.</div></article>' +
      '<article class="card"><div class="card-label">Reality Forecast</div><div class="card-meta">Do now: safe mobile confidence rises. Delay: phone testing waits. Enable writing too early: master-data risk increases.</div></article>' +
      '<article class="card"><div class="card-label">Recent System Status</div>' + renderBulletList(ODYSSEY_READONLY_SNAPSHOT.executiveMemory.recentSystemStatus) + '</article>' +
      renderRecoveredMemory() +
      renderPrivateSourceMonitor() +
      renderConnectedDocuments("MISSION-004") +
      closeScreen();
  }

  function connectedData() {
    return odyssey && odyssey.connectedData ? odyssey.connectedData : {};
  }

  function renderConnectedDocuments(mission) {
    var documents = connectedData().documents || [];
    var html = '<article class="card"><div class="card-label">Connected Records</div>';
    var count = 0;
    for (var i = 0; i < documents.length; i += 1) {
      if (documents[i].mission !== mission) continue;
      count += 1;
      html += '<a class="record-link" href="' + escapeHtml(documents[i].document_url) + '" target="_blank" rel="noopener noreferrer"><span class="card-title small-title">' + escapeHtml(documents[i].title) + '</span><span class="card-meta">' + metaJoin([escapeHtml(documents[i].record_type), escapeHtml(documents[i].investigation), escapeHtml(documents[i].status)]) + '</span></a>';
    }
    if (!count) html += '<div class="card-meta">No connected file is currently available for this mission.</div>';
    return html + '</article>';
  }

  function renderRecoveredMemory() {
    var memory = connectedData().executiveMemory || {};
    var entries = memory.memoryEntries || [];
    var html = '<article class="card"><div class="card-label">Recovered Executive Memory</div><div class="card-title">' + entries.length + ' authoritative memory entries</div>';
    for (var i = 0; i < entries.length && i < 5; i += 1) {
      html += '<div class="action-row"><div class="card-title small-title">' + escapeHtml(entries[i].memoryTitle) + '</div><div class="card-meta">' + metaJoin([escapeHtml(entries[i].relatedCase), escapeHtml(entries[i].confidenceLevel), escapeHtml(entries[i].status)]) + '</div></div>';
    }
    return html + '</article>';
  }

  function renderPrivateSourceMonitor() {
    var sources = connectedData().sources || [];
    var updates = connectedData().storyUpdates || [];
    var html = '<article class="card"><div class="card-label">Private Source Monitoring</div><div class="card-title">' + sources.length + ' sources connected</div><div class="card-meta">' + updates.length + ' recovered story updates</div>';
    for (var u = 0; u < updates.length && u < 10; u += 1) {
      html += '<a class="record-link" href="' + escapeHtml(updates[u].source_url) + '" target="_blank" rel="noopener noreferrer"><span class="card-title small-title">' + escapeHtml(updates[u].title) + '</span><span class="card-meta">' + metaJoin([escapeHtml(updates[u].mission), escapeHtml(updates[u].priority), escapeHtml(updates[u].review_status)]) + '</span><span class="card-meta">' + escapeHtml(updates[u].summary) + '</span></a>';
    }
    for (var i = 0; i < sources.length; i += 1) {
      html += '<div class="action-row"><div class="card-title small-title">' + escapeHtml(sources[i].name) + '</div><div class="card-meta">' + metaJoin([escapeHtml(sources[i].mission), escapeHtml(sources[i].kind), escapeHtml(sources[i].status)]) + '</div></div>';
    }
    return html + '</article>';
  }

  function renderStory() {
    return renderHeader("Story", "ODYSSEY: A Story Told in Real Time. The living journey behind the platform.") +
      '<article class="card hero-card"><div class="card-label">The Living Journey</div><div class="card-title">A story being understood while it is still being lived.</div><div class="card-meta">Odyssey turns complexity into clarity, experience into record, and record into legacy.</div></article>' +
      '<article class="card"><div class="card-label">Book</div><div class="card-title">ODYSSEY Manuscript</div><div class="card-meta">The written record of the journey, decisions, questions, and transformation.</div></article>' +
      '<article class="card"><div class="card-label">Documentary</div><div class="card-title">A Story Told in Real Time</div><div class="card-meta">The visual record of the Odyssey as it unfolds.</div></article>' +
      '<article class="card"><div class="card-label">App</div><div class="card-title">Personal Command System</div><div class="card-meta">A mobile-first platform for mission, memory, timeline, intelligence, and legacy.</div></article>' +
      '<article class="card"><div class="card-label">Legacy Platform</div><div class="card-title">What remains</div><div class="card-meta">A future archive connecting book, film, platform, public impact, and historical record.</div></article>' +
      closeScreen();
  }

  function renderProfile() {
    return renderHeader("Profile", "The identity and public mission behind Odyssey.") +
      '<article class="card hero-card"><div class="card-label">Mission Owner</div><div class="card-title">Socrates Ulysses Packer</div><div class="card-meta">Filmmaker, storyteller, and creator of ODYSSEY: A Story Told in Real Time.</div></article>' +
      '<article class="card"><div class="card-label">Command Role</div><div class="card-title">Mission Owner</div><div class="card-meta">Responsible for protecting the record, advancing the documentary, building the funding pipeline, and leading the public communications branch.</div></article>' +
      '<button class="card command-link-card" data-nav="executiveboard"><div class="card-label">Executive Board</div><div class="card-title">Open command dashboard</div><div class="card-meta">View readiness, mission rankings, alerts, metrics, and strategic forecast.</div></button>' +
      '<article class="card"><div class="card-label">Standing Order</div><div class="card-meta">Mission-001 remains the primary objective. All other missions support the Odyssey ecosystem while preserving focus.</div></article>' +
      closeScreen();
  }

  function renderSettings() {
    return renderHeader("Settings", "Version 1 safety, read-only data preview, offline, and future sync status.") +
      '<article class="card"><div class="card-label">Version</div><div class="card-title">' + VERSION + '</div><div class="card-meta">Read-only mobile preview. No live data writes.</div></article>' +
      '<div class="card settings-list">' +
      '<div class="settings-item"><span>Mode</span><span>Read-only data preview</span></div>' +
      '<div class="settings-item"><span>Local-first mode</span><span>Active</span></div>' +
      '<div class="settings-item"><span>Hero image status</span><span>assets/odyssey-hero.png</span></div>' +
      '<div class="settings-item"><span>Offline shell status</span><span>Cached after first supported load</span></div>' +
      '<div class="settings-item"><span>Master data source</span><span>Desktop HTA</span></div>' +
      '<div class="settings-item"><span>Mobile write access</span><span>Disabled</span></div>' +
      '<div class="settings-item"><span>Sync</span><span>Not active</span></div>' +
      '<div class="settings-item"><span>Safe testing mode</span><span>Active</span></div>' +
      '<div class="settings-item"><span>Future sync</span><span>Placeholder only</span></div>' +
      '</div>' +
      '<p class="notice">Version 1 does not modify odyssey_data.json, executive_memory.json, Odyssey intelligence systems, or desktop save/load behavior.</p>' +
      closeScreen();
  }

  function renderMore() {
    return renderHeader("More", "Additional Odyssey rooms for decision support, story, and controls.") +
      '<div class="more-grid">' +
      moreButton("intelligence", "Intelligence", "Strategic briefing, opportunity, risk, recommendation, and forecast.") +
      moreButton("intake", "Add To Odyssey", "Capture document, email, legal mail, grant, media, event, or voice-note intake candidates.") +
      moreButton("story", "Story", "Book, documentary, app, and legacy platform context.") +
      moreButton("settings", "Settings", "Local-first mode, offline shell, version, and future sync placeholder.") +
      '</div>' +
      closeScreen();
  }

  function moreButton(screen, title, meta) {
    return '<button class="card" data-nav="' + screen + '"><div class="card-label">Open</div><div class="card-title">' + escapeHtml(title) + '</div><div class="card-meta">' + escapeHtml(meta) + '</div></button>';
  }

  function renderBottomNavigation(active) {
    var items = [
      ["home", "Home"],
      ["missions", "Missions"],
      ["warroom", "War Room"],
      ["timeline", "Timeline"],
      ["commander", "Commander"]
    ];
    var html = '<nav class="bottom-nav" aria-label="Primary navigation">';
    for (var i = 0; i < items.length; i += 1) {
      var selected = active === items[i][0] || active.indexOf("mission-detail:") === 0 && items[i][0] === "missions" || (active === "evidence" || active === "commanderbrief") && items[i][0] === "missions" || (active === "executiveboard" || active === "strategicforecast" || active === "profile" || active === "intake") && items[i][0] === "commander";
      html += '<button class="nav-item' + (selected ? ' active' : '') + '" data-nav="' + items[i][0] + '">' + items[i][1] + '</button>';
    }
    html += '</nav>';
    return html;
  }

  function bindLaunch() {
    var button = app.querySelector('[data-action="continue"]');
    if (button) {
      button.addEventListener("click", continueJourney);
    }
  }

  function bindNavigation() {
    var buttons = app.querySelectorAll("[data-nav]");
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener("click", function () {
        navigate(this.getAttribute("data-nav"));
      });
    }
    var intakeButtons = app.querySelectorAll("[data-intake-title]");
    for (var j = 0; j < intakeButtons.length; j += 1) {
      intakeButtons[j].addEventListener("click", function () {
        if (window.OdysseyConnection) {
          window.OdysseyConnection.capture(this.getAttribute("data-intake-title"), this.getAttribute("data-intake-route"));
        }
      });
    }
  }

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js")["catch"](function () {
        // Offline support is progressive. The app still runs if registration is unavailable.
      });
    });
  }

  function applyConnectedData(payload) {
    if (!payload || !payload.state || !payload.state.snapshot || !payload.state.odyssey) {
      throw new Error("The recovered Odyssey workspace is incomplete.");
    }
    var recoveredMission = payload.state.odyssey.currentMission || {};
    if (String(recoveredMission.priority) !== "1" || recoveredMission.status !== "RED" || recoveredMission.title.indexOf("MISSION-001") !== 0) {
      throw new Error("MISSION-001 Priority 1 / RED verification failed.");
    }
    ODYSSEY_READONLY_SNAPSHOT = payload.state.snapshot;
    odyssey = payload.state.odyssey;
    odyssey.connectedData = {
      executiveMemory: payload.state.executiveMemoryFile || {},
      documents: payload.documents || [],
      sources: payload.sources || [],
      storyUpdates: payload.storyUpdates || [],
      mobileIntake: payload.mobileIntake || []
    };
  }

  if (window.OdysseyConnection) {
    window.OdysseyConnection.start(app, applyConnectedData, renderApp);
  } else {
    renderApp();
  }
}());
