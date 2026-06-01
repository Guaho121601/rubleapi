(function () {
  var currentScript = document.currentScript;

  if (!currentScript) {
    return;
  }

  var defaults = {
    symbols: "USD,EUR,CNY",
    widgetType: "rates",
    theme: "light",
    round: 2,
    branding: true,
    apiBase: "",
    width: "card",
    fontSize: "medium",
    radius: 16
  };

  function getThemePalette(theme) {
    if (theme === "dark") {
      return {
        background: "#172033",
        border: "#2b3a59",
        title: "#f7f9fc",
        text: "#d5deed",
        accent: "#7dd3fc",
        muted: "#8ea0bf"
      };
    }

    return {
      background: "#ffffff",
      border: "#d7e0ef",
      title: "#172033",
      text: "#4f5d75",
      accent: "#0f6fc6",
      muted: "#70819d"
    };
  }

  function parseSymbols(value) {
    return (value || defaults.symbols)
      .split(",")
      .map(function (symbol) {
        return symbol.trim().toUpperCase();
      })
      .filter(Boolean);
  }

  function parseWidgetType(value) {
    return value === "converter" ? "converter" : defaults.widgetType;
  }

  function parseRound(value) {
    var parsed = Number.parseInt(value || String(defaults.round), 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return defaults.round;
    }

    return Math.min(parsed, 6);
  }

  function parseRadius(value) {
    var parsed = Number.parseInt(value || String(defaults.radius), 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return defaults.radius;
    }

    return Math.min(parsed, 24);
  }

  function parseBranding() {
    return defaults.branding;
  }

  function parseWidth(value) {
    if (value === "compact" || value === "full") {
      return value;
    }

    return defaults.width;
  }

  function parseFontSize(value) {
    if (value === "small" || value === "large") {
      return value;
    }

    return defaults.fontSize;
  }

  function sanitizeColor(value, fallback) {
    if (!value || typeof value !== "string") {
      return fallback;
    }

    var trimmed = value.trim();
    var isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed);
    var isRgb = /^rgba?\([\d\s.,%]+\)$/i.test(trimmed);

    if (isHex || isRgb) {
      return trimmed;
    }

    return fallback;
  }

  function hexToRgba(value, alpha, fallback) {
    var match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value || "");

    if (!match) {
      return fallback;
    }

    var hex = match[1];

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map(function (part) {
          return part + part;
        })
        .join("");
    }

    var r = Number.parseInt(hex.slice(0, 2), 16);
    var g = Number.parseInt(hex.slice(2, 4), 16);
    var b = Number.parseInt(hex.slice(4, 6), 16);

    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function getConfig(scriptElement) {
    var theme = scriptElement.dataset.theme === "dark" ? "dark" : defaults.theme;
    var palette = getThemePalette(theme);

    return {
      widgetType: parseWidgetType(scriptElement.dataset.widgetType),
      symbols: parseSymbols(scriptElement.dataset.symbols),
      theme: theme,
      round: parseRound(scriptElement.dataset.round),
      branding: parseBranding(scriptElement.dataset.branding),
      apiBase: scriptElement.dataset.apiBase || defaults.apiBase,
      width: parseWidth(scriptElement.dataset.width),
      fontSize: parseFontSize(scriptElement.dataset.fontSize),
      radius: parseRadius(scriptElement.dataset.radius),
      bgColor: sanitizeColor(scriptElement.dataset.bgColor, palette.background),
      textColor: sanitizeColor(scriptElement.dataset.textColor, palette.text),
      accentColor: sanitizeColor(scriptElement.dataset.accentColor, palette.accent)
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
        root: host.attachShadow({ mode: "open" })
      };
    }

    return {
      host: host,
      root: host
    };
  }

  function getTypography(fontSize) {
    if (fontSize === "small") {
      return {
        base: 13,
        title: 16,
        symbol: 13,
        value: 14,
        meta: 11
      };
    }

    if (fontSize === "large") {
      return {
        base: 17,
        title: 21,
        symbol: 16,
        value: 18,
        meta: 13
      };
    }

    return {
      base: 15,
      title: 18,
      symbol: 14,
      value: 15,
      meta: 12
    };
  }

  function getWidthStyles(width) {
    if (width === "compact") {
      return {
        width: "280px",
        maxWidth: "280px"
      };
    }

    if (width === "full") {
      return {
        width: "100%",
        maxWidth: "100%"
      };
    }

    return {
      width: "360px",
      maxWidth: "360px"
    };
  }

  function buildStyles(config) {
    var palette = getThemePalette(config.theme);
    var typography = getTypography(config.fontSize);
    var sizing = getWidthStyles(config.width);
    var background = config.bgColor;
    var text = config.textColor;
    var title = text;
    var accent = config.accentColor;
    var muted = hexToRgba(text, 0.72, config.theme === "dark" ? "#a5b4cf" : palette.muted);
    var border = hexToRgba(accent, 0.2, palette.border);
    var softAccent = hexToRgba(accent, config.theme === "dark" ? 0.12 : 0.08, background);
    var chipAccent = hexToRgba(accent, 0.12, border);
    var shadow = config.theme === "dark"
      ? "0 12px 32px rgba(2,8,23,.36)"
      : "0 12px 32px rgba(15,23,42,.08)";

    return [
      '.rubleapi-widget{font-family:system-ui,-apple-system,blinkmacsystemfont,"segoe ui",sans-serif;box-sizing:border-box;width:' + sizing.width + ";max-width:" + sizing.maxWidth + ";border:1px solid " + border + ";border-radius:" + config.radius + "px;background:" + background + ";color:" + text + ";padding:16px;box-shadow:" + shadow + ";font-size:" + typography.base + "px}",
      ".rubleapi-widget *{box-sizing:border-box}",
      ".rubleapi-title{margin:0 0 12px;font-size:" + typography.title + "px;font-weight:700;color:" + title + "}",
      ".rubleapi-subtitle{margin:0 0 12px;font-size:" + typography.meta + "px;line-height:1.55;color:" + muted + "}",
      ".rubleapi-list{list-style:none;padding:0;margin:0 0 14px}",
      ".rubleapi-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid " + border + "}",
      ".rubleapi-item:last-child{border-bottom:none;padding-bottom:0}",
      ".rubleapi-symbol{font-size:" + typography.symbol + "px;font-weight:700;color:" + title + "}",
      ".rubleapi-value{font-size:" + typography.value + "px;font-weight:600;color:" + accent + ";white-space:nowrap}",
      ".rubleapi-note{margin-top:12px;font-size:" + typography.meta + "px;line-height:1.5;color:" + muted + "}",
      ".rubleapi-converter{display:grid;gap:12px}",
      ".rubleapi-converter-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}",
      ".rubleapi-chip{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:" + chipAccent + ";color:" + accent + ";font-size:" + typography.meta + "px;font-weight:700}",
      ".rubleapi-field{display:grid;gap:8px}",
      ".rubleapi-field-label{font-size:" + typography.meta + "px;font-weight:700;letter-spacing:.02em;color:" + muted + "}",
      ".rubleapi-input,.rubleapi-select{width:100%;min-height:46px;padding:12px 14px;border:1px solid " + border + ";border-radius:" + Math.max(config.radius - 6, 8) + "px;background:" + background + ";color:" + title + ";font:inherit}",
      ".rubleapi-direction{display:grid;gap:8px}",
      ".rubleapi-direction-grid{display:grid;gap:8px}",
      ".rubleapi-direction-option{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid " + border + ";border-radius:" + Math.max(config.radius - 6, 8) + "px;background:" + softAccent + "}",
      ".rubleapi-direction-option input{margin:0;accent-color:" + accent + "}",
      ".rubleapi-result{padding:14px;border:1px solid " + border + ";border-radius:" + Math.max(config.radius - 4, 10) + "px;background:" + softAccent + "}",
      ".rubleapi-result-label{margin:0 0 6px;font-size:" + typography.meta + "px;color:" + muted + "}",
      ".rubleapi-result-value{margin:0;font-size:" + (typography.value + 6) + "px;line-height:1.2;font-weight:700;color:" + accent + "}",
      ".rubleapi-meta{display:flex;flex-direction:column;gap:4px;margin-top:14px;font-size:" + typography.meta + "px;color:" + muted + "}",
      ".rubleapi-branding{margin-top:10px;font-size:" + typography.meta + "px;font-weight:600;color:" + accent + "}",
      '.rubleapi-error{font-family:system-ui,-apple-system,blinkmacsystemfont,"segoe ui",sans-serif;width:' + sizing.width + ";max-width:" + sizing.maxWidth + ";border:1px solid #f0c7c7;border-radius:" + config.radius + "px;background:#fff7f7;color:#a33a3a;padding:16px;font-size:" + typography.base + "px}"
    ].join("");
  }

  function formatValue(value, round) {
    return value.toFixed(round).replace(".", ",") + " ₽";
  }

  function formatNominal(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function formatAmount(value, maximumFractionDigits) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maximumFractionDigits
    }).format(value);
  }

  function formatSymbolLabel(rate) {
    var code = String(rate.code || "").toLowerCase();

    if (!rate.nominal || rate.nominal === 1) {
      return code;
    }

    return formatNominal(rate.nominal) + " " + code;
  }

  function formatCurrencyTitle(rate) {
    var code = String(rate.code || "").toUpperCase();

    if (!rate.nominal || rate.nominal === 1) {
      return code;
    }

    return formatNominal(rate.nominal) + " " + code;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sortRatesBySymbols(rates, symbols) {
    var byCode = {};

    rates.forEach(function (rate) {
      byCode[String(rate.code || "").toUpperCase()] = rate;
    });

    return symbols
      .map(function (symbol) {
        return byCode[String(symbol || "").toUpperCase()];
      })
      .filter(Boolean);
  }

  function renderError(root, config) {
    root.innerHTML = "<style>" + buildStyles(config) + '</style><div class="rubleapi-error">Не удалось загрузить курсы валют</div>';
  }

  function renderRatesWidget(root, config, payload) {
    var orderedRates = sortRatesBySymbols(payload.rates || [], config.symbols);
    var styleTag = "<style>" + buildStyles(config) + "</style>";
    var hasExtendedNominal = orderedRates.some(function (rate) {
      return Number(rate.nominal) > 1;
    });
    var ratesHtml = orderedRates
      .map(function (rate) {
        return [
          '<li class="rubleapi-item">',
          '<span class="rubleapi-symbol">' + escapeHtml(formatSymbolLabel(rate)) + "</span>",
          '<span class="rubleapi-value">' + escapeHtml(formatValue(rate.value, config.round)) + "</span>",
          "</li>"
        ].join("");
      })
      .join("");
    var nominalNote = hasExtendedNominal
      ? '<div class="rubleapi-note">Для некоторых валют курс ЦБ РФ указан за 10 или 10 000 единиц.</div>'
      : "";
    var brandingHtml = config.branding
      ? '<div class="rubleapi-branding">Данные: RubleAPI</div>'
      : "";

    root.innerHTML = [
      styleTag,
      '<div class="rubleapi-widget">',
      '<h3 class="rubleapi-title">Курсы валют</h3>',
      '<ul class="rubleapi-list">' + ratesHtml + "</ul>",
      nominalNote,
      '<div class="rubleapi-meta">',
      "<div>Дата курса: " + escapeHtml(payload.date) + "</div>",
      "<div>Источник: ЦБ РФ</div>",
      "</div>",
      brandingHtml,
      "</div>"
    ].join("");
  }

  function getConverterResult(amount, rate, direction) {
    if (direction === "from-rub") {
      return amount / rate.value * rate.nominal;
    }

    return amount * rate.value / rate.nominal;
  }

  function renderConverter(root, config, payload) {
    var orderedRates = sortRatesBySymbols(payload.rates || [], config.symbols);

    if (!orderedRates.length) {
      renderError(root, config);
      return;
    }

    var styleTag = "<style>" + buildStyles(config) + "</style>";
    var optionsHtml = orderedRates
      .map(function (rate, index) {
        return '<option value="' + escapeHtml(String(rate.code || "").toUpperCase()) + '"' + (index === 0 ? " selected" : "") + ">" + escapeHtml(String(rate.code || "").toUpperCase()) + "</option>";
      })
      .join("");
    var brandingHtml = config.branding
      ? '<div class="rubleapi-branding">Данные: RubleAPI</div>'
      : "";

    root.innerHTML = [
      styleTag,
      '<div class="rubleapi-widget">',
      '<div class="rubleapi-converter">',
      '<div class="rubleapi-converter-top">',
      '<h3 class="rubleapi-title">Конвертер валют</h3>',
      '<div class="rubleapi-chip" data-role="pair-label"></div>',
      "</div>",
      '<p class="rubleapi-subtitle">Выберите валюту и направление пересчёта. Для некоторых валют курс ЦБ РФ указан не за 1 единицу, и это уже учтено.</p>',
      '<label class="rubleapi-field">',
      '<span class="rubleapi-field-label">Сумма</span>',
      '<input class="rubleapi-input" data-role="amount-input" type="number" min="0" step="any" value="1" inputmode="decimal" />',
      "</label>",
      '<label class="rubleapi-field">',
      '<span class="rubleapi-field-label">Валюта</span>',
      '<select class="rubleapi-select" data-role="currency-select">' + optionsHtml + "</select>",
      "</label>",
      '<div class="rubleapi-direction">',
      '<span class="rubleapi-field-label">Направление</span>',
      '<div class="rubleapi-direction-grid">',
      '<label class="rubleapi-direction-option"><input type="radio" name="rubleapi-direction" value="to-rub" checked /> <span>из валюты в рубли</span></label>',
      '<label class="rubleapi-direction-option"><input type="radio" name="rubleapi-direction" value="from-rub" /> <span>из рублей в валюту</span></label>',
      "</div>",
      "</div>",
      '<div class="rubleapi-result">',
      '<p class="rubleapi-result-label">Результат</p>',
      '<p class="rubleapi-result-value" data-role="result-value"></p>',
      "</div>",
      '<div class="rubleapi-note" data-role="nominal-note"></div>',
      '<div class="rubleapi-meta">',
      "<div>Дата курса: " + escapeHtml(payload.date) + "</div>",
      "<div>Источник: ЦБ РФ</div>",
      "</div>",
      brandingHtml,
      "</div>",
      "</div>"
    ].join("");

    var amountInput = root.querySelector('[data-role="amount-input"]');
    var currencySelect = root.querySelector('[data-role="currency-select"]');
    var resultValue = root.querySelector('[data-role="result-value"]');
    var pairLabel = root.querySelector('[data-role="pair-label"]');
    var nominalNote = root.querySelector('[data-role="nominal-note"]');

    function getSelectedDirection() {
      var selectedDirection = root.querySelector('input[name="rubleapi-direction"]:checked');
      return selectedDirection ? selectedDirection.value : "to-rub";
    }

    function getSelectedRate() {
      var selectedCode = String(currencySelect.value || orderedRates[0].code || "").toUpperCase();

      return orderedRates.find(function (rate) {
        return String(rate.code || "").toUpperCase() === selectedCode;
      }) || orderedRates[0];
    }

    function updateResult() {
      var amount = Number.parseFloat(String(amountInput.value || "").replace(",", "."));
      var selectedRate = getSelectedRate();
      var direction = getSelectedDirection();
      var code = String(selectedRate.code || "").toUpperCase();

      pairLabel.textContent = direction === "from-rub" ? "RUB -> " + code : code + " -> RUB";
      nominalNote.textContent = Number(selectedRate.nominal) > 1
        ? "Курс показан за " + formatCurrencyTitle(selectedRate) + " по данным ЦБ РФ."
        : "Курс показан по данным ЦБ РФ.";

      if (!Number.isFinite(amount)) {
        resultValue.textContent = "Введите сумму";
        return;
      }

      var result = getConverterResult(amount, selectedRate, direction);
      var decimals = result >= 100 ? 2 : 4;
      var suffix = direction === "from-rub" ? " " + code : " ₽";

      resultValue.textContent = formatAmount(result, decimals) + suffix;
    }

    amountInput.addEventListener("input", updateResult);
    currencySelect.addEventListener("change", updateResult);
    Array.prototype.slice.call(root.querySelectorAll('input[name="rubleapi-direction"]')).forEach(function (input) {
      input.addEventListener("change", updateResult);
    });

    updateResult();
  }

  async function loadRates(apiUrl) {
    var response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load rates");
    }

    return response.json();
  }

  async function bootstrap() {
    var config = getConfig(currentScript);
    var mount = createMount(currentScript);
    var apiBase = config.apiBase || currentScript.src;
    var apiUrl = new URL("/api/rates/latest", apiBase);

    apiUrl.searchParams.set("symbols", config.symbols.join(","));

    try {
      var payload = await loadRates(apiUrl.toString());

      if (config.widgetType === "converter") {
        renderConverter(mount.root, config, payload);
      } else {
        renderRatesWidget(mount.root, config, payload);
      }
    } catch (error) {
      renderError(mount.root, config);
    }
  }

  bootstrap();
})();
