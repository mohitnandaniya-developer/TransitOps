import { useState, useEffect } from "react";
import "../Styles/global.css";
import { Sidebar } from './Dashboard';
import "../styles/modal.css";
import api from '../api';
import { FiTruck, FiTool, FiAlertCircle, FiCheckCircle, FiCreditCard, FiCalendar, FiUser, FiTrash, FiX } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

// Custom SVG Icons for all vehicle types

const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconMiniTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 5h12v10H1z" /><path d="M13 9h5l3 4v2h-8V9z" /><circle cx="5" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
  </svg>
);

const IconVan = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7h18l2 5v4H2z" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
  </svg>
);

const IconBike = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6a1 1 0 0 0-1-1H9" /><path d="m12 6 4 4-4 4" /><path d="M5.5 17.5 9 6h6l3 5.5" />
  </svg>
);

const TYPE_ICONS = {
  "Truck": <IconTruck />,
  "Mini-Truck": <IconMiniTruck />,
  "Van": <IconVan />,
  "Bike": <IconBike />
};

const SERVICE_TYPES = ["preventive", "reactive", "scheduled"];
const EMPTY_FORM = { vehicleId: "", type: "preventive", title: "", desc: "", cost: "", tech: "" };

// ── Maintenance Form Modal ──────────────────────────────────────────────────
function MaintenanceFormModal({ vehicles, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!form.vehicleId) errors.vehicleId = "Vehicle is required";
    if (!form.type) errors.type = "Type is required";
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.desc.trim()) errors.desc = "Description is required";
    if (!form.cost || form.cost <= 0) errors.cost = "Valid cost is required";
    if (!form.tech.trim()) errors.tech = "Technician/Garage is required";
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setIsSaving(true);
    try {
      const vehicle = vehicles.find(v => v.id === form.vehicleId);
      const newLogId = `SV-${Date.now().toString().slice(-4)}`;
      await api.post('/maintenance', {
        id: newLogId,
        vehicleId: vehicle.id,
        type: form.type,
        title: form.title,
        desc: form.desc,
        date: new Date().toISOString().split("T")[0],
        cost: Number(form.cost),
        status: "in-shop",
        tech: form.tech || "In-house",
      });
      await api.put(`/vehicles/${vehicle.id}`, { status: "in-shop" });
      onSuccess();
    } catch (err) {
      setModalError("Failed to save service log. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldStyle = (field) => ({
    width: "100%", padding: "10px 14px",
    borderRadius: 8, fontSize: 13,
    border: `1.5px solid ${formErrors[field] ? "var(--error, #ef4444)" : "var(--border, rgba(255,255,255,0.1))"}`,
    backgroundColor: formErrors[field] ? "rgba(239,68,68,0.07)" : "var(--bg-primary)",
    color: "var(--text)", outline: "none", transition: "border-color 0.2s",
    boxSizing: "border-box",
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style>{`
        @keyframes mfmEnter {
          from { opacity: 0; transform: scale(0.93) translateY(-20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .mfm-modal { animation: mfmEnter 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .mfm-field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .mfm-section-title { font-size: 11px; font-weight: 700; color: var(--accent, #f97316); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .mfm-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .mfm-err { color: var(--error, #ef4444); font-size: 11px; margin-top: 4px; }
        .mfm-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316 0%, #ea6508 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
        .mfm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .mfm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        select option { background-color: var(--card, #1a2332); color: var(--text, #e8edf5); }
      `}</style>
      <div
        className="modal mfm-modal brand-accent"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, width: "100%", borderRadius: 18, overflow: "hidden", padding: 0 }}
      >
        <div style={{ background: "linear-gradient(135deg, #f97316 0%, #d45d00 100%)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <FiTool size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>Log Maintenance</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Record vehicle service and repair details</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "2px solid #ffffff",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "bold"
            }}
          >
            X
          </button>
        </div>

        <div style={{ padding: "24px", background: "var(--bg-secondary)" }}>
          {modalError && (
            <div style={{ background: "rgba(239,68,68,0.1)", color: "var(--error,#ef4444)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <FiAlertCircle size={14} />
              {modalError}
            </div>
          )}

          <div style={{ background: "rgba(249,115,22,0.06)", color: "var(--accent)", padding: "12px", borderRadius: 10, fontSize: 12, marginBottom: 20, display: "flex", gap: 10 }}>
            <FiAlertCircle size={16} />
            <div>
              Note: Logging a service will move the vehicle to <strong>In Shop</strong> status, making it unavailable for active trips.
            </div>
          </div>

          <div className="mfm-section-title">Vehicle & Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="mfm-field">
              <label>Select Vehicle *</label>
              <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} style={fieldStyle("vehicleId")}>
                <option value="">Choose...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.status})</option>)}
              </select>
              {formErrors.vehicleId && <div className="mfm-err">{formErrors.vehicleId}</div>}
            </div>
            <div className="mfm-field">
              <label>Service Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={fieldStyle("type")}>
                {SERVICE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="mfm-section-title">Service Details</div>
          <div className="mfm-field" style={{ marginBottom: 12 }}>
            <label>Service Title *</label>
            <input placeholder="e.g. Annual Engine Tuning" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={fieldStyle("title")} />
            {formErrors.title && <div className="mfm-err">{formErrors.title}</div>}
          </div>
          <div className="mfm-field" style={{ marginBottom: 18 }}>
            <label>Description *</label>
            <input placeholder="Describe work performed..." value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} style={fieldStyle("desc")} />
            {formErrors.desc && <div className="mfm-err">{formErrors.desc}</div>}
          </div>

          <div className="mfm-section-title">Commercials</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div className="mfm-field">
              <label>Total Cost (₹) *</label>
              <input type="number" placeholder="Cost in INR" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} style={fieldStyle("cost")} />
              {formErrors.cost && <div className="mfm-err">{formErrors.cost}</div>}
            </div>
            <div className="mfm-field">
              <label>Technician / Garage *</label>
              <input placeholder="Who did the work?" value={form.tech} onChange={e => setForm(f => ({ ...f, tech: e.target.value }))} style={fieldStyle("tech")} />
              {formErrors.tech && <div className="mfm-err">{formErrors.tech}</div>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button className="mfm-btn" style={{ flex: 2 }} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : <><FiCheckCircle size={14} /> Log Service</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function MaintenanceLogs({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [globalError, setGlobalError] = useState(null);
  const [deletingLog, setDeletingLog] = useState(null);

  const isManager = user?.role === "Manager";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vRes, lRes] = await Promise.all([api.get('/vehicles'), api.get('/maintenance')]);
      setVehicles(vRes.data);
      setLogs(lRes.data);
    } catch (err) { console.error("Error fetching data:", err); }
  };

  const onSaveSuccess = () => {
    setShowModal(false);
    fetchData();
    setSuccessMsg("Service log recorded successfully");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleComplete = async (logId) => {
    try {
      const log = logs.find(l => l.id === logId);
      await api.put(`/maintenance/${logId}`, { status: "completed" });
      await api.put(`/vehicles/${log.vehicleId}`, { status: "available" });
      fetchData();
    } catch (err) { console.error("Error completing maintenance:", err); }
  };

  const handleDeleteSubmit = async (log) => {
    try {
      await api.delete(`/maintenance/${log.id}`);
      setSuccessMsg(`Log deleted successfully`);
      setTimeout(() => setSuccessMsg(""), 3500);
      setDeletingLog(null);
      fetchData();
    } catch (err) {
      setGlobalError(err.response?.data?.error || "Failed to delete log.");
      setDeletingLog(null);
    }
  };

  const moneyINR = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

  const filtered = logs.filter(l => filter === "All" || l.type === filter.toLowerCase() || l.status === filter.toLowerCase());
  const inShopCount = filtered.filter(l => l.status === "in-shop").length;
  const totalCost = filtered.reduce((s, l) => s + Number(l.cost || 0), 0);
  const completedCount = filtered.filter(l => l.status === "completed").length;

  return (
    <div className="app-shell">
      <Sidebar user={user} currentPage="maintenance" onNavigate={onNavigate} onLogout={onLogout}
        theme={theme} onToggleTheme={onToggleTheme} permissions={permissions} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Maintenance &amp; Service</div>
            <div className="topbar-sub">Health tracking & preventative asset care</div>
          </div>
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="topbar-pill"><div className="status-dot" style={{ background: "var(--error)" }} />{inShopCount} In Shop</div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #f97316 0%, #ea6508 100%)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                transition: "all 0.2s",
              }}
            >
              <FiTool size={14} /> Log Service
            </button>
          </div>
        </div>

        <div className="page-body">
          {successMsg && (
            <div className="in-shop-banner" style={{ background: "rgba(34,211,165,0.08)", borderColor: "rgba(34,211,165,0.2)", color: "var(--success)", marginBottom: 16 }}>
              <FiCheckCircle size={14} /> {successMsg}
            </div>
          )}
          {globalError && (
            <div className="in-shop-banner" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "var(--error)", marginBottom: 16 }}>
              <FiAlertCircle size={14} /> {globalError}
            </div>
          )}

          <div className="summary-strip" style={{ marginBottom: 20 }}>
            {[
              { icon: <FiTool />, val: logs.length, label: "Total Logs" },
              { icon: <FiAlertCircle />, val: inShopCount, label: "In Shop" },
              { icon: <FiCheckCircle />, val: completedCount, label: "Completed" },
              { icon: <FiCreditCard />, val: moneyINR(totalCost), label: "Total Spent" },
            ].map(s => (
              <div className="summary-card" key={s.label}>
                <div className="summary-icon">{s.icon}</div>
                <div className="summary-info">
                  <div className="summary-val">{s.val}</div>
                  <div className="summary-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="maintenance-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Service History</div>
                  <div className="filter-bar" style={{ marginBottom: 0 }}>
                    {["All", "Preventive", "Reactive", "Scheduled", "In-shop", "Completed"].map(f => (
                      <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}>{f}</button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No service logs found</div>}
                  {filtered.map(log => (
                    <div className="service-card" key={log.id}>
                      <div className="service-card-header">
                        <div className="service-card-title">{log.title}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className={`service-type-badge ${log.type}`}>{log.type}</span>
                          <span className={`status-pill ${log.status === "in-shop" ? "in-shop" : "available"}`}>
                            {log.status === "in-shop" ? "In Shop" : "Completed"}
                          </span>
                        </div>
                      </div>
                      <div className="service-card-meta">
                        <span>{TYPE_ICONS[vehicles.find(v => v.id === log.vehicleId)?.type] || <FiTruck />} {log.vehicleName}</span>
                        <span><FiCalendar size={11} /> {log.date}</span>
                        <span><FiUser size={11} /> {log.tech}</span>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{moneyINR(log.cost)}</span>
                      </div>
                      {log.desc && <div className="service-card-desc">{log.desc}</div>}
                      <div className="service-card-footer">
                        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>{log.id}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {log.status === "in-shop" && (
                            <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 11 }}
                              onClick={() => handleComplete(log.id)}><FiCheckCircle size={12} /> Mark Complete</button>
                          )}
                          {isManager && (
                            <button className="btn-action" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}
                              onClick={() => setDeletingLog(log)}><FiTrash size={14} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Cost Breakdown</div></div>
                <div style={{ padding: 20 }}>
                  {["preventive", "reactive", "scheduled"].map(type => {
                    const typeCost = logs.filter(l => l.type === type).reduce((s, l) => s + Number(l.cost || 0), 0);
                    const pct = totalCost > 0 ? Math.round((typeCost / totalCost) * 100) : 0;
                    const color = { preventive: "var(--success)", reactive: "var(--error)", scheduled: "var(--accent)" }[type];
                    return (
                      <div key={type} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                          <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{type}</span>
                          <span style={{ color: "var(--muted)" }}>{moneyINR(typeCost)} ({pct}%)</span>
                        </div>
                        <div className="util-bar-track" style={{ height: 6, borderRadius: 3 }}>
                          <div className="util-bar-fill" style={{ width: `${pct}%`, background: color, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 13, fontWeight: 800 }}>
                    <span>Total Spent</span>
                    <span style={{ color: "var(--accent)" }}>{moneyINR(totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><div className="panel-title">Asset Health</div></div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "10px 0" }}>
                    Currently Tracking <strong>{vehicles.length}</strong> Assets
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {vehicles.map(v => (
                      <div key={v.id} title={`${v.name}: ${v.status}`} style={{
                        width: 32, height: 32, borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: v.status === "in-shop" ? "rgba(239,68,68,0.1)" : "rgba(34,211,165,0.1)",
                        color: v.status === "in-shop" ? "var(--error)" : "var(--success)",
                        border: `1px solid ${v.status === "in-shop" ? "rgba(239,68,68,0.2)" : "rgba(34,211,165,0.2)"}`
                      }}>
                        {TYPE_ICONS[v.type] || <FiTruck />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <MaintenanceFormModal vehicles={vehicles} onSuccess={onSaveSuccess} onClose={() => setShowModal(false)} />}
      {deletingLog && <DeleteDialog log={deletingLog} onConfirm={handleDeleteSubmit} onCancel={() => setDeletingLog(null)} />}
    </div>
  );
}

function DeleteDialog({ log, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal brand-accent mfm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 18, overflow: 'hidden', padding: 0 }}>
        <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", padding: "20px 24px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <FiTrash size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Confirm Deletion</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Maintenance records cannot be recovered</div>
          </div>
        </div>
        <div style={{ padding: 24, background: "var(--bg-secondary)" }}>
          <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 20, lineHeight: 1.6 }}>
            Are you sure you want to delete the service log <strong>{log.title}</strong> for <strong>{log.vehicleName}</strong>?
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button
              onClick={async () => { setIsDeleting(true); await onConfirm(log); }}
              disabled={isDeleting}
              style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              {isDeleting ? "Deleting..." : "Delete Final"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
