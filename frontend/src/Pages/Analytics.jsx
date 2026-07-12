import { useState, useEffect } from "react";
import "../Styles/global.css";
import { Sidebar } from './Dashboard';
import api from '../api';
import {
  FiTruck, FiUsers, FiDroplet, FiTrendingDown, FiDownload,
  FiTool, FiPackage, FiClipboard, FiCheckCircle, FiActivity
} from "react-icons/fi";
import { LuBike } from "react-icons/lu";

// Helpers 
const TYPE_ICONS = {
  Van:          <FiTruck size={18} />,
  Truck:        <FiTruck size={18} />,
  "Mini-Truck": <FiTruck size={18} />,
  Bike:         <LuBike  size={18} />,
};

const n   = (v, fallback = 0) => parseFloat(v ?? fallback) || fallback;
const fmt = (v) => Math.round(v).toLocaleString();
const fmtK = (v) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${Math.round(v)}`;
const scoreColor = (s) => s >= 85 ? "var(--success)" : s >= 65 ? "var(--warning)" : "var(--danger)";
const maxOf = (arr, key) => Math.max(...arr.map(a => a[key] ?? 0), 1);

const vid = (t) => t.vehicleid || t.vehicleId;
const did = (t) => t.driverid  || t.driverId;

/*CSV export*/
function downloadCSV(filename, headers, rows) {
  const esc = (v) => { const s = String(v ?? ""); return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
}

/*Period helpers*/
function getPeriodCutoff(p) {
  const now = new Date();
  return {
    "1M": new Date(now.getFullYear(), now.getMonth() - 1,  now.getDate()),
    "3M": new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate()),
    "6M": new Date(now.getFullYear(), now.getMonth() - 6,  now.getDate()),
    "1Y": new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
  }[p] ?? new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
}

function getMonthBuckets(period) {
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const count = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[period] ?? 6;
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { label: names[d.getMonth()], m: d.getMonth(), y: d.getFullYear() };
  });
}

// ── Main Component 
export default function Analytics({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [period,      setPeriod]      = useState("6M");
  const [vehicles,    setVehicles]    = useState([]);
  const [trips,       setTrips]       = useState([]);
  const [expenses,    setExpenses]    = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [drivers,     setDrivers]     = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vR, tR, eR, mR, dR] = await Promise.all([
        api.get('/vehicles'), api.get('/trips'), api.get('/expenses'),
        api.get('/maintenance'), api.get('/drivers'),
      ]);
      setVehicles(vR.data); setTrips(tR.data); setExpenses(eR.data);
      setMaintenance(mR.data); setDrivers(dR.data);
    } catch (err) { console.error("Analytics fetch error:", err); }
  };

  /*Period-filtered sets */
  const cutoff       = getPeriodCutoff(period);
  const fTrips       = trips.filter(t => new Date(t.date) >= cutoff);
  const fExpenses    = expenses.filter(e => new Date(e.date) >= cutoff);
  const fMaintenance = maintenance.filter(m => new Date(m.date) >= cutoff);
  const monthBuckets = getMonthBuckets(period);

  const completedTrips = fTrips.filter(t => t.status === "completed");

  /*  Real cost aggregates from trips  */
  const totalTripCost  = completedTrips.reduce((s, t) => s + n(t.totalcost || t.totalCost), 0);
  const totalTollCost  = completedTrips.reduce((s, t) => s + n(t.tollcost  || t.tollCost),  0);
  const totalOtherCost = completedTrips.reduce((s, t) => s + n(t.othercost || t.otherCost), 0);
  const totalBaseCost  = completedTrips.reduce((s, t) => s + n(t.basecost  || t.baseCost),  0);

  /*  Expense-based costs  */
  const totalFuelCost  = fExpenses.filter(e => e.type === "fuel").reduce((s, e) => s + n(e.cost), 0);
  const totalMaintCost = fMaintenance.reduce((s, m) => s + n(m.cost), 0);
  const totalOpCost    = totalFuelCost + totalMaintCost;

  /*  Fleet KM  */
  // CRITICAL: Use ONLY totalKM. extraKM is metadata only and already included in totalKM.
  const totalKM        = completedTrips.reduce((s, t) => s + n(t.totalkm || t.totalKM), 0);

  /*  Completion rate  */
  const completionRate = fTrips.length > 0 ? Math.round((completedTrips.length / fTrips.length) * 100) : 0;

  /*  Monthly charts  */
  const MONTHLY_COST = monthBuckets.map(mb => ({
    month: mb.label,
    cost: completedTrips.filter(t => { const d = new Date(t.date); return d.getMonth() === mb.m && d.getFullYear() === mb.y; })
                        .reduce((s, t) => s + n(t.totalcost || t.totalCost), 0),
  }));

  const MONTHLY_TRIPS = monthBuckets.map(mb => ({
    month: mb.label,
    trips: fTrips.filter(t => { const d = new Date(t.date); return d.getMonth() === mb.m && d.getFullYear() === mb.y; }).length,
  }));

  const MONTHLY_FUEL = monthBuckets.map(mb => ({
    month: mb.label,
    cost:  fExpenses.filter(e => { if (e.type !== "fuel") return false; const d = new Date(e.date); return d.getMonth() === mb.m && d.getFullYear() === mb.y; })
                    .reduce((s, e) => s + n(e.cost), 0),
  }));

  const mxCost  = maxOf(MONTHLY_COST,  "cost");
  const mxTrips = maxOf(MONTHLY_TRIPS, "trips");
  const mxFuel  = maxOf(MONTHLY_FUEL,  "cost");

  /*  Vehicle stats  */
  const VEHICLE_STATS = vehicles.map(v => {
    const vTrips     = fTrips.filter(t => vid(t) === v.id);
    const vCompleted = vTrips.filter(t => t.status === "completed");
    const vCost      = vCompleted.reduce((s, t) => s + n(t.totalcost || t.totalCost), 0);
    // CRITICAL: Use ONLY totalKM. extraKM is metadata only and already included in totalKM.
    const vKM        = vCompleted.reduce((s, t) => s + n(t.totalkm || t.totalKM), 0);
    const vFuel      = fExpenses.filter(e => (e.vehicleid || e.vehicleId) === v.id && e.type === "fuel").reduce((s, e) => s + n(e.cost), 0);
    const vMaint     = fMaintenance.filter(m => (m.vehicleid || m.vehicleId) === v.id).reduce((s, m) => s + n(m.cost), 0);
    return { id: v.id, name: v.name, type: v.type, trips: vTrips.length, completed: vCompleted.length, cost: vCost, km: vKM, fuel: vFuel, maint: vMaint };
  });

  const TOP5_COSTLY = [...VEHICLE_STATS].sort((a, b) => (b.fuel + b.maint) - (a.fuel + a.maint)).slice(0, 5);
  const mxVCost     = Math.max(...TOP5_COSTLY.map(v => v.fuel + v.maint), 1);

  /*  Driver stats  */
  const DRIVER_PERF = drivers.map(d => {
    const dTrips     = fTrips.filter(t => did(t) === d.id);
    const dCompleted = dTrips.filter(t => t.status === "completed");
    // CRITICAL: Use ONLY totalKM. extraKM is metadata only and already included in totalKM.
    const dKM        = dCompleted.reduce((s, t) => s + n(t.totalkm || t.totalKM), 0);
    return {
      name: d.name, trips: dTrips.length, completed: dCompleted.length,
      km: dKM, score: n(d.safetyscore ?? d.safetyScore, 0),
      license: d.license || "", phone: d.phone || "", category: d.category || "", expiry: d.expiry || "",
    };
  });

  /*  Fleet composition  */
  const TYPES = ["Truck", "Mini-Truck", "Van", "Bike"];
  const TYPE_COLORS = { Truck: "#6366f1", "Mini-Truck": "#f59e0b", Van: "#10b981", Bike: "#ec4899" };
  const byType = TYPES.map(t => ({ label: t + "s", type: t, count: vehicles.filter(v => v.type === t).length, color: TYPE_COLORS[t] })).filter(t => t.count > 0);
  const fleetTotal = vehicles.length || 1;

  /*  Cost split (4 real categories)  */
  const costItems = [
    { label: "Base KM Cost", val: totalBaseCost, color: "var(--accent)" },
    { label: "Toll Charges",  val: totalTollCost,  color: "var(--warning)" },
    { label: "Other Expenses",val: totalOtherCost, color: "#60a5fa" },
    { label: "Fuel Cost",     val: totalFuelCost,  color: "var(--danger)" },
  ];
  const costTotal = costItems.reduce((s, c) => s + c.val, 0) || 1;

  /*  CSV exports  */
  const handleExport = (type) => {
    const ds = new Date().toISOString().split("T")[0];
    switch (type) {
      case "Full": downloadCSV(`fleet_analytics_${period}_${ds}.csv`,
        ["Vehicle","Type","Trips","Completed","Trip Cost (₹)","KM Driven","Fuel Cost (₹)","Maintenance (₹)"],
        VEHICLE_STATS.map(v => [v.name, v.type, v.trips, v.completed, v.cost, v.km, v.fuel, v.maint])
      ); break;
      case "Trips": downloadCSV(`trip_summary_${period}_${ds}.csv`,
        ["Month","Trips"], MONTHLY_TRIPS.map(m => [m.month, m.trips])
      ); break;
      case "Fuel": downloadCSV(`fuel_audit_${period}_${ds}.csv`,
        ["Month","Fuel Cost (₹)"], MONTHLY_FUEL.map(m => [m.month, m.cost])
      ); break;
      case "Payroll": downloadCSV(`payroll_report_${period}_${ds}.csv`,
        ["Driver","Category","License","Trips","Completed","KM Driven","Safety Score","Phone"],
        DRIVER_PERF.map(d => [d.name, d.category, d.license, d.trips, d.completed, d.km, d.score, d.phone])
      ); break;
      case "Health": downloadCSV(`vehicle_health_${ds}.csv`,
        ["Vehicle","Type","Status","Odometer (km)","Maint Cost (₹)"],
        vehicles.map(v => { const vs = VEHICLE_STATS.find(s => s.id === v.id) || {}; return [v.name, v.type, v.status, v.odometer, vs.maint ?? 0]; })
      ); break;
      case "Compliance": downloadCSV(`driver_compliance_${ds}.csv`,
        ["Driver","License","Category","Expiry","Safety Score","Phone"],
        drivers.map(d => [d.name, d.license, d.category, d.expiry?.split("T")[0] ?? "N/A", d.safetyscore ?? 0, d.phone])
      ); break;
      default: break;
    }
  };

  /*  Empty state helper  */
  const Empty = ({ msg = "No data for this period" }) => (
    <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, padding: "28px 0" }}>{msg}</div>
  );

  /*  SVG line chart  */
  const LineChart = ({ data, keyName, color = "var(--accent)" }) => {
    // Show all data points, not just > 0
    const pts = data;
    if (pts.length === 0) return <Empty />;
    
    const W = 500, H = 160, PAD = 40;
    const values = pts.map(p => p[keyName] || 0);
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values);
    const range = maxV - minV || 1;
    
    const toX = i => PAD + i * ((W - PAD * 2) / Math.max(pts.length - 1, 1));
    const toY = v => PAD + (1 - (v - minV) / range) * (H - PAD * 2);
    
    const validPts = pts.filter(p => p[keyName] > 0);
    const poly = validPts.map((p, i) => `${toX(i)},${toY(p[keyName])}`).join(" ");
    const area = validPts.length > 0 ? `${toX(0)},${H - PAD} ${poly} ${toX(validPts.length - 1)},${H - PAD}` : "";
    
    return (
      <div style={{ width: "100%", height: 180, padding: "10px 0" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map(f => {
            const y = PAD + (1 - f) * (H - PAD * 2);
            const val = minV + f * range;
            return (
              <g key={f}>
                <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                <text x={PAD - 8} y={y + 4} fontSize={9} fill="var(--muted)" textAnchor="end" fontWeight={500}>
                  {val >= 1000 ? `₹${(val/1000).toFixed(1)}K` : `₹${Math.round(val)}`}
                </text>
              </g>
            );
          })}
          
          {/* Area fill */}
          {validPts.length > 1 && (
            <polygon points={area} fill={`${color}20`} />
          )}
          
          {/* Line */}
          {validPts.length > 1 && (
            <polyline points={poly} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          )}
          
          {/* Data points and labels */}
          {pts.map((p, i) => (
            <g key={i}>
              {p[keyName] > 0 && (
                <>
                  <circle cx={toX(i)} cy={toY(p[keyName])} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
                  <text x={toX(i)} y={toY(p[keyName]) - 12} fontSize={9} fill={color} textAnchor="middle" fontWeight={600}>
                    {fmtK(p[keyName])}
                  </text>
                </>
              )}
              <text x={toX(i)} y={H - 8} fontSize={10} fill="var(--muted)" textAnchor="middle" fontWeight={500}>
                {p.month ?? p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} currentPage="analytics" onNavigate={onNavigate} onLogout={onLogout}
        theme={theme} onToggleTheme={onToggleTheme} permissions={permissions} />

      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Analytics &amp; Reports</div>
            <div className="topbar-sub">Real-time data — trip costs, fuel, driver performance</div>
          </div>
          <div className="topbar-right">
            {["1M","3M","6M","1Y"].map(p => (
              <button key={p} className={`filter-btn ${period === p ? "active" : ""}`}
                style={{ padding: "5px 12px" }} onClick={() => setPeriod(p)}>{p}</button>
            ))}
            <button className="export-btn" onClick={() => handleExport("Full")}><FiDownload size={13} /> Export CSV</button>
          </div>
        </div>

        <div className="page-body">

          {/* ── KPI Cards ── */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: "Total Trip Cost",   val: fmtK(totalTripCost),  sub: `From ${completedTrips.length} completed trips (${period})`, icon: <span style={{ fontSize: 18, fontWeight: 700 }}>₹</span>, color: "var(--success)" },
              { label: "Operational Cost",  val: fmtK(totalOpCost),    sub: "Fuel + Maintenance expenses",                               icon: <FiDroplet size={18} />,     color: "var(--danger)"  },
              { label: "Completion Rate",   val: `${completionRate}%`, sub: `${completedTrips.length} / ${fTrips.length} trips done`,    icon: <FiCheckCircle size={18} />, color: "var(--accent)"  },
              { label: "Total KM Covered",  val: `${fmt(totalKM)} km`, sub: `Across all completed trips`,                                icon: <FiActivity size={18} />,    color: "#60a5fa"        },
            ].map((k, i) => (
              <div key={i} className="kpi-card" style={{ "--kpi-color": k.color }}>
                <div className="kpi-header"><span className="kpi-label">{k.label}</span><div className="kpi-icon">{k.icon}</div></div>
                <div className="kpi-value" style={{ fontSize: 28 }}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Monthly Cost + Trips bar charts ── */}
          <div className="analytics-grid" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Monthly Trip Cost</div>
                <button className="export-btn" style={{ padding: "5px 12px", fontSize: 10 }} onClick={() => handleExport("Trips")}><FiDownload size={11} /> CSV</button>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                {completedTrips.length === 0 ? <Empty /> : (
                      <div className="bar-chart">
                    {MONTHLY_COST.map(m => (
                      <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600 }}>{m.cost > 0 ? fmtK(m.cost) : ""}</div>
                        <div style={{ width: "100%", height: m.cost > 0 ? `${Math.round((m.cost / mxCost) * 110)}px` : "0px",
                          background: "var(--accent)", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" }} />
                        <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>{m.month}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Monthly Trip Volume</div>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                {fTrips.length === 0 ? <Empty /> : (
                      <div className="bar-chart">
                    {MONTHLY_TRIPS.map(m => (
                      <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--success)", fontWeight: 600 }}>{m.trips > 0 ? m.trips : ""}</div>
                        <div style={{ width: "100%", height: m.trips > 0 ? `${Math.round((m.trips / mxTrips) * 110)}px` : "0px",
                          background: "var(--success)", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" }} />
                        <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>{m.month}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Fuel trend + Top 5 costly vehicles ── */}
          <div className="analytics-grid" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><FiDroplet size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Monthly Fuel Cost Trend</div>
                <button className="export-btn" style={{ padding: "5px 12px", fontSize: 10 }} onClick={() => handleExport("Fuel")}><FiDownload size={11} /> CSV</button>
              </div>
              <div style={{ padding: "16px 20px 12px" }}>
                {totalFuelCost === 0
                  ? <Empty msg="No fuel expense records for this period" />
                  : <LineChart data={MONTHLY_FUEL} keyName="cost" color="var(--warning)" />
                }
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><FiTrendingDown size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Top 5 Costliest Vehicles</div>
              </div>
              <div style={{ padding: "20px 20px 12px" }}>
                {TOP5_COSTLY.filter(v => v.fuel + v.maint > 0).length === 0
                  ? <Empty msg="No expense data for this period" />
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {TOP5_COSTLY.map((v, i) => {
                        const total = v.fuel + v.maint;
                        if (total === 0) return null;
                        return (
                          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ minWidth: 80, fontSize: 11, color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 18, overflow: "hidden" }}>
                              <div style={{ width: `${Math.round((total / mxVCost) * 100)}%`, height: "100%", borderRadius: 4, transition: "width .6s ease",
                                background: ["var(--danger)", "rgba(251,146,60,0.85)", "var(--accent)", "var(--success)", "#60a5fa"][i] }} />
                            </div>
                            <div style={{ minWidth: 52, fontSize: 11, fontWeight: 700, textAlign: "right", color: "var(--text)" }}>{fmtK(total)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* ── Fleet Composition + Cost Split ── */}
          <div className="analytics-grid" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-header"><div className="panel-title"><FiTruck size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Vehicle Trip Completion Rate</div></div>
              <div style={{ padding: "12px 20px 20px" }}>
                {VEHICLE_STATS.length === 0 ? <Empty msg="No vehicles found" /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {VEHICLE_STATS.map(v => {
                      const rate = v.trips > 0 ? Math.round((v.completed / v.trips) * 100) : 0;
                      return (
                        <div key={v.id}>
                          <div className="util-bar-label">
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {TYPE_ICONS[v.type]} <span style={{ fontWeight: 600, fontSize: 12 }}>{v.name}</span>
                            </span>
                            <span style={{ fontSize: 11 }}>{v.completed}/{v.trips} trips · {rate}%</span>
                          </div>
                          <div className="util-bar-track">
                            <div className="util-bar-fill" style={{ width: `${rate}%`, background: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--danger)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Fleet Composition */}
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Fleet Composition</div></div>
                <div style={{ padding: "16px 20px" }}>
                  <div className="donut-wrap">
                    {(() => {
                      let pct = 0;
                      const gradParts = byType.map(t => { const from = pct; pct += (t.count / fleetTotal) * 100; return `${t.color} ${from.toFixed(1)}% ${pct.toFixed(1)}%`; });
                      return (
                        <div className="donut" style={{ background: `conic-gradient(${gradParts.join(", ")})` }}>
                          <div style={{ position: "absolute", width: 64, height: 64, background: "var(--surface)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                            <div className="donut-center-val">{vehicles.length}</div>
                            <div className="donut-center-label">Fleet</div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="donut-legend">
                      {byType.map(t => (
                        <div className="donut-legend-item" key={t.type}>
                          <div className="donut-legend-dot" style={{ background: t.color }} />
                          {t.label}
                          <span className="donut-legend-pct">{t.count} ({Math.round(t.count / fleetTotal * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Cost Split */}
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Cost Breakdown</div></div>
                <div style={{ padding: "16px 20px" }}>
                  {costTotal <= 1 ? <Empty msg="No cost data for this period" /> : costItems.map(c => {
                    const pct = Math.round((c.val / costTotal) * 100);
                    return (
                      <div key={c.label} style={{ marginBottom: 12 }}>
                        <div className="util-bar-label">
                          <span>{c.label}</span>
                          <span>{fmtK(c.val)} ({pct}%)</span>
                        </div>
                        <div className="util-bar-track">
                          <div className="util-bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Driver Performance ── */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-header">
              <div className="panel-title">Driver Performance</div>
              <button className="export-btn" style={{ padding: "5px 12px", fontSize: 10 }} onClick={() => handleExport("Payroll")}><FiDownload size={11} /> Payroll CSV</button>
            </div>
            {DRIVER_PERF.length === 0 ? <Empty msg="No driver data available" /> : (
              <table className="data-table">
                <thead>
                  <tr><th>Driver</th><th>Trips</th><th>Completed</th><th>KM Driven</th><th>Avg KM/Trip</th><th>Safety Score</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  {DRIVER_PERF.sort((a, b) => b.score - a.score).map(d => {
                    const avgKm = d.trips > 0 ? Math.round(d.km / d.trips) : 0;
                    return (
                      <tr key={d.name}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,var(--accent),#c2410c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>{d.name[0]}</div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace" }}>{d.trips}</td>
                        <td style={{ fontFamily: "monospace" }}>{d.completed}</td>
                        <td style={{ fontFamily: "monospace" }}>{fmt(d.km)} km</td>
                        <td style={{ fontFamily: "monospace" }}>{avgKm} km</td>
                        <td><span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(d.score) }}>{d.score}</span><span style={{ fontSize: 10, color: "var(--muted)" }}>/100</span></td>
                        <td style={{ width: 160 }}>
                          <div className="util-bar-track" style={{ marginBottom: 0 }}>
                            <div className="util-bar-fill" style={{ width: `${d.score}%`, background: scoreColor(d.score) }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── One-Click Exports ── */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title"><FiDownload size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />One-Click Exports</div></div>
            <div style={{ display: "flex", gap: 12, padding: "16px 20px", flexWrap: "wrap" }}>
              {[
                { label: "Driver Payroll Report",   icon: <FiUsers    size={13} />, type: "Payroll"    },
                { label: "Fuel Audit CSV",          icon: <FiDroplet  size={13} />, type: "Fuel"       },
                { label: "Vehicle Health Report",   icon: <FiTool     size={13} />, type: "Health"     },
                { label: "Trip Summary",            icon: <FiPackage  size={13} />, type: "Trips"      },
                { label: "Driver Compliance Report",icon: <FiClipboard size={13} />, type: "Compliance" },
              ].map(e => (
                <button key={e.type} className="export-btn" onClick={() => handleExport(e.type)}>
                  {e.icon} {e.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}