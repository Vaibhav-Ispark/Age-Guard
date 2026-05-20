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

export default function TypographySettings() {
  const config = useLoaderData();
  const form = useSettingsForm(config.settings, "typography");
  const { typography } = form.settings;
  const update = (field, value) => form.update(["typography", field], value);

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Settings</p>
          <h1>Typography settings</h1>
        </div>
      </div>
      <SettingsShell
        active="typography"
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
          <h2>Popup title</h2>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Title text</span>
              <input
                value={typography.headingText}
                onChange={(event) => update("headingText", event.target.value)}
              />
            </label>
            <ColorOpacityInput
              label="Title color"
              color={typography.headingColor}
              opacity={100}
              onColor={(value) => update("headingColor", value)}
            />
          </div>
        </section>

        <section className="ag-card">
          <h2>Typography CSS code</h2>
          <p>
            Use storefront classes like .age-guard-heading,
            .age-guard-description, and .age-guard-minimum.
          </p>
          <label className="ag-field">
            <span className="ag-label">Custom CSS</span>
            <textarea
              className="ag-code-field"
              spellCheck="false"
              value={typography.customCss}
              onChange={(event) => update("customCss", event.target.value)}
              placeholder={`.age-guard-heading {\n  font-size: 32px;\n  text-transform: uppercase;\n}`}
            />
          </label>
        </section>
      </SettingsShell>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
