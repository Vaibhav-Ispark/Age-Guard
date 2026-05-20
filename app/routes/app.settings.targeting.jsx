import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAgeGuardConfig, saveAgeGuardConfig } from "../models/ageGuard.server";
import { LivePreview, SettingsShell } from "../components/AgeGuardPreview";
import { useSettingsForm } from "../components/settingsForm";

const countries = ["US", "CA", "GB", "AU", "DE", "FR", "IN", "NL", "ES", "IT"];

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

export default function TargetingSettings() {
  const config = useLoaderData();
  const form = useSettingsForm(config.settings, "targeting");
  const { targeting } = form.settings;
  const update = (field, value) => form.update(["targeting", field], value);

  function listField(field, value) {
    update(field, value.split("\n").map((item) => item.trim()).filter(Boolean));
  }

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Settings</p>
          <h1>Targeting</h1>
        </div>
      </div>
      <SettingsShell active="targeting" dirty={form.dirty} onDiscard={form.discard} onSave={form.save} preview={<LivePreview enabled={config.enabled} settings={form.settings} device={form.device} onDeviceChange={form.setDevice} />}>
        <section className="ag-card">
          <h2>Show popup on</h2>
          <div className="ag-form-grid single">
            {[
              ["all", "All pages"],
              ["specific", "Specific pages"],
              ["homepage", "Only homepage"],
              ["exclude", "Exclude pages"],
            ].map(([value, label]) => (
              <label className="ag-switch" key={value}>
                <input checked={targeting.showOn === value} name="showOn" type="radio" onChange={() => update("showOn", value)} />
                <span>{label}</span>
              </label>
            ))}
            <label className="ag-field">
              <span className="ag-label">Specific page URL patterns</span>
              <textarea value={targeting.specificPages.join("\n")} onChange={(event) => listField("specificPages", event.target.value)} />
            </label>
            <label className="ag-field">
              <span className="ag-label">Excluded page URL patterns</span>
              <textarea value={targeting.excludePages.join("\n")} onChange={(event) => listField("excludePages", event.target.value)} />
            </label>
          </div>
        </section>
        <section className="ag-card">
          <h2>Customer targeting</h2>
          <div className="ag-form-grid">
            <label className="ag-field">
              <span className="ag-label">Show to</span>
              <select value={targeting.customerShowTo} onChange={(event) => update("customerShowTo", event.target.value)}>
                <option value="all">All visitors</option>
                <option value="guests">Only guests</option>
                <option value="logged-in">Only logged-in</option>
              </select>
            </label>
            <label className="ag-switch">
              <input checked={targeting.bypassLoggedIn} type="checkbox" onChange={(event) => update("bypassLoggedIn", event.target.checked)} />
              <span>Bypass for logged-in customers</span>
            </label>
            <label className="ag-field">
              <span className="ag-label">Bypass customer tags</span>
              <textarea value={targeting.bypassTags.join("\n")} onChange={(event) => listField("bypassTags", event.target.value)} />
            </label>
          </div>
        </section>
        <section className="ag-card">
          <h2>Geographic targeting</h2>
          <div className="ag-form-grid">
            <label className="ag-switch">
              <input checked={targeting.geoEnabled} type="checkbox" onChange={(event) => update("geoEnabled", event.target.checked)} />
              <span>Enable geo-targeting</span>
            </label>
            <label className="ag-field">
              <span className="ag-label">Country mode</span>
              <select value={targeting.geoMode} onChange={(event) => update("geoMode", event.target.value)}>
                <option value="include">Show only selected countries</option>
                <option value="exclude">Exclude selected countries</option>
              </select>
            </label>
            <label className="ag-field">
              <span className="ag-label">Countries</span>
              <select multiple value={targeting.countries} onChange={(event) => update("countries", [...event.target.selectedOptions].map((option) => option.value))}>
                {countries.map((country) => <option key={country}>{country}</option>)}
              </select>
            </label>
          </div>
        </section>
      </SettingsShell>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
