import { useState } from "react";
import { useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getAgeGuardConfig,
  getDashboardStats,
} from "../models/ageGuard.server";
import { LivePreview, PreviewModal } from "../components/AgeGuardPreview";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const config = await getAgeGuardConfig(session.shop);
  const stats = await getDashboardStats(session.shop);

  return { config, stats };
};

export default function Dashboard() {
  const { config, stats } = useLoaderData();
  const { search } = useLocation();
  const [device, setDevice] = useState("desktop");
  const [modalOpen, setModalOpen] = useState(false);

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
            <div className="ag-hero-info">
              <div className="ag-hero-icon">🛡️</div>
              <div>
                <h2>Age Verification Active</h2>
                <p>
                  The age gate is controlled via the theme editor. Enable or disable it
                  under <strong>Online Store → Themes → Customize → App embeds</strong>.
                </p>
              </div>
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

          <section className="ag-card ag-quick-links">
            <h2>Quick links</h2>
            <div className="ag-quick-grid">
              <a className="ag-quick-item" href={`/app/settings/design${search}`}>
                <span className="ag-quick-icon">🎨</span>
                <div>
                  <strong>Design</strong>
                  <p>Popup style, colors, logo</p>
                </div>
              </a>
              <a className="ag-quick-item" href={`/app/settings/verification${search}`}>
                <span className="ag-quick-icon">✅</span>
                <div>
                  <strong>Verification</strong>
                  <p>Method, age rules, cookies</p>
                </div>
              </a>
              <a className="ag-quick-item" href={`/app/settings/typography${search}`}>
                <span className="ag-quick-icon">✏️</span>
                <div>
                  <strong>Typography</strong>
                  <p>Fonts, text, heading styles</p>
                </div>
              </a>
              <a className="ag-quick-item" href={`/app/analytics${search}`}>
                <span className="ag-quick-icon">📊</span>
                <div>
                  <strong>Analytics</strong>
                  <p>Verification stats & reports</p>
                </div>
              </a>
            </div>
          </section>
        </div>

        <LivePreview
          enabled={true}
          settings={config.settings}
          device={device}
          onDeviceChange={setDevice}
        />
      </div>
      <PreviewModal
        enabled={true}
        open={modalOpen}
        settings={config.settings}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
