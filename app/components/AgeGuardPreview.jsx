/* eslint-disable react/prop-types */
import { useState } from "react";
import { useLocation } from "react-router";

function hexToRgba(hex, opacity = 100) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) || 0;
  const g = parseInt(value.slice(2, 4), 16) || 0;
  const b = parseInt(value.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
}

export function DeviceFontInput({
  label,
  value,
  onChange,
  min = 8,
  max = 96,
  device = "desktop",
}) {
  return (
    <label className="ag-field">
      <span className="ag-label">
        <span aria-hidden="true">{device === "mobile" ? "Mobile" : "Desktop"}</span>
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function ColorOpacityInput({ label, color, opacity, onColor, onOpacity }) {
  return (
    <div className="ag-color-row">
      <label className="ag-field">
        <span className="ag-label">{label}</span>
        <span className="ag-color-control">
          <input
            aria-label={`${label} color`}
            type="color"
            value={color}
            onChange={(event) => onColor(event.target.value)}
          />
          <input
            aria-label={`${label} hex`}
            type="text"
            value={color}
            pattern="^#[0-9a-fA-F]{6}$"
            onChange={(event) => onColor(event.target.value)}
          />
        </span>
      </label>
      {onOpacity ? (
        <label className="ag-field ag-opacity">
          <span className="ag-label">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(event) => onOpacity(Number(event.target.value))}
          />
          <output>{opacity}%</output>
        </label>
      ) : null}
    </div>
  );
}

export function SettingsShell({ active, children, preview, dirty, onSave, onDiscard }) {
  const { search } = useLocation();
  const embeddedHref = (path) => `${path}${search}`;
  const links = [
    ["design", "/app/settings/design", "Design"],
    ["typography", "/app/settings/typography", "Typography"],
    ["buttons", "/app/settings/buttons", "Buttons"],
    ["verification", "/app/settings/verification", "Verification"],
    ["targeting", "/app/settings/targeting", "Targeting"],
  ];

  return (
    <div className="ag-settings-layout">
      <aside className="ag-sidebar" aria-label="Settings navigation">
        {links.map(([key, href, label]) => (
          <a className={active === key ? "active" : ""} href={embeddedHref(href)} key={key}>
            {label}
          </a>
        ))}
      </aside>
      <main className="ag-settings-main">
        {dirty ? (
          <div className="ag-dirty-banner" role="alert">
            <span>You have unsaved changes.</span>
            <div>
              <button className="ag-btn ag-btn-secondary" type="button" onClick={onDiscard}>
                Discard
              </button>
              <button className="ag-btn ag-btn-primary" type="button" onClick={onSave}>
                Save
              </button>
            </div>
          </div>
        ) : null}
        {children}
      </main>
      {preview}
    </div>
  );
}

export function LivePreview({ enabled = true, settings, device, onDeviceChange }) {
  const { search } = useLocation();
  const { design, typography, buttons, verification } = settings;
  const isMobile = device === "mobile";
  const width = device === "desktop" ? 720 : device === "tablet" ? 620 : 390;
  const popupWidth =
    design.popupType === "full-screen"
      ? "100%"
      : design.popupType === "bottom-bar"
        ? "100%"
        : Math.min(design.maxWidth, width - 32);
  const popupStyle = {
    width: popupWidth,
    maxWidth: design.popupType === "full-screen" ? "none" : design.maxWidth,
    borderRadius: design.popupType === "bottom-bar" ? `${design.borderRadius}px ${design.borderRadius}px 0 0` : design.borderRadius,
    backgroundColor: hexToRgba(
      design.backgroundColor,
      design.backgroundOpacity,
    ),
    boxShadow: design.boxShadow
      ? `0 22px 60px ${hexToRgba(design.shadowColor, 30)}`
      : "none",
    backgroundPosition: design.backgroundPosition,
    backgroundSize:
      design.backgroundSize === "custom"
        ? `${design.backgroundCustomSize}%`
        : design.backgroundSize,
    "--ag-bg-image": design.backgroundImage
      ? `url(${design.backgroundImage})`
      : "none",
    "--ag-bg-position": design.backgroundPosition,
    "--ag-bg-size":
      design.backgroundSize === "custom"
        ? `${design.backgroundCustomSize}%`
        : design.backgroundSize,
    "--ag-bg-opacity": design.backgroundImageOpacity / 100,
    "--ag-bg-blur": `${design.backgroundBlur}px`,
  };

  const buttonLayout = buttons.layout === "stacked" || isMobile ? "column" : "row";
  const buttonBase = {
    borderRadius: buttons.enterBorderRadius,
    fontSize: isMobile
      ? buttons.enterFontSizeMobile
      : buttons.enterFontSizeDesktop,
    fontWeight: buttons.enterFontWeight,
    padding: `${buttons.enterPaddingY}px ${buttons.enterPaddingX}px`,
  };

  return (
    <aside className="ag-preview-panel">
      <style>{`${typography.customCss || ""}\n${buttons.customCss || ""}`}</style>
      <div className="ag-preview-toolbar">
        <div>
          <strong>Live preview</strong>
          <span>{device === "mobile" ? "390px mobile" : device}</span>
        </div>
        <div className="ag-segments">
          {["desktop", "tablet", "mobile"].map((option) => (
            <button
              className={device === option ? "active" : ""}
              key={option}
              type="button"
              onClick={() => onDeviceChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="ag-preview-actions">
        <button
          className="ag-btn ag-btn-secondary"
          type="button"
          onClick={() => window.open(`/app/preview${search}`, "_blank")}
        >
          Open in new tab
        </button>
        <button className="ag-btn ag-btn-secondary" type="button" onClick={() => window.location.reload()}>
          Refresh preview
        </button>
      </div>
      <div className="ag-device-wrap">
        <div className={`ag-device ${device}`} style={{ width }}>
          <div
            className={`ag-preview-stage ${design.popupType}`}
            style={{
              "--ag-overlay": hexToRgba(
                design.overlayColor,
                design.overlayOpacity,
              ),
            }}
          >
            {enabled ? (
              <div
                className={`ag-popup-preview age-guard-popup ${
                  design.backgroundImage ? "has-background-image" : ""
                }`}
                style={popupStyle}
              >
                {design.logoImage ? (
                  <img
                    className={`ag-logo ${design.logoPosition}`}
                    src={design.logoImage}
                    alt=""
                    style={{
                      width: isMobile
                        ? design.logoWidthMobile
                        : design.logoWidthDesktop,
                      marginTop: design.logoMarginTop,
                      marginBottom: design.logoMarginBottom,
                    }}
                  />
                ) : null}
                <h2
                  className="age-guard-heading"
                  style={{
                    fontFamily: typography.headingFontFamily,
                    fontSize: isMobile
                      ? typography.headingFontSizeMobile
                      : typography.headingFontSizeDesktop,
                    fontWeight: typography.headingFontWeight,
                    color: typography.headingColor,
                    textAlign: typography.headingAlign,
                    letterSpacing: typography.headingLetterSpacing,
                    lineHeight: typography.headingLineHeight,
                  }}
                >
                  {typography.headingText}
                </h2>
                <p
                  className="age-guard-description"
                  style={{
                    fontFamily: typography.descriptionFontFamily,
                    fontSize: isMobile
                      ? typography.descriptionFontSizeMobile
                      : typography.descriptionFontSizeDesktop,
                    fontWeight: typography.descriptionFontWeight,
                    color: typography.descriptionColor,
                    textAlign: typography.descriptionAlign,
                    letterSpacing: typography.descriptionLetterSpacing,
                    lineHeight: typography.descriptionLineHeight,
                  }}
                >
                  {typography.descriptionText}
                </p>
                <p
                  className="ag-min-age age-guard-minimum"
                  style={{
                    fontSize: isMobile
                      ? typography.minimumAgeFontSizeMobile
                      : typography.minimumAgeFontSizeDesktop,
                    color: typography.minimumAgeColor,
                    fontWeight: typography.minimumAgeBold ? 700 : 400,
                    fontStyle: typography.minimumAgeItalic ? "italic" : "normal",
                  }}
                >
                  {typography.minimumAgeText.replace(
                    "18",
                    String(verification.minimumAge),
                  )}
                </p>
                <VerificationPreview method={verification.method} minimumAge={verification.minimumAge} />
                <div
                  className="ag-preview-buttons age-guard-buttons"
                  style={{ flexDirection: buttonLayout, gap: buttons.gap }}
                >
                  <button
                    className="age-guard-button age-guard-enter-button"
                    type="button"
                    style={{
                      ...buttonBase,
                      background: buttons.enterBackgroundColor,
                      color: buttons.enterTextColor,
                      border: `${buttons.enterBorderWidth}px solid ${buttons.enterBorderColor}`,
                      width: buttons.enterFullWidth ? "100%" : "auto",
                    }}
                  >
                    {buttons.enterLabel}
                  </button>
                  {buttons.showExitButton ? (
                    <button
                      className="age-guard-button age-guard-exit-button"
                      type="button"
                      style={{
                        borderRadius: buttons.exitBorderRadius,
                        fontSize: isMobile
                          ? buttons.exitFontSizeMobile
                          : buttons.exitFontSizeDesktop,
                        fontWeight: buttons.exitFontWeight,
                        padding: `${buttons.exitPaddingY}px ${buttons.exitPaddingX}px`,
                        background: buttons.exitBackgroundColor,
                        color: buttons.exitTextColor,
                        border: `${buttons.exitBorderWidth}px solid ${buttons.exitBorderColor}`,
                        width: buttons.exitFullWidth ? "100%" : "auto",
                      }}
                    >
                      {buttons.exitLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="ag-disabled-preview">Popup disabled</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function VerificationPreview({ method, minimumAge }) {
  if (method === "dob") {
    return (
      <div className="ag-verification-preview">
        <input readOnly placeholder="DD" />
        <input readOnly placeholder="MM" />
        <input readOnly placeholder="YYYY" />
      </div>
    );
  }

  if (method === "checkbox") {
    return (
      <label className="ag-preview-check">
        <input readOnly type="checkbox" />
        <span>I confirm I am {minimumAge}+</span>
      </label>
    );
  }

  if (method === "age-input") {
    return (
      <div className="ag-verification-preview single">
        <input readOnly placeholder="Enter your age" />
      </div>
    );
  }

  return null;
}

export function PreviewModal({ open, onClose, settings, enabled }) {
  const [device, setDevice] = useState("desktop");

  if (!open) return null;

  return (
    <div className="ag-modal-backdrop">
      <div className="ag-modal">
        <div className="ag-modal-header">
          <strong>Storefront popup preview</strong>
          <button className="ag-icon-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <LivePreview
          enabled={enabled}
          settings={settings}
          device={device}
          onDeviceChange={setDevice}
        />
      </div>
    </div>
  );
}
