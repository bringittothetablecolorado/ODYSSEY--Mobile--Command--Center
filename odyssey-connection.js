(function () {
  "use strict";

  var CONFIG = {
    url: "https://tojcjbdpaqxlfkoddpsa.supabase.co",
    key: "sb_publishable_g3mIMoQSRczU4GDf9jfzxA_j7vb7t9h"
  };
  var SESSION_KEY = "odyssey-supabase-session-v1";
  var mount;
  var applyData;
  var renderApp;
  var session;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function request(path, options) {
    var settings = options || {};
    var headers = settings.headers || {};
    headers.apikey = CONFIG.key;
    if (session && session.access_token) {
      headers.Authorization = "Bearer " + session.access_token;
    }
    if (settings.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    settings.headers = headers;
    return fetch(CONFIG.url + path, settings).then(function (response) {
      return response.text().then(function (body) {
        var data = body ? JSON.parse(body) : null;
        if (!response.ok) {
          throw new Error(data && (data.msg || data.message || data.error_description || data.error) || "Connection failed.");
        }
        return data;
      });
    });
  }

  function saveSession(nextSession) {
    session = nextSession;
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function sessionFromUrl() {
    if (!location.hash) return null;
    var params = new URLSearchParams(location.hash.slice(1));
    if (!params.get("access_token")) return null;
    history.replaceState(null, document.title, location.pathname + location.search);
    return {
      access_token: params.get("access_token"),
      refresh_token: params.get("refresh_token"),
      expires_at: Math.floor(Date.now() / 1000) + Number(params.get("expires_in") || 3600),
      token_type: params.get("token_type") || "bearer"
    };
  }

  function refreshSession() {
    if (!session || !session.refresh_token) return Promise.reject(new Error("Sign in is required."));
    return request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function (data) {
      saveSession(data);
      return data;
    });
  }

  function ensureSession() {
    var fromUrl = sessionFromUrl();
    if (fromUrl) saveSession(fromUrl);
    if (!session) session = loadSession();
    if (!session || !session.access_token) return Promise.reject(new Error("Sign in is required."));
    if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
      return refreshSession();
    }
    return Promise.resolve(session);
  }

  function rest(table, query) {
    return request("/rest/v1/" + table + "?" + query, {
      headers: { Accept: "application/json" }
    });
  }

  function loadWorkspace() {
    renderLoading();
    return Promise.all([
      rest("odyssey_workspace_state", "id=eq.primary&select=state"),
      rest("document_records", "select=id,mission,investigation,title,record_type,document_url,status,created_at&order=created_at.desc"),
      rest("source_watch", "select=id,name,url,mission,kind,status,last_checked_at&enabled=eq.true&order=name.asc"),
      rest("story_updates", "select=id,source_id,mission,title,summary,source_url,published_at,discovered_at,priority,review_status&order=discovered_at.desc&limit=100"),
      rest("mobile_intake", "select=id,title,notes,source_url,mission,status,captured_at,created_at&order=created_at.desc&limit=100")
    ]).then(function (results) {
      if (!results[0] || results[0].length !== 1) {
        throw new Error("This account is not authorized for the Odyssey workspace.");
      }
      applyData({
        state: results[0][0].state,
        documents: results[1] || [],
        sources: results[2] || [],
        storyUpdates: results[3] || [],
        mobileIntake: results[4] || []
      });
      renderApp();
    })["catch"](function (error) {
      if (/JWT|token|authorized|Sign in/i.test(error.message)) {
        localStorage.removeItem(SESSION_KEY);
        session = null;
        renderSignIn(error.message);
        return;
      }
      renderError(error.message);
    });
  }

  function refreshPrivateSources() {
    var lastRun = Number(localStorage.getItem("odyssey-source-monitor-last-run") || 0);
    if (Date.now() - lastRun < 60 * 60 * 1000) return Promise.resolve();
    return request("/functions/v1/odyssey-source-monitor", {
      method: "POST",
      body: JSON.stringify({ mode: "refresh" })
    }).then(function () {
      localStorage.setItem("odyssey-source-monitor-last-run", String(Date.now()));
    })["catch"](function () {
      // Monitoring is supporting infrastructure and must never block the Command Center.
    });
  }

  function signIn(email, password) {
    return request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: email, password: password })
    }).then(function (data) {
      saveSession(data);
      return refreshPrivateSources().then(loadWorkspace);
    });
  }

  function createAccount(email, password) {
    return request("/auth/v1/signup?redirect_to=" + encodeURIComponent(location.origin + location.pathname), {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password
      })
    }).then(function (data) {
      if (data && data.access_token) {
        saveSession(data);
        return refreshPrivateSources().then(loadWorkspace);
      }
      renderSignIn("Check your email to confirm the account, then return here and sign in.");
    });
  }

  function renderSignIn(message) {
    mount.innerHTML = '<section class="connection-screen">' +
      '<div class="logo-mark">&#x1F319; &#x2B50; &#x1F319;</div>' +
      '<h1 class="wordmark">ODYSSEY</h1>' +
      '<p class="screen-intro">Private Command Center connection</p>' +
      '<form class="card connection-form" data-connection-form>' +
      '<div class="card-label">Authorized access</div>' +
      '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
      '<label>Password<input name="password" type="password" autocomplete="current-password" minlength="8" required></label>' +
      '<div class="connection-actions"><button class="primary-button" type="submit">Open Command Center</button>' +
      '<button class="secondary-button" type="button" data-create-account>Create account</button></div>' +
      '<div class="card-meta" data-connection-message>' + escapeHtml(message || "Sign in with the authorized Odyssey account.") + '</div>' +
      '</form></section>';
    var form = mount.querySelector("[data-connection-form]");
    var accountButton = mount.querySelector("[data-create-account]");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setMessage("Connecting...");
      signIn(form.email.value.trim(), form.password.value)["catch"](function (error) {
        setMessage(error.message);
      });
    });
    accountButton.addEventListener("click", function () {
      if (!form.reportValidity()) return;
      setMessage("Creating authorized account...");
      createAccount(form.email.value.trim(), form.password.value)["catch"](function (error) {
        setMessage(error.message);
      });
    });
  }

  function setMessage(message) {
    var target = mount.querySelector("[data-connection-message]");
    if (target) target.textContent = message;
  }

  function renderLoading() {
    mount.innerHTML = '<section class="connection-screen"><div class="logo-mark">&#x1F319; &#x2B50; &#x1F319;</div><h1 class="wordmark">ODYSSEY</h1><article class="card"><div class="card-label">Recovery Connection</div><div class="card-title">Loading the original Command Center</div><div class="card-meta">Verifying MISSION-001 and reconnecting private records.</div></article></section>';
  }

  function renderError(message) {
    mount.innerHTML = '<section class="connection-screen"><div class="logo-mark">&#x1F319; &#x2B50; &#x1F319;</div><h1 class="wordmark">ODYSSEY</h1><article class="card"><div class="card-label">Connection Error</div><div class="card-title">The Command Center was not opened</div><div class="card-meta">' + escapeHtml(message) + '</div><button class="secondary-button" type="button" data-retry>Retry</button></article></section>';
    mount.querySelector("[data-retry]").addEventListener("click", loadWorkspace);
  }

  function missionFromRoute(route) {
    var match = String(route || "").match(/MISSION-00[1-4]/);
    return match ? match[0] : "MISSION-004";
  }

  function capture(title, route) {
    var notes = window.prompt("Add a short note for " + title + ":");
    if (!notes) return;
    var sourceUrl = window.prompt("Optional source URL:", "") || null;
    request("/rest/v1/mobile_intake", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        client_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title: title,
        notes: notes,
        source_url: sourceUrl,
        mission: missionFromRoute(route),
        captured_at: new Date().toISOString()
      })
    }).then(function () {
      window.alert("Captured to the Odyssey review queue.");
      return loadWorkspace();
    })["catch"](function (error) {
      window.alert("Capture was not saved: " + error.message);
    });
  }

  function start(nextMount, nextApplyData, nextRenderApp) {
    mount = nextMount;
    applyData = nextApplyData;
    renderApp = nextRenderApp;
    ensureSession().then(refreshPrivateSources).then(loadWorkspace)["catch"](function () {
      renderSignIn();
    });
  }

  window.OdysseyConnection = {
    start: start,
    capture: capture
  };
}());
