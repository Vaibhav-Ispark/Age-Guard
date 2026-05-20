import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getAgeGuardConfig,
  getDashboardStats,
  saveAgeGuardConfig,
} from "../models/ageGuard.server";
import { LivePreview, PreviewModal } from "../components/AgeGuardPreview";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const config = await getAgeGuardConfig(session.shop);
  const stats = await getDashboardStats(session.shop);

  return { config, stats };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const enabled = formData.get("enabled") === "true";

  await saveAgeGuardConfig(session.shop, { enabled });
  return { ok: true, enabled };
};

export default function Dashboard() {
  const { config, stats } = useLoaderData();
  const { search } = useLocation();
  const fetcher = useFetcher();
  const [enabled, setEnabled] = useState(config.enabled);
  const [device, setDevice] = useState("desktop");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (fetcher.data?.ok) window.shopify?.toast?.show("Popup status saved");
  }, [fetcher.data]);

  function toggleEnabled(event) {
    const next = event.target.checked;
    setEnabled(next);
    fetcher.submit({ enabled: String(next) }, { method: "POST" });
  }

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Embedded Shopify app</p>
          <h1>Age Guard - Age Verification</h1>
        </div>
        <a className="ag-btn ag-btn-secondary" href={`/app/settings/design${search}`}>
          Settings
        </a>
      </div>
      <div className="ag-page-grid">
        <div className="ag-settings-main">
          <section className="ag-card ag-hero-card">
            <div className="ag-toggle-row">
              <div>
                <h2>Popup status</h2>
                <p>
                  Enable the storefront age gate. Visitors who are not verified
                  cannot access the site.
                </p>
              </div>
              <label className="ag-switch">
                <input
                  checked={enabled}
                  type="checkbox"
                  onChange={toggleEnabled}
                />
                <span>{enabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
            <div className="ag-row-actions">
              <button
                className="ag-btn ag-btn-primary"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                Open Preview
              </button>
              <a
                className="ag-btn ag-btn-secondary"
                href={`/app/settings/design${search}`}
              >
                Edit design
              </a>
            </div>
          </section>

          <div className="ag-metric-grid">
            <section className="ag-card ag-metric">
              <span>Total verifications today</span>
              <strong>{stats.total}</strong>
            </section>
            <section className="ag-card ag-metric">
              <span>Pass rate</span>
              <strong>{stats.passRate}%</strong>
            </section>
            <section className="ag-card ag-metric">
              <span>Blocked attempts</span>
              <strong>{stats.blocked}</strong>
            </section>
          </div>
        </div>

        <LivePreview
          enabled={enabled}
          settings={config.settings}
          device={device}
          onDeviceChange={setDevice}
        />
      </div>
      <PreviewModal
        enabled={enabled}
        open={modalOpen}
        settings={config.settings}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
