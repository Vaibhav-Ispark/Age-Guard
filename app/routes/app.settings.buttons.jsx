import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAgeGuardConfig, saveAgeGuardConfig } from "../models/ageGuard.server";
import {
  ColorOpacityInput,
  LivePreview,
  SettingsShell,
} from "../components/AgeGuardPreview";
import { useSettingsForm } from "../components/settingsForm";

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

export default function ButtonSettings() {
  const config = useLoaderData();
  const form = useSettingsForm(config.settings, "buttons");
  const { buttons } = form.settings;
  const update = (field, value) => form.update(["buttons", field], value);

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Settings</p>
          <h1>Button settings</h1>
        </div>
      </div>
      <SettingsShell
        active="buttons"
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
          <h2>Enter button</h2>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Button label</span>
              <input
                value={buttons.enterLabel}
                onChange={(event) => update("enterLabel", event.target.value)}
              />
            </label>
            <ColorOpacityInput
              label="Background color"
              color={buttons.enterBackgroundColor}
              opacity={100}
              onColor={(value) => update("enterBackgroundColor", value)}
            />
            <ColorOpacityInput
              label="Text color"
              color={buttons.enterTextColor}
              opacity={100}
              onColor={(value) => update("enterTextColor", value)}
            />
          </div>
        </section>

        <section className="ag-card">
          <div className="ag-toggle-row">
            <h2>Exit button</h2>
            <label className="ag-switch">
              <input
                checked={buttons.showExitButton}
                type="checkbox"
                onChange={(event) => update("showExitButton", event.target.checked)}
              />
              <span>{buttons.showExitButton ? "Shown" : "Hidden"}</span>
            </label>
          </div>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Button label</span>
              <input
                value={buttons.exitLabel}
                onChange={(event) => update("exitLabel", event.target.value)}
              />
            </label>
            <label className="ag-field">
              <span className="ag-label">Exit redirect URL</span>
              <input
                type="url"
                value={buttons.exitRedirectUrl}
                onChange={(event) => update("exitRedirectUrl", event.target.value)}
              />
            </label>
            <ColorOpacityInput
              label="Background color"
              color={buttons.exitBackgroundColor}
              opacity={100}
              onColor={(value) => update("exitBackgroundColor", value)}
            />
            <ColorOpacityInput
              label="Text color"
              color={buttons.exitTextColor}
              opacity={100}
              onColor={(value) => update("exitTextColor", value)}
            />
          </div>
        </section>

        <section className="ag-card">
          <h2>Button CSS code</h2>
          <p>
            Use storefront classes like .age-guard-button,
            .age-guard-enter-button, .age-guard-exit-button, and
            .age-guard-buttons.
          </p>
          <label className="ag-field">
            <span className="ag-label">Custom CSS</span>
            <textarea
              className="ag-code-field"
              spellCheck="false"
              value={buttons.customCss}
              onChange={(event) => update("customCss", event.target.value)}
              placeholder={`.age-guard-button {\n  border-radius: 999px;\n  padding: 14px 24px;\n}`}
            />
          </label>
        </section>
      </SettingsShell>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
