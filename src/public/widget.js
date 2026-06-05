(function () {
  var currentScript = document.currentScript;

  if (!currentScript) {
    return;
  }

  var defaults = {
    symbols: "USD,EUR,CNY",
    cryptoSymbols: "BTC,ETH,USDT",
    widgetType: "rates",
    theme: "light",
    round: 2,
    branding: true,
    apiBase: "",
    width: "card",
    fontSize: "medium",
    radius: 16,
    showUsd: true,
    showRub: true,
    showChange: true
  };

  function getThemePalette(theme) {
    if (theme === "dark") {
      return {
        background: "#172033",
        border: "#2b3a59",
        title: "#f7f9fc",
        text: "#d5deed",
        accent: "#7dd3fc",
        muted: "#8ea0bf",
        positive: "#7ce6a2",
        negative: "#ff8d8d"
      };
    }

    return {
      background: "#ffffff",
      border: "#d7e0ef",
      title: "#172033",
      text: "#4f5d75",
      accent: "#0f6fc6",
      muted: "#70819d",
      positive: "#138a4f",
      negative: "#c84343"
    };
  }

  function parseSymbols(value, fallback) {
    return (value || fallback)
      .split(",")
      .map(function (symbol) {
        return symbol.trim().toUpperCase();
      })
      .filter(Boolean);
  }

  function parseWidgetType(scriptElement) {
    var rawValue = String(scriptElement.dataset.mode || scriptElement.dataset.widgetType || defaults.widgetType).toLowerCase();

    if (rawValue === "converter" || rawValue === "crypto") {
      return rawValue;
    }

    return "rates";
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

  function parseBoolean(value, fallback) {
    if (value == null || value === "") {
      return fallback;
    }

    return String(value).toLowerCase() !== "false";
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
    var widgetType = parseWidgetType(scriptElement);
    var theme = scriptElement.dataset.theme === "dark" ? "dark" : defaults.theme;
    var palette = getThemePalette(theme);
    var defaultSymbols = widgetType === "crypto" ? defaults.cryptoSymbols : defaults.symbols;

    return {
      widgetType: widgetType,
      symbols: parseSymbols(scriptElement.dataset.symbols, defaultSymbols),
      theme: theme,
      round: parseRound(scriptElement.dataset.round),
      branding: parseBoolean(scriptElement.dataset.branding, defaults.branding),
      apiBase: scriptElement.dataset.apiBase || defaults.apiBase,
      width: parseWidth(scriptElement.dataset.width),
      fontSize: parseFontSize(scriptElement.dataset.fontSize),
      radius: parseRadius(scriptElement.dataset.radius),
      bgColor: sanitizeColor(scriptElement.dataset.bgColor, palette.background),
      textColor: sanitizeColor(scriptElement.dataset.textColor, palette.text),
      accentColor: sanitizeColor(scriptElement.dataset.accentColor, palette.accent),
      showUsd: parseBoolean(scriptElement.dataset.showUsd, defaults.showUsd),
      showRub: parseBoolean(scriptElement.dataset.showRub, defaults.showRub),
      showChange: parseBoolean(scriptElement.dataset.showChange, defaults.showChange)
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
    var title = config.theme === "dark" ? palette.title : "#172033";
    var accent = config.accentColor;
    var muted = hexToRgba(text, 0.72, config.theme === "dark" ? "#a5b4cf" : palette.muted);
    var border = hexToRgba(accent, 0.2, palette.border);
    var softAccent = hexToRgba(accent, config.theme === "dark" ? 0.12 : 0.08, background);
    var chipAccent = hexToRgba(accent, 0.12, border);
    var shadow = config.theme === "dark"
      ? "0 12px 32px rgba(2,8,23,.36)"
      : "0 12px 32px rgba(15,23,42,.08)";

    return [
      '.rubleapi-widget{font-family:system-ui,-apple-system,blinkmacsystemfont,"Segoe UI",sans-serif;box-sizing:border-box;width:' + sizing.width + ";max-width:" + sizing.maxWidth + ";border:1px solid " + border + ";border-radius:" + config.radius + "px;background:" + background + ";color:" + text + ";padding:16px;box-shadow:" + shadow + ";font-size:" + typography.base + "px}",
      ".rubleapi-widget *{box-sizing:border-box}",
      ".rubleapi-title{margin:0 0 12px;font-size:" + typography.title + "px;font-weight:700;color:" + title + "}",
      ".rubleapi-subtitle{margin:0 0 12px;font-size:" + typography.meta + "px;line-height:1.55;color:" + muted + "}",
      ".rubleapi-list{list-style:none;padding:0;margin:0 0 14px}",
      ".rubleapi-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid " + border + "}",
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
      ".rubleapi-crypto-row{display:grid;gap:4px;min-width:0;flex:1}",
      ".rubleapi-crypto-head{display:flex;align-items:center;justify-content:space-between;gap:12px}",
      ".rubleapi-crypto-name{display:grid;gap:2px;min-width:0}",
      ".rubleapi-crypto-code{font-size:" + typography.symbol + "px;font-weight:700;color:" + title + "}",
      ".rubleapi-crypto-label{font-size:" + typography.meta + "px;color:" + muted + "}",
      ".rubleapi-crypto-prices{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px 10px}",
      ".rubleapi-crypto-price{font-size:" + typography.value + "px;font-weight:600;color:" + accent + "}",
      ".rubleapi-crypto-change{font-size:" + typography.meta + "px;font-weight:700}",
      ".rubleapi-crypto-change.is-positive{color:" + palette.positive + "}",
      ".rubleapi-crypto-change.is-negative{color:" + palette.negative + "}",
      ".rubleapi-meta{display:flex;flex-direction:column;gap:4px;margin-top:14px;font-size:" + typography.meta + "px;color:" + muted + "}",
      ".rubleapi-branding{margin-top:10px;font-size:" + typography.meta + "px;font-weight:600;color:" + accent + "}",
      '.rubleapi-error{font-family:system-ui,-apple-system,blinkmacsystemfont,"Segoe UI",sans-serif;width:' + sizing.width + ";max-width:" + sizing.maxWidth + ";border:1px solid #f0c7c7;border-radius:" + config.radius + "px;background:#fff7f7;color:#a33a3a;padding:16px;font-size:" + typography.base + "px}"
    ].join("");
  }

  function formatRubValue(value, round) {
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

  function formatUsdValue(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value >= 100 ? 2 : 4,
      maximumFractionDigits: value >= 100 ? 2 : 4
    }).format(value);
  }

  function formatPriceRub(value) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: value >= 100 ? 2 : 4,
      maximumFractionDigits: value >= 100 ? 2 : 4
    }).format(value);
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) {
      return "";
    }

    var formatter = new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return (value > 0 ? "+" : "") + formatter.format(value) + "%";
  }

  function formatDateTime(value) {
    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(date);
  }

  function getDisplayRate(rate) {
    var nominal = Number(rate.nominal);
    var value = Number(rate.value);
    var code = String(rate.code || "").toUpperCase();
    var shouldNormalizeSingleUnit = (code === "TRY" || code === "THB") && nominal > 1 && Number.isFinite(value);

    return {
      code: code,
      nominal: shouldNormalizeSingleUnit ? 1 : nominal,
      value: shouldNormalizeSingleUnit ? value / nominal : value,
      name: rate.name || ""
    };
  }

  function formatSymbolLabel(rate) {
    var displayRate = getDisplayRate(rate);
    var code = displayRate.code;

    if (!displayRate.nominal || displayRate.nominal === 1) {
      return code;
    }

    return formatNominal(displayRate.nominal) + " " + code;
  }

  function formatCurrencyTitle(rate) {
    var displayRate = getDisplayRate(rate);
    var code = displayRate.code;

    if (!displayRate.nominal || displayRate.nominal === 1) {
      return code;
    }

    return formatNominal(displayRate.nominal) + " " + code;
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

  function sortAssetsBySymbols(assets, symbols) {
    var byCode = {};

    assets.forEach(function (asset) {
      byCode[String(asset.symbol || "").toUpperCase()] = asset;
    });

    return symbols
      .map(function (symbol) {
        return byCode[String(symbol || "").toUpperCase()];
      })
      .filter(Boolean);
  }

  function renderError(root, config) {
    var message = config.widgetType === "crypto"
      ? "Не удалось загрузить курсы криптовалют"
      : "Не удалось загрузить курсы валют";

    root.innerHTML = "<style>" + buildStyles(config) + '</style><div class="rubleapi-error">' + message + "</div>";
  }

  function renderRatesWidget(root, config, payload) {
    var orderedRates = sortRatesBySymbols(payload.rates || [], config.symbols);
    var displayRates = orderedRates.map(getDisplayRate);
    var styleTag = "<style>" + buildStyles(config) + "</style>";
    var hasExtendedNominal = displayRates.some(function (rate) {
      return Number(rate.nominal) > 1;
    });
    var ratesHtml = displayRates
      .map(function (rate) {
        return [
          '<li class="rubleapi-item">',
          '<span class="rubleapi-symbol">' + escapeHtml(formatSymbolLabel(rate)) + "</span>",
          '<span class="rubleapi-value">' + escapeHtml(formatRubValue(rate.value, config.round)) + "</span>",
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
      var displayRate = getDisplayRate(selectedRate);

      pairLabel.textContent = direction === "from-rub" ? "RUB -> " + code : code + " -> RUB";
      nominalNote.textContent = Number(displayRate.nominal) > 1
        ? "Курс показан за " + formatCurrencyTitle(displayRate) + " по данным ЦБ РФ."
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

  function renderCryptoWidget(root, config, payload) {
    var orderedAssets = sortAssetsBySymbols(payload.assets || [], config.symbols);

    if (!orderedAssets.length) {
      renderError(root, config);
      return;
    }

    var styleTag = "<style>" + buildStyles(config) + "</style>";
    var brandingHtml = config.branding
      ? '<div class="rubleapi-branding">Данные: RubleAPI</div>'
      : "";
    var assetsHtml = orderedAssets
      .map(function (asset) {
        var prices = [];

        if (config.showUsd) {
          prices.push('<span class="rubleapi-crypto-price">' + escapeHtml(formatUsdValue(asset.priceUsd)) + "</span>");
        }

        if (config.showRub) {
          prices.push('<span class="rubleapi-crypto-price">' + escapeHtml(formatPriceRub(asset.priceRub)) + "</span>");
        }

        if (!prices.length) {
          prices.push('<span class="rubleapi-crypto-price">' + escapeHtml(formatUsdValue(asset.priceUsd)) + "</span>");
        }

        var changeClass = Number(asset.change24hPercent) >= 0 ? "is-positive" : "is-negative";
        var changeHtml = config.showChange && asset.change24hPercent != null
          ? '<span class="rubleapi-crypto-change ' + changeClass + '">' + escapeHtml(formatPercent(asset.change24hPercent)) + " за 24 часа</span>"
          : "";

        return [
          '<li class="rubleapi-item">',
          '<div class="rubleapi-crypto-row">',
          '<div class="rubleapi-crypto-head">',
          '<div class="rubleapi-crypto-name">',
          '<span class="rubleapi-crypto-code">' + escapeHtml(asset.symbol) + "</span>",
          '<span class="rubleapi-crypto-label">' + escapeHtml(asset.name) + "</span>",
          "</div>",
          '<div class="rubleapi-crypto-prices">' + prices.join("") + "</div>",
          "</div>",
          changeHtml,
          "</div>",
          "</li>"
        ].join("");
      })
      .join("");

    root.innerHTML = [
      styleTag,
      '<div class="rubleapi-widget">',
      '<h3 class="rubleapi-title">Курсы криптовалют</h3>',
      '<p class="rubleapi-subtitle">Компактный информер с актуальными курсами выбранных криптовалют.</p>',
      '<ul class="rubleapi-list">' + assetsHtml + "</ul>",
      '<div class="rubleapi-meta">',
      "<div>Обновлено: " + escapeHtml(formatDateTime(payload.updatedAt)) + "</div>",
      "<div>Источник: " + escapeHtml(payload.source || "CoinGecko") + "</div>",
      "</div>",
      brandingHtml,
      "</div>"
    ].join("");
  }

  async function loadPayload(apiUrl) {
    var response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load widget payload");
    }

    return response.json();
  }

  async function bootstrap() {
    var config = getConfig(currentScript);
    var mount = createMount(currentScript);
    var apiBase = config.apiBase || currentScript.src;
    var apiPath = config.widgetType === "crypto" ? "/api/crypto/latest" : "/api/rates/latest";
    var apiUrl = new URL(apiPath, apiBase);

    apiUrl.searchParams.set("symbols", config.symbols.join(",").toLowerCase());

    try {
      var payload = await loadPayload(apiUrl.toString());

      if (config.widgetType === "converter") {
        renderConverter(mount.root, config, payload);
        return;
      }

      if (config.widgetType === "crypto") {
        renderCryptoWidget(mount.root, config, payload);
        return;
      }

      renderRatesWidget(mount.root, config, payload);
    } catch (error) {
      renderError(mount.root, config);
    }
  }

  bootstrap();
})();
