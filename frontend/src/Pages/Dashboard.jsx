import { useState, useEffect } from "react";
import "../Styles/global.css";
import api from '../api';
import { FiGrid, FiTruck, FiPackage, FiTool, FiDroplet, FiUser, FiBarChart2, FiSun, FiMoon, FiLogOut, FiSearch, FiAlertTriangle, FiCheckCircle, FiActivity } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

// ── Static mock data 
const NAV_ITEMS = [
  { icon: <FiGrid size={16} />, label: "Dashboard", page: "dashboard" },
  { icon: <FiTruck size={16} />, label: "Vehicle Registry", page: "vehicles" },
  { icon: <FiPackage size={16} />, label: "Trip Dispatcher", page: "trips" },
  { icon: <FiTool size={16} />, label: "Maintenance Logs", page: "maintenance" },
  { icon: <FiDroplet size={16} />, label: "Fuel & Toll Expense", page: "fuel" },
  { icon: <FiUser size={16} />, label: "Driver Profiles", page: "drivers" },
  { icon: <FiBarChart2 size={16} />, label: "Analytics", page: "analytics" },
];

const TYPE_ICONS = { 
  Van: <FiTruck size={14} />, 
  Truck: <FiTruck size={14} />, 
  "Mini-Truck": <FiTruck size={14} />, 
  Bike: <LuBike size={14} /> 
};

// ── Role-based KPI definitions 
const ROLE_KPIS = {
  Manager: (v, d, t, e, m) => [
    { label: "Active Fleet", value: v.filter(x => x.status === "on-trip").length, sub: `${v.filter(x => x.status === "available").length} vehicles available`, icon: <FiTruck size={18} />, color: "var(--accent)" },
    { label: "Maintenance Alerts", value: v.filter(x => x.status === "in-shop").length, sub: "Vehicles currently in shop", icon: <FiTool size={18} />, color: "var(--danger)" },
    { label: "Utilization Rate", value: `${v.length > 0 ? Math.round(v.filter(x => x.status === "on-trip").length / v.length * 100) : 0}%`, sub: "Fleet assigned vs idle", icon: <FiBarChart2 size={18} />, color: "var(--success)" },
    { label: "Pending Cargo", value: t.filter(x => x.status === 'draft').length, sub: "Shipments awaiting assignment", icon: <FiPackage size={18} />, color: "var(--warning)" },
  ],
  Dispatcher: (v, d, t, e, m) => [
    { label: "Active Trips", value: v.filter(x => x.status === "on-trip").length, sub: "Vehicles currently on trip", icon: <FiTruck size={18} />, color: "var(--accent)" },
    { label: "Available Vehicles", value: v.filter(x => x.status === "available").length, sub: "Ready for dispatch", icon: <FiCheckCircle size={18} />, color: "var(--success)" },
    { label: "Pending Cargo", value: t.filter(x => x.status === 'draft').length, sub: "Shipments awaiting assignment", icon: <FiPackage size={18} />, color: "var(--warning)" },
    { label: "Total Fleet", value: v.length, sub: "Vehicles in registry", icon: <FiGrid size={18} />, color: "var(--muted)" },
  ],
  Safety: (v, d, t, e, m) => {
    const expiredCount = d.filter(dr => {
      const days = Math.ceil((new Date(dr.expiry) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 30;
    }).length;
    const activeDrivers = d.filter(dr => dr.status === 'active' || dr.status === 'on-trip').length;
    const complianceRate = d.length > 0 ? Math.round((d.filter(dr => dr.status !== 'inactive').length / d.length) * 100) : 100;

    return [
      { label: "In Shop", value: v.filter(x => x.status === "in-shop").length, sub: "Vehicles under maintenance", icon: <FiTool size={18} />, color: "var(--danger)" },
      { label: "License Expiries", value: expiredCount, sub: "Drivers expiring this month", icon: <FiAlertTriangle size={18} />, color: "var(--warning)" },
      { label: "Active Drivers", value: activeDrivers, sub: "Currently on duty", icon: <FiUser size={18} />, color: "var(--accent)" },
      { label: "Compliance Rate", value: `${complianceRate}%`, sub: "Drivers fully compliant", icon: <FiCheckCircle size={18} />, color: "var(--success)" },
    ];
  },
  Analyst: (v, d, t, e, m) => {
    const totalFuel = e.filter(ex => ex.type === 'fuel').reduce((sum, curr) => sum + (Number(curr.cost) || 0), 0);
    const totalExpenses = e.reduce((sum, curr) => sum + (Number(curr.cost) || 0), 0);
    const fuelPct = totalExpenses > 0 ? Math.round((totalFuel / totalExpenses) * 100) : 0;
    const totalKm = v.reduce((sum, curr) => sum + (Number(curr.odometer) || 0), 0);
    const avgCostPerKm = totalKm > 0 ? (totalExpenses / totalKm).toFixed(1) : 0;

    return [
      { label: "Total Fuel Cost", value: `₹${(totalFuel / 100000).toFixed(2)}L`, sub: "This month", icon: <FiDroplet size={18} />, color: "var(--warning)" },
      { label: "Avg Cost/km", value: `₹${avgCostPerKm}`, sub: "Across all vehicles", icon: <FiBarChart2 size={18} />, color: "var(--accent)" },
      { label: "Top Expense", value: "Fuel", sub: `${fuelPct}% of total spend`, icon: <FiActivity size={18} />, color: "var(--danger)" },
      { label: "Monthly Savings", value: "₹0", sub: "vs last month", icon: <FiCheckCircle size={18} />, color: "var(--success)" },
    ];
  },
};

const ROLE_SUBTITLES = {
  Manager: "Full fleet overview — all systems",
  Dispatcher: "Dispatch operations — trips & vehicles",
  Safety: "Safety & compliance overview",
  Analyst: "Financial & analytics overview",
};

// ── Sidebar 
export function Sidebar({ user, currentPage, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><FiTruck size={20} /></div>
        <div className="sidebar-brand-name">Transit<span>Ops</span></div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.role?.[0] ?? "U"}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.email?.split("@")[0] ?? "User"}</div>
          <div className="sidebar-user-role">{user?.role ?? "Guest"}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {NAV_ITEMS.filter(item => permissions.includes(item.page)).map((item) => (
          <button
            key={item.page}
            className={`nav-item ${currentPage === item.page ? "active" : ""}`}
            onClick={() => onNavigate(item.page)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span>{theme === "dark" ? <FiSun size={14} /> : <FiMoon size={14} />}</span>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button className="logout-btn" onClick={onLogout}>
          <span className="nav-icon"><FiLogOut size={14} /></span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── KPI Card 
function KpiCard({ label, value, sub, icon, color, trend, trendDir }) {
  return (
    <div className="kpi-card" style={{ "--kpi-color": color }}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-value">
        {value}
        {trend && (
          <span className={`kpi-trend ${trendDir}`}>
            {trendDir === "up" ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

// ── Dashboard Page 
export default function Dashboard({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [time, setTime] = useState(new Date());

  // fallback theme handling if not passed from App.jsx
  const [localTheme, setLocalTheme] = useState(() =>
    localStorage.getItem("transitops-theme") || "dark"
  );
  const handleToggleTheme = () => {
    const next = localTheme === "dark" ? "light" : "dark";
    setLocalTheme(next);
    localStorage.setItem("transitops-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };
  const activeTheme = theme || localTheme;
  const activeToggle = onToggleTheme || handleToggleTheme;

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, dRes, tRes, eRes, mRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/trips'),
        api.get('/expenses'),
        api.get('/maintenance'),
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      setTrips(tRes.data);
      setExpenses(eRes.data);
      setMaintenance(mRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const role = user?.role ?? "Manager";

  // ── Role-filtered data 

  // KPIs — role specific
  const kpis = (ROLE_KPIS[role] || ROLE_KPIS.Manager)(vehicles, drivers, trips, expenses, maintenance);

  // Vehicle table visibility
  const showVehicleTable = permissions.includes("vehicles") || permissions.includes("trips") || permissions.includes("maintenance");
  const showVehicleLink = permissions.includes("vehicles");

  // Vehicle rows — Safety only sees in-shop
  const filteredVehicles = vehicles.filter(v => {
    const matchType = typeFilter === "All" || v.type === typeFilter;
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.plate.toLowerCase().includes(search.toLowerCase());
    const matchRole = role === "Safety" ? v.status === "in-shop" : true;
    return matchType && matchStatus && matchSearch && matchRole;
  });

  // Dynamically build ALL_ALERTS
  const ALL_ALERTS = [];
  const expDrivers = drivers.filter(d => {
    const days = Math.ceil((new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30; // expiring in next 30 days
  });
  expDrivers.forEach(d => {
    ALL_ALERTS.push({ level: "danger", tag: "drivers", title: "License Expiry", sub: `Driver ${d.name} — expires ${d.expiry.split('T')[0]}`, time: "Soon" });
  });
  vehicles.filter(v => v.status === "in-shop").forEach(v => {
    ALL_ALERTS.push({ level: "warning", tag: "maintenance", title: "Vehicle In-Shop", sub: `${v.name} is currently under maintenance`, time: "Active" });
  });
  const draftTrips = trips.filter(t => t.status === "draft");
  if (draftTrips.length > 0) {
    ALL_ALERTS.push({ level: "warning", tag: "trips", title: "Pending Cargo", sub: `${draftTrips.length} shipments awaiting assignment`, time: "Now" });
  }

  // Alerts — only show alerts relevant to this role's pages
  const filteredAlerts = ALL_ALERTS.filter(a => permissions.includes(a.tag));

  // Dynamically build ALL_ACTIVITY
  const ALL_ACTIVITY = [];
  trips.slice(0, 3).forEach(t => {
    ALL_ACTIVITY.push({ icon: t.status === 'completed' ? "check" : (t.status === 'dispatched' ? "truck" : "package"), tag: "trips", vehicle: t.vehicleName || t.vehicleid || "Trip", text: `trip ${t.status} to ${t.tolocation || t.toLocation}`, time: t.date?.split('T')[0] || "recently" });
  });
  maintenance.slice(0, 2).forEach(m => {
    ALL_ACTIVITY.push({ icon: "tool", tag: "maintenance", vehicle: m.vehicleName || m.vehicleid || "Vehicle", text: `maintenance logged: ${m.title}`, time: m.date?.split('T')[0] || "recently" });
  });
  expenses.filter(e => e.type === "fuel").slice(0, 2).forEach(e => {
    ALL_ACTIVITY.push({ icon: "fuel", tag: "fuel", vehicle: e.vehicleName || e.vehicleid || "Vehicle", text: `fuel log added — ${e.liters}L @ ₹${e.priceperl || e.pricePerL}/L`, time: e.date?.split('T')[0] || "recently" });
  });

  // Activity — only show activity relevant to this role's pages
  const filteredActivity = ALL_ACTIVITY.filter(a => permissions.includes(a.tag));

  // Fleet utilization bar — only for roles with vehicle/maintenance access
  const showUtilization = permissions.includes("vehicles") || permissions.includes("maintenance");

  const activeFleet = vehicles.filter(v => v.status === "on-trip").length;
  const inShop = vehicles.filter(v => v.status === "in-shop").length;
  const available = vehicles.filter(v => v.status === "available").length;
  const utilRate = vehicles.length > 0 ? Math.round((activeFleet / vehicles.length) * 100) : 0;

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={activeTheme}
        onToggleTheme={activeToggle}
        permissions={permissions}
      />

      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">{role} Dashboard</div>
            <div className="topbar-sub">{ROLE_SUBTITLES[role]}</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-time">
              {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="topbar-pill">
              <div className="status-dot" />
              All Systems Live
            </div>
          </div>
        </div>

        <div className="page-body">

          {/* KPI Row — role specific */}
          <div className="kpi-grid">
            {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
          </div>

          <div className="dash-grid">

            {/* LEFT: Vehicle table for Manager/Dispatcher/Safety, Expense breakdown for Analyst */}
            {showVehicleTable ? (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">
                    {role === "Safety" ? "Vehicles In Maintenance" : "Fleet Registry — Live Status"}
                  </div>
                  {showVehicleLink && (
                    <button className="panel-action" onClick={() => onNavigate("vehicles")}>
                      View All →
                    </button>
                  )}
                </div>

                {/* Filters hidden for Safety — they always see in-shop only */}
                {role !== "Safety" && (
                  <div className="filter-bar">
                    {["All", "Van", "Truck", "Bike"].map(t => (
                      <button key={t} className={`filter-btn ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>{t}</button>
                    ))}
                    <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />
                    {["All", "available", "on-trip", "in-shop"].map(s => (
                      <button key={s} className={`filter-btn ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                        {s === "All" ? "All Status" : s.replace("-", " ")}
                      </button>
                    ))}
                    <div className="filter-search">
                      <span style={{ color: "var(--muted)", fontSize: 12 }}><FiSearch size={12} /></span>
                      <input placeholder="Search vehicle..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                  </div>
                )}

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th><th>Type</th><th>Plate No.</th>
                      <th>Capacity</th><th>Region</th><th>Odometer</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div className="vehicle-avatar">
                              {TYPE_ICONS[v.type] || <FiTruck size={14} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.3px" }}>{v.id}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="type-badge">{TYPE_ICONS[v.type]} {v.type}</span></td>
                        <td><span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12, letterSpacing: "0.5px", color: "var(--text)" }}>{v.plate}</span></td>
                        <td>{v.capacity} kg</td>
                        <td>{v.region}</td>
                        <td style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12 }}>{v.odometer.toLocaleString()} km</td>
                        <td><span className={`status-pill ${v.status}`}>{v.status.replace("-", " ")}</span></td>
                      </tr>
                    ))}
                    {filteredVehicles.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontSize: 13 }}>
                          No vehicles match the current filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Analyst sees expense breakdown instead */
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Expense Breakdown — Lifetime</div>
                  <button className="panel-action" onClick={() => onNavigate("fuel")}>View Details →</button>
                </div>
                <div style={{ padding: "24px 20px" }}>
                  {(() => {
                    const fuelTotal = expenses.filter(e => e.type === "fuel").reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
                    const maintenanceTotal = expenses.filter(e => e.type === "maintenance").reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
                    const tollTotal = expenses.filter(e => e.type === "toll").reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
                    const otherTotal = expenses.filter(e => !["fuel", "maintenance", "toll"].includes(e.type)).reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
                    const grandTotal = fuelTotal + maintenanceTotal + tollTotal + otherTotal;

                    const breakdown = [
                      { label: "Fuel", amount: fuelTotal, color: "var(--warning)" },
                      { label: "Maintenance", amount: maintenanceTotal, color: "var(--danger)" },
                      { label: "Tolls", amount: tollTotal, color: "var(--accent)" },
                      { label: "Other", amount: otherTotal, color: "var(--muted)" },
                    ];

                    return breakdown.map((item, i) => {
                      const pct = grandTotal > 0 ? Math.round((item.amount / grandTotal) * 100) : 0;
                      return (
                        <div key={i} style={{ marginBottom: 20 }}>
                          <div className="util-bar-label">
                            <span>{item.label}</span>
                            <span style={{ color: item.color, fontWeight: 700 }}>₹{item.amount.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="util-bar-track">
                            <div className="util-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* RIGHT column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Alerts — role filtered */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title"><FiAlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Alerts</div>
                  <button className="panel-action">Clear All</button>
                </div>
                <div className="alert-list">
                  {filteredAlerts.length > 0 ? filteredAlerts.map((a, i) => (
                    <div className="alert-item" key={i}>
                      <div className={`alert-dot-wrap ${a.level}`} />
                      <div className="alert-body">
                        <div className="alert-title">{a.title}</div>
                        <div className="alert-sub">{a.sub}</div>
                      </div>
                      <div className="alert-time">{a.time}</div>
                    </div>
                  )) : (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
                      No alerts for your role
                    </div>
                  )}
                </div>
              </div>

              {/* Fleet Utilization — Manager / Dispatcher / Safety */}
              {showUtilization ? (
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Fleet Utilization</div>
                  </div>
                  <div className="util-bar-wrap">
                    <div className="util-bar-label"><span>On Trip</span><span>{activeFleet}/{vehicles.length}</span></div>
                    <div className="util-bar-track">
                      <div className="util-bar-fill" style={{ width: `${utilRate}%` }} />
                    </div>
                    <div className="util-bar-label"><span>Available</span><span>{available}/{vehicles.length}</span></div>
                    <div className="util-bar-track">
                      <div className="util-bar-fill green" style={{ width: `${vehicles.length > 0 ? Math.round(available / vehicles.length * 100) : 0}%` }} />
                    </div>
                    <div className="util-bar-label"><span>In Shop</span><span>{inShop}/{vehicles.length}</span></div>
                    <div className="util-bar-track">
                      <div className="util-bar-fill red" style={{ width: `${vehicles.length > 0 ? Math.round(inShop / vehicles.length * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                /* Analyst: quick action buttons instead */
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Quick Actions</div>
                  </div>
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <button className="btn-primary" onClick={() => onNavigate("analytics")} style={{ justifyContent: "center" }}>
                      <FiBarChart2 size={14} /> Open Analytics
                    </button>
                    <button className="btn-secondary" onClick={() => onNavigate("fuel")} style={{ justifyContent: "center" }}>
                      <FiDroplet size={14} /> View Fuel & Toll Expense
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed — role filtered, hidden if nothing to show */}
          {filteredActivity.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Recent Activity</div>
                <button className="panel-action">View All</button>
              </div>
              <div className="activity-feed" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {filteredActivity.map((a, i) => (
                  <div className="activity-item" key={i}>
                    <div className="activity-icon">
                      {a.icon === "check" ? <FiCheckCircle size={14} /> : a.icon === "truck" ? <FiTruck size={14} /> : a.icon === "package" ? <FiPackage size={14} /> : a.icon === "tool" ? <FiTool size={14} /> : <FiDroplet size={14} />}
                    </div>
                    <div className="activity-body">
                      <div className="activity-text"><strong>{a.vehicle}</strong> {a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}