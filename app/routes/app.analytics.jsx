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
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = analytics.pass + analytics.block || 1;
  const passPercent = Math.round((analytics.pass / total) * 100);
  const blockPercent = 100 - passPercent;
  const totalVerifications = analytics.pass + analytics.block;

  // Chart data
  const max = Math.max(...analytics.daily.map((d) => d.total), 1);
  const chartW = 500;
  const chartH = 160;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const n = analytics.daily.length;

  const pts = analytics.daily.map((d, i) => ({
    x: padL + (i / Math.max(n - 1, 1)) * innerW,
    y: padT + innerH - (d.total / max) * innerH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = pts.length
    ? `${linePath} L${pts[pts.length - 1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`
    : "";

  // Donut
  const r = 15.915;
  const circ = 2 * Math.PI * r;
  const passDash = (passPercent / 100) * circ;
  const blockDash = (blockPercent / 100) * circ;

  const csvUrl = useMemo(() => {
    const rows = [
      ["date", "total", "pass", "block"],
      ...analytics.daily.map((d) => [d.date, d.total, d.pass, d.block]),
    ];
    return URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
    );
  }, [analytics.daily]);

  function changeRange(value) {
    setRange(value);
    const params = new URLSearchParams(search);
    params.set("days", value);
    window.location.href = `/app/analytics?${params.toString()}`;
  }

  const yTicks = [0, Math.round(max / 2), max];

  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Reporting</p>
          <h1>Analytics</h1>
        </div>
        <div className="ag-row-actions">
          <div className="ag-segments">
            {[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]].map(([val, label]) => (
              <button
                key={val}
                className={range === val ? "active" : ""}
                type="button"
                onClick={() => changeRange(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <a className="ag-btn ag-btn-secondary" href={csvUrl} download="age-guard-analytics.csv">
            ↓ Export CSV
          </a>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="ag-analytics-wrap">
        <div className="ag-analytics-metrics">
          <div className="ag-analytics-metric ag-analytics-metric--total">
            <span className="ag-analytics-metric__icon">🔢</span>
            <div>
              <strong>{totalVerifications.toLocaleString()}</strong>
              <span>Total verifications</span>
            </div>
          </div>
          <div className="ag-analytics-metric ag-analytics-metric--pass">
            <span className="ag-analytics-metric__icon">✅</span>
            <div>
              <strong>{analytics.pass.toLocaleString()}</strong>
              <span>Passed ({passPercent}%)</span>
            </div>
          </div>
          <div className="ag-analytics-metric ag-analytics-metric--block">
            <span className="ag-analytics-metric__icon">🚫</span>
            <div>
              <strong>{analytics.block.toLocaleString()}</strong>
              <span>Blocked ({blockPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="ag-analytics-charts">
          {/* Line chart */}
          <section className="ag-card ag-analytics-line-card">
            <div className="ag-analytics-card-header">
              <h2>Daily verifications</h2>
              <span className="ag-analytics-badge">{range}d</span>
            </div>
            <div className="ag-chart-wrap">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                preserveAspectRatio="none"
                className="ag-line-chart"
                role="img"
                aria-label="Daily verifications chart"
              >
                <defs>
                  <linearGradient id="ag-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#005bd3" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#005bd3" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {yTicks.map((tick, i) => {
                  const y = padT + innerH - (tick / max) * innerH;
                  return (
                    <g key={i}>
                      <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                      <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{tick}</text>
                    </g>
                  );
                })}

                {/* X axis labels — show every nth */}
                {pts.filter((_, i) => i % Math.ceil(n / 6) === 0 || i === n - 1).map((p, i) => (
                  <text key={i} x={p.x} y={chartH - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">
                    {p.date?.slice(5)}
                  </text>
                ))}

                {/* Area fill */}
                {areaPath && (
                  <path d={areaPath} fill="url(#ag-area-grad)" />
                )}

                {/* Line */}
                {linePath && (
                  <path d={linePath} fill="none" stroke="#005bd3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Hover dots */}
                {pts.map((p, i) => (
                  <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                    <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
                    {(hoveredIndex === i || p.total > 0) && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === i ? 5 : 3}
                        fill={hoveredIndex === i ? "#005bd3" : "#ffffff"}
                        stroke="#005bd3"
                        strokeWidth="2"
                        style={{ transition: "r 120ms ease" }}
                      />
                    )}
                    {hoveredIndex === i && (
                      <g>
                        <rect
                          x={Math.min(p.x - 28, chartW - padR - 60)}
                          y={p.y - 36}
                          width="60"
                          height="28"
                          rx="6"
                          fill="#111827"
                          opacity="0.92"
                        />
                        <text
                          x={Math.min(p.x - 28, chartW - padR - 60) + 30}
                          y={p.y - 26}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#9ca3af"
                        >
                          {p.date?.slice(5)}
                        </text>
                        <text
                          x={Math.min(p.x - 28, chartW - padR - 60) + 30}
                          y={p.y - 14}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="#ffffff"
                        >
                          {p.total} verif.
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </section>

          {/* Donut chart */}
          <section className="ag-card ag-analytics-donut-card">
            <div className="ag-analytics-card-header">
              <h2>Pass vs Block</h2>
            </div>
            <div className="ag-donut-wrap">
              <svg viewBox="0 0 42 42" className="ag-donut-chart" role="img" aria-label="Pass vs block ratio">
                {/* Background track */}
                <circle cx="21" cy="21" r={r} fill="transparent" stroke="#f3f4f6" strokeWidth="5" />
                {/* Block arc */}
                <circle
                  cx="21" cy="21" r={r}
                  fill="transparent"
                  stroke="#fecaca"
                  strokeWidth="5"
                  strokeDasharray={`${blockDash} ${circ - blockDash}`}
                  strokeDashoffset={circ * 0.25}
                  strokeLinecap="round"
                />
                {/* Pass arc */}
                <circle
                  cx="21" cy="21" r={r}
                  fill="transparent"
                  stroke="#008060"
                  strokeWidth="5"
                  strokeDasharray={`${passDash} ${circ - passDash}`}
                  strokeDashoffset={circ * 0.25 + blockDash}
                  strokeLinecap="round"
                />
                <text x="21" y="19" textAnchor="middle" fontSize="6" fontWeight="700" fill="#111827">{passPercent}%</text>
                <text x="21" y="25" textAnchor="middle" fontSize="4" fill="#6b7280">pass rate</text>
              </svg>
              <div className="ag-donut-legend">
                <div className="ag-donut-legend-item">
                  <span className="ag-donut-legend-dot" style={{ background: "#008060" }} />
                  <div>
                    <strong>{analytics.pass.toLocaleString()}</strong>
                    <span>Passed</span>
                  </div>
                </div>
                <div className="ag-donut-legend-item">
                  <span className="ag-donut-legend-dot" style={{ background: "#fca5a5" }} />
                  <div>
                    <strong>{analytics.block.toLocaleString()}</strong>
                    <span>Blocked</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Top pages table */}
        <section className="ag-card">
          <div className="ag-analytics-card-header">
            <h2>Top pages where popup appeared</h2>
            <span className="ag-analytics-badge">{analytics.pages.length} pages</span>
          </div>
          {analytics.pages.length ? (
            <table className="ag-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {analytics.pages.map((page, i) => {
                  const pct = Math.round((page.count / (analytics.pages[0]?.count || 1)) * 100);
                  return (
                    <tr key={page.page} className="ag-table-row-hover">
                      <td className="ag-table-rank">{i + 1}</td>
                      <td className="ag-table-page">{page.page}</td>
                      <td><strong>{page.count.toLocaleString()}</strong></td>
                      <td>
                        <div className="ag-bar-cell">
                          <div className="ag-bar-track">
                            <div className="ag-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="ag-empty-state">
              <span>📊</span>
              <p>No analytics data yet. The popup needs to be shown to visitors first.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
