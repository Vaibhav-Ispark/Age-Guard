import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getAgeGuardConfig,
  saveAgeGuardConfig,
} from "../models/ageGuard.server";
import {
  ColorOpacityInput,
  DeviceFontInput,
  LivePreview,
  SettingsShell,
} from "../components/AgeGuardPreview";
import { useSettingsForm } from "../components/settingsForm";
import { UploadField } from "../components/UploadField";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getAgeGuardConfig(session.shop);
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  await saveAgeGuardConfig(session.shop, {
    settings: JSON.parse(formData.get("settings")),
  });
  return { ok: true };
};

export default function DesignSettings() {
  const config = useLoaderData();
  const form = useSettingsForm(config.settings, "design");
  const { design } = form.settings;
  const update = (field, value) => form.update(["design", field], value);

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Settings</p>
          <h1>Design settings</h1>
        </div>
      </div>
      <SettingsShell
        active="design"
        dirty={form.dirty}
        onDiscard={form.discard}
        onSave={form.save}
        preview={
          <LivePreview
            enabled={config.enabled}
            settings={form.settings}
            device={form.device}
            onDeviceChange={form.setDevice}
          />
        }
      >
        <section className="ag-card">
          <h2>Popup style</h2>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Popup type</span>
              <select
                value={design.popupType}
                onChange={(event) => update("popupType", event.target.value)}
              >
                <option value="modal">Modal</option>
                <option value="full-screen">Full Screen Overlay</option>
                <option value="bottom-bar">Bottom Bar</option>
              </select>
            </label>
            <label className="ag-field">
              <span className="ag-label">Animation</span>
              <select
                value={design.animation}
                onChange={(event) => update("animation", event.target.value)}
              >
                <option value="fade">Fade</option>
                <option value="slide-up">Slide Up</option>
                <option value="zoom-in">Zoom In</option>
                <option value="none">None</option>
              </select>
            </label>
            <label className="ag-field">
              <span className="ag-label">Border radius</span>
              <input
                max="30"
                min="0"
                type="range"
                value={design.borderRadius}
                onChange={(event) => update("borderRadius", Number(event.target.value))}
              />
              <output>{design.borderRadius}px</output>
            </label>
            <label className="ag-field">
              <span className="ag-label">Max width</span>
              <input
                max="800"
                min="300"
                type="number"
                value={design.maxWidth}
                onChange={(event) => update("maxWidth", Number(event.target.value))}
              />
            </label>
          </div>
          <ColorOpacityInput
            label="Background"
            color={design.backgroundColor}
            opacity={design.backgroundOpacity}
            onColor={(value) => update("backgroundColor", value)}
            onOpacity={(value) => update("backgroundOpacity", value)}
          />
          <ColorOpacityInput
            label="Overlay"
            color={design.overlayColor}
            opacity={design.overlayOpacity}
            onColor={(value) => update("overlayColor", value)}
            onOpacity={(value) => update("overlayOpacity", value)}
          />
          <div className="ag-form-grid">
            <label className="ag-switch">
              <input
                checked={design.boxShadow}
                type="checkbox"
                onChange={(event) => update("boxShadow", event.target.checked)}
              />
              <span>Box shadow</span>
            </label>
            <ColorOpacityInput
              label="Shadow color"
              color={design.shadowColor}
              opacity={30}
              onColor={(value) => update("shadowColor", value)}
            />
          </div>
        </section>

        <section className="ag-card">
          <h2>Background image</h2>
          <div className="ag-form-grid">
            <UploadField
              label="Background image URL"
              value={design.backgroundImage}
              onChange={(value) => update("backgroundImage", value)}
            />
            <label className="ag-field">
              <span className="ag-label">Image position</span>
              <select
                value={design.backgroundPosition}
                onChange={(event) => update("backgroundPosition", event.target.value)}
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="ag-field">
              <span className="ag-label">Image size</span>
              <select
                value={design.backgroundSize}
                onChange={(event) => update("backgroundSize", event.target.value)}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="auto">Auto</option>
                <option value="custom">Custom %</option>
              </select>
            </label>
            <label className="ag-field">
              <span className="ag-label">Custom size</span>
              <input
                max="200"
                min="10"
                type="number"
                value={design.backgroundCustomSize}
                onChange={(event) => update("backgroundCustomSize", Number(event.target.value))}
              />
            </label>
            <label className="ag-field">
              <span className="ag-label">Image opacity</span>
              <input
                max="100"
                min="0"
                type="range"
                value={design.backgroundImageOpacity}
                onChange={(event) => update("backgroundImageOpacity", Number(event.target.value))}
              />
              <output>{design.backgroundImageOpacity}%</output>
            </label>
            <label className="ag-field">
              <span className="ag-label">Blur effect</span>
              <input
                max="20"
                min="0"
                type="range"
                value={design.backgroundBlur}
                onChange={(event) => update("backgroundBlur", Number(event.target.value))}
              />
              <output>{design.backgroundBlur}px</output>
            </label>
          </div>
          <ColorOpacityInput
            label="Fallback background"
            color={design.fallbackBackgroundColor}
            opacity={100}
            onColor={(value) => update("fallbackBackgroundColor", value)}
          />
        </section>

        <section className="ag-card">
          <h2>Logo</h2>
          <div className="ag-form-grid">
            <UploadField
              label="Logo image URL"
              value={design.logoImage}
              onChange={(value) => update("logoImage", value)}
            />
            <label className="ag-field">
              <span className="ag-label">Logo position</span>
              <select
                value={design.logoPosition}
                onChange={(event) => update("logoPosition", event.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <DeviceFontInput
              label="Logo width"
              value={design.logoWidthDesktop}
              onChange={(value) => update("logoWidthDesktop", value)}
            />
            <DeviceFontInput
              device="mobile"
              label="Logo width"
              value={design.logoWidthMobile}
              onChange={(value) => update("logoWidthMobile", value)}
            />
            <label className="ag-field">
              <span className="ag-label">Margin top</span>
              <input
                type="number"
                value={design.logoMarginTop}
                onChange={(event) => update("logoMarginTop", Number(event.target.value))}
              />
            </label>
            <label className="ag-field">
              <span className="ag-label">Margin bottom</span>
              <input
                type="number"
                value={design.logoMarginBottom}
                onChange={(event) => update("logoMarginBottom", Number(event.target.value))}
              />
            </label>
          </div>
        </section>
      </SettingsShell>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
