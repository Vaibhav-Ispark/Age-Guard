(function () {
  if (window.__ageGuardLoaded) return;
  window.__ageGuardLoaded = true;

  function hexToRgba(hex, opacity) {
    var value = String(hex || "#000000").replace("#", "");
    var r = parseInt(value.slice(0, 2), 16) || 0;
    var g = parseInt(value.slice(2, 4), 16) || 0;
    var b = parseInt(value.slice(4, 6), 16) || 0;
    return "rgba(" + r + "," + g + "," + b + "," + Math.max(0, Math.min(100, opacity)) / 100 + ")";
  }

  function getCookie(name) {
    return document.cookie.split("; ").find(function (row) {
      return row.indexOf(name + "=") === 0;
    });
  }

  function setCookie(name, days) {
    var expires = new Date();
    expires.setDate(expires.getDate() + Number(days || 30));
    document.cookie = name + "=true; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";
  }

  function postEvent(endpoint, payload) {
    if (!endpoint) return;
    fetch(endpoint, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(function () {});
  }

  function matchesPattern(pattern) {
    var path = window.location.pathname;
    var escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp("^" + escaped + "$").test(path);
  }

  function shouldShow(settings, root) {
    var targeting = settings.targeting;
    var isLoggedIn = root.dataset.customerAuthenticated === "true";
    var tags = (root.dataset.customerTags || "").split(",").filter(Boolean);

    if (targeting.customerShowTo === "guests" && isLoggedIn) return false;
    if (targeting.customerShowTo === "logged-in" && !isLoggedIn) return false;
    if (targeting.bypassLoggedIn && isLoggedIn) return false;
    if (targeting.bypassTags.some(function (tag) { return tags.indexOf(tag) >= 0; })) return false;
    if (targeting.showOn === "homepage" && window.location.pathname !== "/") return false;
    if (targeting.showOn === "specific" && !targeting.specificPages.some(matchesPattern)) return false;
    if (targeting.showOn === "exclude" && targeting.excludePages.some(matchesPattern)) return false;

    return true;
  }

  function makeButton(label, styles) {
    var button = document.createElement("button");
    button.className = "age-guard-button";
    button.type = "button";
    button.textContent = label;
    Object.keys(styles).forEach(function (key) {
      button.style[key] = styles[key];
    });
    return button;
  }

  function render(root, config) {
    if (!config.enabled || !config.settings || !shouldShow(config.settings, root)) return;

    var settings = config.settings;
    var design = settings.design;
    var type = design.popupType;
    var verification = settings.verification;
    var cookieName = verification.cookieName || "age_guard_verified";

    if (!verification.reverifyOnNewSession && getCookie(cookieName)) return;

    var isMobile = window.matchMedia("(max-width: 480px)").matches;
    var typography = settings.typography;
    var buttons = settings.buttons;
    var customCss = [typography.customCss, buttons.customCss].filter(Boolean).join("\n");
    var overlay = document.createElement("div");
    overlay.className = "age-guard-overlay age-guard-" + type;
    overlay.style.background = hexToRgba(design.overlayColor, design.overlayOpacity);

    var popup = document.createElement("section");
    popup.className = "age-guard-popup age-guard-animate-" + design.animation;
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.style.maxWidth = type === "full-screen" ? "none" : design.maxWidth + "px";
    popup.style.minHeight = type === "full-screen" ? "100vh" : "auto";
    popup.style.borderRadius = type === "bottom-bar" ? design.borderRadius + "px " + design.borderRadius + "px 0 0" : design.borderRadius + "px";
    popup.style.backgroundColor = hexToRgba(design.backgroundColor, design.backgroundOpacity);
    popup.style.boxShadow = design.boxShadow ? "0 22px 60px " + hexToRgba(design.shadowColor, 30) : "none";

    if (customCss) {
      var style = document.createElement("style");
      style.textContent = customCss;
      popup.appendChild(style);
    }

    if (design.backgroundImage) {
      popup.style.backgroundImage = "url(" + design.backgroundImage + ")";
      popup.style.backgroundPosition = design.backgroundPosition;
      popup.style.backgroundRepeat = "no-repeat";
      popup.style.backgroundSize = design.backgroundSize === "custom" ? design.backgroundCustomSize + "%" : design.backgroundSize;
    }

    if (design.logoImage) {
      var logo = document.createElement("img");
      logo.className = "age-guard-logo " + design.logoPosition;
      logo.alt = "";
      logo.src = design.logoImage;
      logo.style.width = (isMobile ? design.logoWidthMobile : design.logoWidthDesktop) + "px";
      logo.style.marginTop = design.logoMarginTop + "px";
      logo.style.marginBottom = design.logoMarginBottom + "px";
      popup.appendChild(logo);
    }

    var heading = document.createElement("h2");
    heading.className = "age-guard-heading";
    heading.textContent = typography.headingText;
    heading.style.fontFamily = typography.headingFontFamily;
    heading.style.fontSize = (isMobile ? typography.headingFontSizeMobile : typography.headingFontSizeDesktop) + "px";
    heading.style.fontWeight = typography.headingFontWeight;
    heading.style.color = typography.headingColor;
    heading.style.textAlign = typography.headingAlign;
    heading.style.letterSpacing = typography.headingLetterSpacing + "px";
    heading.style.lineHeight = typography.headingLineHeight;
    popup.appendChild(heading);

    var description = document.createElement("p");
    description.className = "age-guard-description";
    description.textContent = typography.descriptionText;
    description.style.fontFamily = typography.descriptionFontFamily;
    description.style.fontSize = (isMobile ? typography.descriptionFontSizeMobile : typography.descriptionFontSizeDesktop) + "px";
    description.style.fontWeight = typography.descriptionFontWeight;
    description.style.color = typography.descriptionColor;
    description.style.textAlign = typography.descriptionAlign;
    description.style.letterSpacing = typography.descriptionLetterSpacing + "px";
    description.style.lineHeight = typography.descriptionLineHeight;
    popup.appendChild(description);

    var methodWrap = document.createElement("div");
    methodWrap.className = "age-guard-fields";
    if (verification.method === "dob") {
      ["DD", "MM", "YYYY"].forEach(function (placeholder) {
        var input = document.createElement("input");
        input.inputMode = "numeric";
        input.placeholder = placeholder;
        methodWrap.appendChild(input);
      });
    } else if (verification.method === "checkbox") {
      var label = document.createElement("label");
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" I confirm I am " + verification.minimumAge + "+"));
      methodWrap.appendChild(label);
    } else if (verification.method === "age-input") {
      var ageInput = document.createElement("input");
      ageInput.inputMode = "numeric";
      ageInput.placeholder = "Age";
      methodWrap.appendChild(ageInput);
    }
    popup.appendChild(methodWrap);

    var min = document.createElement("p");
    min.className = "age-guard-minimum";
    min.textContent = typography.minimumAgeText.replace("18", verification.minimumAge);
    min.style.color = typography.minimumAgeColor;
    min.style.fontSize = (isMobile ? typography.minimumAgeFontSizeMobile : typography.minimumAgeFontSizeDesktop) + "px";
    min.style.fontWeight = typography.minimumAgeBold ? "700" : "400";
    min.style.fontStyle = typography.minimumAgeItalic ? "italic" : "normal";
    popup.appendChild(min);

    var buttonRow = document.createElement("div");
    buttonRow.className = "age-guard-buttons";
    buttonRow.style.flexDirection = buttons.layout === "stacked" ? "column" : "row";
    buttonRow.style.gap = buttons.gap + "px";

    var enter = makeButton(buttons.enterLabel, {
      background: buttons.enterBackgroundColor,
      border: buttons.enterBorderWidth + "px solid " + buttons.enterBorderColor,
      borderRadius: buttons.enterBorderRadius + "px",
      color: buttons.enterTextColor,
      fontSize: (isMobile ? buttons.enterFontSizeMobile : buttons.enterFontSizeDesktop) + "px",
      fontWeight: String(buttons.enterFontWeight),
      padding: buttons.enterPaddingY + "px " + buttons.enterPaddingX + "px",
      width: buttons.enterFullWidth ? "100%" : "auto",
    });
    enter.className += " age-guard-enter-button";
    enter.addEventListener("click", function () {
      setCookie(cookieName, verification.rememberDays);
      postEvent(root.dataset.eventEndpoint, { shop: root.dataset.shop, outcome: "pass", page: window.location.pathname });
      overlay.remove();
      document.documentElement.classList.remove("age-guard-lock");
    });
    buttonRow.appendChild(enter);

    if (buttons.showExitButton) {
      var exit = makeButton(buttons.exitLabel, {
        background: buttons.exitBackgroundColor,
        border: buttons.exitBorderWidth + "px solid " + buttons.exitBorderColor,
        borderRadius: buttons.exitBorderRadius + "px",
        color: buttons.exitTextColor,
        fontSize: (isMobile ? buttons.exitFontSizeMobile : buttons.exitFontSizeDesktop) + "px",
        fontWeight: String(buttons.exitFontWeight),
        padding: buttons.exitPaddingY + "px " + buttons.exitPaddingX + "px",
        width: buttons.exitFullWidth ? "100%" : "auto",
      });
      exit.className += " age-guard-exit-button";
      exit.addEventListener("click", function () {
        postEvent(root.dataset.eventEndpoint, { shop: root.dataset.shop, outcome: "block", page: window.location.pathname });
        window.location.href = buttons.exitRedirectUrl || "about:blank";
      });
      buttonRow.appendChild(exit);
    }

    popup.appendChild(buttonRow);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    document.documentElement.classList.add("age-guard-lock");
  }

  function init(root) {
    var endpoint = root.dataset.configEndpoint + "?shop=" + encodeURIComponent(root.dataset.shop);
    fetch(endpoint, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          console.error("[AgeGuard] Config fetch failed:", response.status, endpoint);
          return null;
        }
        return response.json();
      })
      .then(function (config) {
        if (!config) return;
        console.log("[AgeGuard] Config loaded:", config.enabled, "settings:", !!config.settings);
        render(root, config);
      })
      .catch(function (err) {
        console.error("[AgeGuard] Error:", err, endpoint);
      });
  }

  document.querySelectorAll("[data-age-guard-root]").forEach(init);
})();
