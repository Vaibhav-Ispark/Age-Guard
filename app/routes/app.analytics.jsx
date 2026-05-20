import { useMemo, useState } from "react";
import { useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAnalytics } from "../models/ageGuard.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") || 30);
  return { analytics: await getAnalytics(session.shop, days), days };
};

export default function Analytics() {
  const { analytics, days } = useLoaderData();
  const { search } = useLocation();
  const [range, setRange] = useState(String(days));
  const max = Math.max(...analytics.daily.map((day) => day.total), 1);
  const points = analytics.daily
    .map((day, index) => `${(index / Math.max(analytics.daily.length - 1, 1)) * 100},${100 - (day.total / max) * 90}`)
    .join(" ");
  const total = analytics.pass + analytics.block || 1;
  const passPercent = Math.round((analytics.pass / total) * 100);

  const csvUrl = useMemo(() => {
    const rows = [["date", "total", "pass", "block"], ...analytics.daily.map((day) => [day.date, day.total, day.pass, day.block])];
    return URL.createObjectURL(new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" }));
  }, [analytics.daily]);

  function changeRange(value) {
    setRange(value);
    const params = new URLSearchParams(search);
    params.set("days", value);
    window.location.href = `/app/analytics?${params.toString()}`;
  }

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Reporting</p>
          <h1>Analytics</h1>
        </div>
      </div>
      <div className="ag-settings-main">
        <section className="ag-card">
          <div className="ag-row-actions">
            <label className="ag-field">
              <span className="ag-label">Date range</span>
              <select value={range} onChange={(event) => changeRange(event.target.value)}>
                <option value="7">7d</option>
                <option value="30">30d</option>
                <option value="90">90d</option>
              </select>
            </label>
            <a className="ag-btn ag-btn-primary" href={csvUrl} download="age-guard-analytics.csv">
              Export CSV
            </a>
          </div>
        </section>
        <div className="ag-page-grid">
          <section className="ag-card">
            <h2>Daily verifications</h2>
            <svg className="ag-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
              <polyline fill="none" points={points} stroke="#005bd3" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
          </section>
          <section className="ag-card">
            <h2>Pass vs Block ratio</h2>
            <svg className="ag-chart" viewBox="0 0 42 42" role="img">
              <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#d82c0d" strokeWidth="4" />
              <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#008060" strokeDasharray={`${passPercent} ${100 - passPercent}`} strokeDashoffset="25" strokeWidth="4" />
              <text x="21" y="23" textAnchor="middle" fontSize="7">{passPercent}%</text>
            </svg>
          </section>
        </div>
        <section className="ag-card">
          <h2>Top pages where popup appeared</h2>
          <table className="ag-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {analytics.pages.length ? analytics.pages.map((page) => (
                <tr key={page.page}>
                  <td>{page.page}</td>
                  <td>{page.count}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="2">No analytics yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
