import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAgeGuardConfig, saveAgeGuardConfig } from "../models/ageGuard.server";
import { LivePreview, SettingsShell } from "../components/AgeGuardPreview";
import { useSettingsForm } from "../components/settingsForm";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getAgeGuardConfig(session.shop);
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  await saveAgeGuardConfig(session.shop, { settings: JSON.parse(formData.get("settings")) });
  return { ok: true };
};

export default function VerificationSettings() {
  const config = useLoaderData();
  const form = useSettingsForm(config.settings, "verification");
  const { verification } = form.settings;
  const update = (field, value) => form.update(["verification", field], value);

  function updateRule(index, field, value) {
    const rules = [...verification.countryRules];
    rules[index] = { ...rules[index], [field]: value };
    update("countryRules", rules);
  }

  function removeRule(index) {
    update(
      "countryRules",
      verification.countryRules.filter((_, ruleIndex) => ruleIndex !== index),
    );
  }

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Settings</p>
          <h1>Verification method</h1>
        </div>
      </div>
      <SettingsShell active="verification" dirty={form.dirty} onDiscard={form.discard} onSave={form.save} preview={<LivePreview enabled={config.enabled} settings={form.settings} device={form.device} onDeviceChange={form.setDevice} />}>
        <section className="ag-card">
          <h2>Method selector</h2>
          <div className="ag-form-grid single">
            {[
              ["click", "Click Only (Just Yes/No buttons)"],
              ["dob", "Date of Birth Input (DD/MM/YYYY fields)"],
              ["checkbox", "Age Checkbox (I confirm I am 18+)"],
              ["age-input", "Age Input (type your age)"],
            ].map(([value, label]) => (
              <label className="ag-switch" key={value}>
                <input checked={verification.method === value} name="method" type="radio" onChange={() => update("method", value)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="ag-card">
          <h2>Age configuration</h2>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Minimum age</span>
              <input min="1" type="number" value={verification.minimumAge} onChange={(event) => update("minimumAge", Number(event.target.value))} />
            </label>
            <label className="ag-switch">
              <input checked={verification.countryRulesEnabled} type="checkbox" onChange={(event) => update("countryRulesEnabled", event.target.checked)} />
              <span>Country-specific age rules</span>
            </label>
          </div>
          {verification.countryRules.map((rule, index) => (
            <div className="ag-repeat-row" key={`${rule.country}-${index}`}>
              <div className="ag-form-grid">
                <label className="ag-field">
                  <span className="ag-label">Country code</span>
                  <input value={rule.country} onChange={(event) => updateRule(index, "country", event.target.value.toUpperCase())} />
                </label>
                <label className="ag-field">
                  <span className="ag-label">Minimum age</span>
                  <input min="1" type="number" value={rule.minimumAge} onChange={(event) => updateRule(index, "minimumAge", Number(event.target.value))} />
                </label>
              </div>
              <button
                className="ag-btn ag-btn-danger"
                type="button"
                onClick={() => removeRule(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button className="ag-btn ag-btn-secondary" type="button" onClick={() => update("countryRules", [...verification.countryRules, { country: "US", minimumAge: verification.minimumAge }])}>
            Add country rule
          </button>
        </section>
        <section className="ag-card">
          <h2>Cookie settings</h2>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Remember verification for days</span>
              <input min="1" max="365" type="number" value={verification.rememberDays} onChange={(event) => update("rememberDays", Number(event.target.value))} />
            </label>
            <label className="ag-field">
              <span className="ag-label">Cookie name</span>
              <input value={verification.cookieName} onChange={(event) => update("cookieName", event.target.value)} />
            </label>
            <label className="ag-switch">
              <input checked={verification.reverifyOnNewSession} type="checkbox" onChange={(event) => update("reverifyOnNewSession", event.target.checked)} />
              <span>Re-verify on new session</span>
            </label>
          </div>
        </section>
      </SettingsShell>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
