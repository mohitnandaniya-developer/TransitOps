import { useState, useEffect } from "react";
import "../Styles/global.css";
import "../styles/modal.css";
import { Sidebar } from './Dashboard';
import api from '../api';
import { FiUsers, FiCheckCircle, FiAlertTriangle, FiSearch, FiUserPlus, FiEdit, FiEdit2, FiTruck, FiAlertOctagon, FiTrash, FiX } from "react-icons/fi";

const EMPTY_FORM = { name: "", license: "", category: "Van", expiry: "", phone: "" };
const CATEGORIES = ["Van", "Truck", "Bike"];

const daysUntil = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
const licenseValid = (expiry) => daysUntil(expiry) > 0;
const expiryColor = (days) => days < 0 ? "var(--danger)" : days < 30 ? "var(--warning)" : "var(--success)";
const scoreColor = (s) => s >= 85 ? "" : s >= 65 ? "mid" : "low";
const driverColor = (status) => ({ available: "var(--success)", "on-duty": "var(--accent)", "off-duty": "var(--muted)", suspended: "var(--danger)" }[status] || "var(--accent)");

// ── Driver Form Modal ────────────────────────────────────────────────────────
function DriverFormModal({ driver, onSuccess, onClose }) {
  const [form, setForm] = useState(driver || EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Full name is required";
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (form.phone.length !== 10) {
      errors.phone = "Phone number must be 10 digits";
    }
    if (!form.license.trim()) errors.license = "License number is required";
    if (!form.category) errors.category = "License category is required";
    if (!form.expiry) {
      errors.expiry = "License expiry date is required";
    } else {
      const expiryDate = new Date(form.expiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) errors.expiry = "License expiry date cannot be in the past";
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setIsSaving(true);
    try {
      if (driver?.id) {
        await api.put(`/drivers/${driver.id}`, { ...form });
      } else {
        const tempId = `DR-${Date.now().toString().slice(-4)}`;
        await api.post('/drivers', { ...form, id: tempId, status: "available", trips: 0, safetyScore: 100 });
      }
      onSuccess();
    } catch (err) {
      setModalError("Failed to save driver. Please try again.");
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
        @keyframes dfmEnter {
          from { opacity: 0; transform: scale(0.93) translateY(-20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .dfm-modal { animation: dfmEnter 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .dfm-field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .dfm-section-title { font-size: 11px; font-weight: 700; color: var(--accent, #f97316); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .dfm-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .dfm-err { color: var(--error, #ef4444); font-size: 11px; margin-top: 4px; }
        .dfm-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316 0%, #ea6508 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
        .dfm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .dfm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        select option { background-color: var(--card, #1a2332); color: var(--text, #e8edf5); }
      `}</style>
      <div
        className="modal dfm-modal brand-accent"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, width: "100%", borderRadius: 18, overflow: "hidden", padding: 0 }}
      >
        <div style={{ background: "linear-gradient(135deg, #f97316 0%, #d45d00 100%)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <FiUsers size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{driver ? "Edit Driver" : "Register Driver"}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Manage personal and license information</div>
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
              <FiAlertOctagon size={14} />
              {modalError}
            </div>
          )}

          <div className="dfm-section-title">Personal Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="dfm-field">
              <label>Full Name *</label>
              <input placeholder="e.g. Alex Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={fieldStyle("name")} />
              {formErrors.name && <div className="dfm-err">{formErrors.name}</div>}
            </div>
            <div className="dfm-field">
              <label>Phone Number *</label>
              <input maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} style={fieldStyle("phone")} />
              {formErrors.phone && <div className="dfm-err">{formErrors.phone}</div>}
            </div>
          </div>

          <div className="dfm-section-title">License &amp; Category</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="dfm-field">
              <label>License Number *</label>
              <input placeholder="e.g. MH-D-123456" value={form.license} onChange={e => setForm(f => ({ ...f, license: e.target.value }))} style={fieldStyle("license")} />
              {formErrors.license && <div className="dfm-err">{formErrors.license}</div>}
            </div>
            <div className="dfm-field">
              <label>License Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={fieldStyle("category")}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="dfm-section-title">Validity</div>
          <div className="dfm-field" style={{ marginBottom: 24 }}>
            <label>Expiry Date *</label>
            <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} style={fieldStyle("expiry")} />
            {formErrors.expiry && <div className="dfm-err">{formErrors.expiry}</div>}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button className="dfm-btn" style={{ flex: 2 }} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : <><FiEdit2 size={14} /> Register Driver</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function DriverProfiles({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [globalError, setGlobalError] = useState(null);
  const [deletingDriver, setDeletingDriver] = useState(null);

  const isManager = user?.role === "Manager";

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const onSaveSuccess = () => {
    setShowModal(false);
    setEditTarget(null);
    fetchDrivers();
    setSuccessMsg(editTarget ? "Driver updated successfully" : "New driver added to fleet");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteSubmit = async (driver) => {
    try {
      await api.delete(`/drivers/${driver.id}`);
      setSuccessMsg(`Driver ${driver.name} deleted successfully`);
      setTimeout(() => setSuccessMsg(""), 3500);
      setDeletingDriver(null);
      fetchDrivers();
    } catch (err) {
      setGlobalError(err.response?.data?.error || "Failed to delete driver.");
      setDeletingDriver(null);
    }
  };

  const setStatus = async (d, status) => {
    try {
      await api.put(`/drivers/${d.id}`, { ...d, status });
      fetchDrivers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filtered = drivers.filter(d => {
    const matchFilter = filter === "All" || d.status === filter.toLowerCase().replace(" ", "-");
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.license && d.license.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const counts = {
    total: drivers.length,
    available: drivers.filter(d => d.status === "available").length,
    onDuty: drivers.filter(d => d.status === "on-duty").length,
    suspended: drivers.filter(d => d.status === "suspended").length,
    expiring: drivers.filter(d => daysUntil(d.expiry) < 30 && daysUntil(d.expiry) > 0).length,
  };

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        currentPage="drivers"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Driver Profiles</div>
            <div className="topbar-sub">HR & compliance management — license tracking & safety scores</div>
          </div>
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {counts.expiring > 0 && (
              <div className="topbar-pill" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.2)", color: "var(--warning)" }}>
                <FiAlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {counts.expiring} Expiring
              </div>
            )}
            <div className="topbar-pill"><div className="status-dot" />{counts.total} Drivers</div>
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #f97316 0%, #ea6508 100%)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                transition: "all 0.2s",
              }}
            >
              <FiUserPlus size={14} /> Add Driver
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
            <div className="in-shop-banner" style={{ backgroundColor: 'var(--error-bg, #fee)', color: 'var(--error-text, #c00)', borderColor: 'var(--error-border, #fcc)', marginBottom: 16 }}>
              <FiAlertOctagon size={14} /> {globalError}
            </div>
          )}

          <div className="summary-strip" style={{ marginBottom: 20 }}>
            {[
              { icon: <FiUsers size={18} />, val: counts.total, label: "Total Drivers" },
              { icon: <FiCheckCircle size={18} />, val: counts.available, label: "Available" },
              { icon: <FiTruck size={18} />, val: counts.onDuty, label: "On Duty" },
              { icon: <FiAlertTriangle size={18} />, val: counts.suspended, label: "Suspended" },
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

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Fleet Operators</div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="filter-search">
                  <FiSearch size={12} color="var(--muted)" />
                  <input placeholder="Search name or license..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="filter-bar">
              {["All", "Available", "On Duty", "Off Duty", "Suspended"].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>

            <div className="drivers-grid" style={{ padding: 16 }}>
              {filtered.map(d => {
                const days = daysUntil(d.expiry);
                const valid = licenseValid(d.expiry);
                const pct = Math.min(Math.max((days / 365) * 100, 0), 100);
                const safety = Number(d.safetyScore || d.safetyscore || 0);
                return (
                  <div className={`driver-card ${d.status === "suspended" ? "suspended" : ""}`}
                    key={d.id} style={{ "--driver-color": driverColor(d.status) }}>
                    <div className="driver-card-top">
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="driver-avatar">{d.name[0]}</div>
                        <div>
                          <div className="driver-name">{d.name}</div>
                          <div className="driver-id">{d.id} · {d.phone}</div>
                        </div>
                      </div>
                      <span className={`status-pill ${d.status}`}>{d.status.replace("-", " ")}</span>
                    </div>
                    {!valid && (
                      <div style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)", padding: "8px 12px", borderRadius: 8, fontSize: 11, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <FiAlertOctagon size={14} /> License expired — blocked from dispatch
                      </div>
                    )}
                    <div className="driver-info-grid">
                      <div className="driver-info-item">
                        <div className="driver-info-label">License No.</div>
                        <div className="driver-info-val" style={{ fontSize: 11, fontFamily: "monospace" }}>{d.license}</div>
                      </div>
                      <div className="driver-info-item">
                        <div className="driver-info-label">Category</div>
                        <div className="driver-info-val">{d.category}</div>
                      </div>
                      <div className="driver-info-item">
                        <div className="driver-info-label">Trips Completed</div>
                        <div className="driver-info-val">{d.trips}</div>
                      </div>
                      <div className="driver-info-item">
                        <div className="driver-info-label">Expiry Date</div>
                        <div className="driver-info-val" style={{ color: expiryColor(days), fontSize: 11 }}>
                          {d.expiry} {days < 30 && days > 0 ? `(${days}d left)` : days < 0 ? "(Expired)" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="license-expiry-bar">
                      <div className="license-expiry-label">
                        <span>License Validity</span>
                        <span style={{ color: expiryColor(days) }}>{days < 0 ? "Expired" : `${days} days left`}</span>
                      </div>
                      <div className="util-bar-track" style={{ height: 6, borderRadius: 3 }}>
                        <div className="util-bar-fill" style={{ width: `${pct}%`, background: expiryColor(days), borderRadius: 3 }} />
                      </div>
                    </div>
                    <div className="driver-card-footer" style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
                      <div className="score-badge">
                        <span>Safety</span>
                        <span className={`score-val ${scoreColor(safety)}`}>{safety}</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>/100</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div className="duty-toggle-row">
                          {[
                            { label: "On", val: "available", cls: "active-on" },
                            { label: "Off", val: "off-duty", cls: "active-off" },
                            { label: "Sus", val: "suspended", cls: "active-sus" },
                          ].map(btn => (
                            <button key={btn.val}
                              className={`duty-btn ${d.status === btn.val || (btn.val === "available" && d.status === "on-duty") ? btn.cls : ""}`}
                              onClick={() => setStatus(d, btn.val)}>{btn.label}</button>
                          ))}
                        </div>
                        <button className="btn-action btn-action-edit"
                          onClick={() => { setEditTarget(d); setShowModal(true); }} title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        {isManager && (
                          <button className="btn-action"
                            style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}
                            onClick={() => setDeletingDriver(d)} title="Delete">
                            <FiTrash size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--muted)", padding: 60, fontSize: 13 }}>
                  No drivers match the current filter
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <DriverFormModal
          driver={editTarget}
          onSuccess={onSaveSuccess}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}

      {deletingDriver && (
        <DeleteDialog
          driver={deletingDriver}
          onConfirm={handleDeleteSubmit}
          onCancel={() => setDeletingDriver(null)}
        />
      )}
    </div>
  );
}

function DeleteDialog({ driver, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal brand-accent dfm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 18, overflow: 'hidden', padding: 0 }}>
        <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", padding: "20px 24px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <FiTrash size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Confirm Deletion</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>This action is permanent and irreversible</div>
          </div>
        </div>
        <div style={{ padding: 24, background: "var(--bg-secondary)" }}>
          <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 20, lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>{driver.name}</strong>? All associated driver history and records will be purged.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button
              onClick={async () => { setIsDeleting(true); await onConfirm(driver); }}
              disabled={isDeleting}
              style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyCenter: "center", gap: 8 }}
            >
              {isDeleting ? "Deleting..." : "Delete Final"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
