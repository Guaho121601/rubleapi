(function () {
  var currentScript = document.currentScript;

  if (!currentScript) {
    return;
  }

  var defaults = {
    symbols: "USD,EUR,CNY",
    theme: "light",
    round: 2,
    branding: true,
  };

  function parseSymbols(value) {
    return (value || defaults.symbols)
      .split(",")
      .map(function (symbol) {
        return symbol.trim().toUpperCase();
      })
      .filter(Boolean);
  }

  function parseRound(value) {
    var parsed = Number.parseInt(value || String(defaults.round), 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return defaults.round;
    }

    return Math.min(parsed, 6);
  }

  function parseBranding(value) {
    if (value == null) {
      return defaults.branding;
    }

    return value !== "false";
  }

  function getConfig(scriptElement) {
    return {
      symbols: parseSymbols(scriptElement.dataset.symbols),
      theme: scriptElement.dataset.theme === "dark" ? "dark" : defaults.theme,
      round: parseRound(scriptElement.dataset.round),
      branding: parseBranding(scriptElement.dataset.branding),
    };
  }

  function createMount(scriptElement) {
    var host = document.createElement("div");
    host.className = "rubleapi-host";

    if (scriptElement.parentNode) {
      scriptElement.parentNode.insertBefore(host, scriptElement.nextSibling);
    }

    if (host.attachShadow) {
      return {
        host: host,
        root: host.attachShadow({ mode: "open" }),
      };
    }

    return {
      host: host,
      root: host,
    };
  }

  function buildStyles(theme) {
    var isDark = theme === "dark";
    var background = isDark ? "#172033" : "#ffffff";
    var border = isDark ? "#2b3a59" : "#d7e0ef";
    var title = isDark ? "#f7f9fc" : "#172033";
    var text = isDark ? "#d5deed" : "#4f5d75";
    var accent = isDark ? "#7dd3fc" : "#0f6fc6";
    var muted = isDark ? "#8ea0bf" : "#70819d";

    return [
      ".rubleapi-widget{font-family:Arial,sans-serif;box-sizing:border-box;max-width:360px;border:1px solid " + border + ";border-radius:14px;background:" + background + ";color:" + text + ";padding:16px;box-shadow:0 12px 32px rgba(15,23,42,.08)}",
      ".rubleapi-widget *{box-sizing:border-box}",
      ".rubleapi-title{margin:0 0 12px;font-size:18px;font-weight:700;color:" + title + "}",
      ".rubleapi-list{list-style:none;padding:0;margin:0 0 14px}",
      ".rubleapi-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid " + border + "}",
      ".rubleapi-item:last-child{border-bottom:none;padding-bottom:0}",
      ".rubleapi-symbol{font-size:14px;font-weight:700;color:" + title + "}",
      ".rubleapi-value{font-size:15px;font-weight:600;color:" + accent + ";white-space:nowrap}",
      ".rubleapi-meta{display:flex;flex-direction:column;gap:4px;margin-top:14px;font-size:12px;color:" + muted + "}",
      ".rubleapi-branding{margin-top:10px;font-size:12px;font-weight:600;color:" + accent + "}",
      ".rubleapi-error{font-family:Arial,sans-serif;max-width:360px;border:1px solid #f0c7c7;border-radius:14px;background:#fff7f7;color:#a33a3a;padding:16px;font-size:14px}",
    ].join("");
  }

  function formatValue(value, round) {
    return value.toFixed(round).replace(".", ",") + " ₽";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderError(root) {
    root.innerHTML =
      '<div class="rubleapi-error">Не удалось загрузить курсы валют</div>';
  }

  function renderWidget(root, config, payload) {
    var styleTag = "<style>" + buildStyles(config.theme) + "</style>";
    var ratesHtml = payload.rates
      .map(function (rate) {
        return [
          '<li class="rubleapi-item">',
          '<span class="rubleapi-symbol">' + escapeHtml(rate.code) + "</span>",
          '<span class="rubleapi-value">' + escapeHtml(formatValue(rate.value, config.round)) + "</span>",
          "</li>",
        ].join("");
      })
      .join("");

    var brandingHtml = config.branding
      ? '<div class="rubleapi-branding">Данные: RubleAPI</div>'
      : "";

    root.innerHTML = [
      styleTag,
      '<div class="rubleapi-widget">',
      '<h3 class="rubleapi-title">Курсы валют</h3>',
      '<ul class="rubleapi-list">' + ratesHtml + "</ul>",
      '<div class="rubleapi-meta">',
      "<div>Дата курса: " + escapeHtml(payload.date) + "</div>",
      "<div>Источник: ЦБ РФ</div>",
      "</div>",
      brandingHtml,
      "</div>",
    ].join("");
  }

  async function loadRates(apiUrl) {
    var response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load rates");
    }

    return response.json();
  }

  async function bootstrap() {
    var config = getConfig(currentScript);
    var mount = createMount(currentScript);
    var apiUrl = new URL("/api/rates/latest", currentScript.src);

    apiUrl.searchParams.set("symbols", config.symbols.join(","));

    try {
      var payload = await loadRates(apiUrl.toString());
      renderWidget(mount.root, config, payload);
    } catch (error) {
      renderError(mount.root);
    }
  }

  bootstrap();
})();
