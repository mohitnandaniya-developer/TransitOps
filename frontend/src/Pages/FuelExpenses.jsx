import { useState, useEffect } from "react";
import "../Styles/global.css";
import "../styles/modal.css";
import { Sidebar } from './Dashboard';

import api from '../api';
import { FiTruck, FiCreditCard, FiDroplet, FiTool, FiTrash, FiX } from "react-icons/fi";
import { LuBike } from "react-icons/lu";

// Custom SVG Icons for all vehicle types
const IconTruck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconMiniTruck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 5h12v10H1z" /><path d="M13 9h5l3 4v2h-8V9z" /><circle cx="5" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
  </svg>
);

const IconVan = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7h18l2 5v4H2z" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
  </svg>
);

const IconBike = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6a1 1 0 0 0-1-1H9" /><path d="m12 6 4 4-4 4" /><path d="M5.5 17.5 9 6h6l3 5.5" />
  </svg>
);

const TYPE_ICONS = {
  "Truck": <IconTruck />,
  "Mini-Truck": <IconMiniTruck />,
  "Van": <IconVan />,
  "Bike": <IconBike />
};

const EMPTY_FORM = { vehicleId: "", type: "fuel", date: "", liters: "", pricePerL: "106.5", cost: "", tripId: "", note: "" };

// ── Fuel Expense Form Modal ────────────────────────────────────────────────
function FuelExpenseFormModal({ vehicles, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const setField = (k, v) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      if ((k === "liters" || k === "pricePerL") && updated.type === "fuel") {
        const l = parseFloat(k === "liters" ? v : updated.liters);
        const p = parseFloat(k === "pricePerL" ? v : updated.pricePerL);
        if (!isNaN(l) && !isNaN(p)) updated.cost = (l * p).toFixed(2);
      }
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.vehicleId) errors.vehicleId = "Vehicle is required";
    if (!form.type) errors.type = "Type is required";
    if (!form.date) errors.date = "Date is required";
    if (form.type === "fuel") {
      if (!form.liters || form.liters <= 0) errors.liters = "Valid liters required";
      if (!form.pricePerL || form.pricePerL <= 0) errors.pricePerL = "Valid rate required";
    }
    if (!form.cost || form.cost <= 0) errors.cost = "Valid cost required";
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setModalError(null);
    setIsSaving(true);
    try {
      const vehicle = vehicles.find(v => v.id === form.vehicleId);
      const newExpenseId = `EXP-${Date.now().toString().slice(-4)}`;
      await api.post('/expenses', {
        id: newExpenseId,
        vehicleId: vehicle.id,
        type: form.type,
        date: form.date,
        liters: form.type === "fuel" ? Number(form.liters) : null,
        pricePerL: form.type === "fuel" ? Number(form.pricePerL) : null,
        cost: Number(form.cost),
        tripId: form.tripId || null,
        note: form.note || ""
      });
      onSuccess();
    } catch (err) {
      setModalError("Failed to save expense log. Please try again.");
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
        @keyframes fefEnter {
          from { opacity: 0; transform: scale(0.93) translateY(-20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .fef-modal { animation: fefEnter 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .fef-field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .fef-section-title { font-size: 11px; font-weight: 700; color: var(--accent, #f97316); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .fef-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .fef-err { color: var(--error, #ef4444); font-size: 11px; margin-top: 4px; }
        .fef-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316 0%, #ea6508 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
        .fef-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .fef-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        select option { background-color: var(--card, #1a2332); color: var(--text, #e8edf5); }
      `}</style>
      <div
        className="modal fef-modal brand-accent"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, width: "100%", borderRadius: 18, overflow: "hidden", padding: 0 }}
      >
        <div style={{ background: "linear-gradient(135deg, #f97316 0%, #d45d00 100%)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <FiDroplet size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>Log Expense</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Record fuel, tolls, or other vehicle costs</div>
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

          <div className="fef-section-title">Asset & Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="fef-field">
              <label>Select Vehicle *</label>
              <select value={form.vehicleId} onChange={e => setField("vehicleId", e.target.value)} style={fieldStyle("vehicleId")}>
                <option value="">Choose...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.id})</option>)}
              </select>
              {formErrors.vehicleId && <div className="fef-err">{formErrors.vehicleId}</div>}
            </div>
            <div className="fef-field">
              <label>Expense Type *</label>
              <select value={form.type} onChange={e => setField("type", e.target.value)} style={fieldStyle("type")}>
                <option value="fuel">Fuel Fill-up</option>
                <option value="toll">Toll / Fastag</option>
                <option value="other">General Expense</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="fef-field">
              <label>Log Date *</label>
              <input type="date" value={form.date} onChange={e => setField("date", e.target.value)} style={fieldStyle("date")} />
              {formErrors.date && <div className="fef-err">{formErrors.date}</div>}
            </div>
          </div>

          <div className="fef-section-title">Cost Details</div>
          {form.type === 'fuel' && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div className="fef-field">
                <label>Liters *</label>
                <input type="number" step="0.01" placeholder="Liters filled" value={form.liters} onChange={e => setField("liters", e.target.value)} style={fieldStyle("liters")} />
                {formErrors.liters && <div className="fef-err">{formErrors.liters}</div>}
              </div>
              <div className="fef-field">
                <label>Rate / L (₹) *</label>
                <input type="number" step="0.01" placeholder="Price per Liter" value={form.pricePerL} onChange={e => setField("pricePerL", e.target.value)} style={fieldStyle("pricePerL")} />
                {formErrors.pricePerL && <div className="fef-err">{formErrors.pricePerL}</div>}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div className="fef-field">
              <label>Total Amount (₹) *</label>
              <input type="number" step="0.01" placeholder="Total Cost" value={form.cost} onChange={e => setField("cost", e.target.value)} style={fieldStyle("cost")} />
              {formErrors.cost && <div className="fef-err">{formErrors.cost}</div>}
            </div>
            <div className="fef-field">
              <label>Note / Remarks</label>
              <input placeholder="Location or details..." value={form.note} onChange={e => setField("note", e.target.value)} style={fieldStyle("note")} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button className="fef-btn" style={{ flex: 2 }} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Logging..." : <><FiDroplet size={14} /> Record Expense</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function FuelExpenses({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [vFilter, setVFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [globalError, setGlobalError] = useState(null);
  const [deletingFuel, setDeletingFuel] = useState(null);

  const isManager = user?.role === "Manager";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vRes, eRes] = await Promise.all([api.get('/vehicles'), api.get('/expenses')]);
      setVehicles(vRes.data);
      setLogs(eRes.data);
    } catch (err) { console.error("Error fetching data:", err); }
  };

  const onSaveSuccess = () => {
    setShowModal(false);
    fetchData();
    setSuccessMsg("Expense record added successfully");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteSubmit = async (log) => {
    try {
      await api.delete(`/expenses/${log.id}`);
      setSuccessMsg(`Log deleted successfully`);
      setTimeout(() => setSuccessMsg(""), 3500);
      setDeletingFuel(null);
      fetchData();
    } catch (err) {
      setGlobalError(err.response?.data?.error || "Failed to delete log.");
      setDeletingFuel(null);
    }
  };

  const filtered = logs.filter(l => filter === "All" || l.type === filter.toLowerCase());
  const totalCost = logs.reduce((s, l) => s + Number(l.cost || 0), 0);
  const fuelCost = logs.filter(l => l.type === 'fuel').reduce((s, l) => s + Number(l.cost || 0), 0);
  const tollCost = logs.filter(l => l.type === 'toll').reduce((s, l) => s + Number(l.cost || 0), 0);
  const otherCost = logs.filter(l => !['fuel', 'toll'].includes(l.type)).reduce((s, l) => s + Number(l.cost || 0), 0);

  const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="app-shell">
      <Sidebar user={user} currentPage="fuel" onNavigate={onNavigate} onLogout={onLogout}
        theme={theme} onToggleTheme={onToggleTheme} permissions={permissions} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Fuel &amp; Expenses</div>
            <div className="topbar-sub">Monetary tracking for asset maintenance &amp; fuel</div>
          </div>
          <div className="topbar-right">
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #f97316 0%, #ea6508 100%)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                transition: "all 0.2s",
              }}
            >
              <FiDroplet size={14} /> Log Expense
            </button>
          </div>
        </div>

        <div className="page-body">
          {successMsg && (
            <div className="in-shop-banner" style={{ background: "rgba(34,211,165,0.08)", borderColor: "rgba(34,211,165,0.2)", color: "var(--success)", marginBottom: 16 }}>
              <FiDroplet size={14} /> {successMsg}
            </div>
          )}
          {globalError && (
            <div className="in-shop-banner" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "var(--error)", marginBottom: 16 }}>
              <FiX size={14} /> {globalError}
            </div>
          )}

          <div className="summary-strip" style={{ marginBottom: 20 }}>
            {[
              { icon: <FiCreditCard />, val: money(totalCost), label: "Total Spent" },
              { icon: <FiDroplet />, val: money(fuelCost), label: "Fuel Cost" },
              { icon: <span style={{ fontSize: 18 }}>₹</span>, val: money(tollCost), label: "Toll/Other" },
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
                  <div className="panel-title">Expense History</div>
                  <div className="filter-bar" style={{ marginBottom: 0 }}>
                    {["All", "Fuel", "Toll", "Other"].map(f => (
                      <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}>{f}</button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No expenses found</div>}
                  {filtered.length > 0 && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Vehicle</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'right' }}>Rate/L</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Note</th>
                          {isManager && <th style={{ width: 50 }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(log => (
                          <tr key={log.id}>
                            <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)' }}>{log.date}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                                  {TYPE_ICONS[vehicles.find(v => v.id === log.vehicleId)?.type] || <FiTruck />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{log.vehicleName}</div>
                                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{log.vehicleId}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className={`expense-type-badge ${log.type}`}>{log.type}</span></td>
                            <td style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>
                              {log.type === 'fuel' ? `₹${log.pricePerL}/L` : '—'}
                              {log.liters && <div style={{ fontSize: 9, color: 'var(--muted)' }}>{log.liters}L filled</div>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 800, color: log.type === 'fuel' ? 'var(--accent)' : 'var(--text)' }}>
                                {money(log.cost)}
                              </span>
                            </td>
                            <td style={{ fontSize: 11, color: "var(--muted)", maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.note || "—"}
                            </td>
                            {isManager && (
                              <td>
                                <button className="btn-action" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}
                                  onClick={() => setDeletingFuel(log)}><FiTrash size={14} /></button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Spend Analysis</div></div>
                <div style={{ padding: 20 }}>
                  {[
                    { label: "Fuel Fill-ups", amount: fuelCost, color: "#3b82f6", icon: <FiDroplet size={14} /> },
                    { label: "Tolls & Transit", amount: tollCost, color: "#f59e0b", icon: <span style={{ fontSize: 12, fontWeight: 900 }}>₹</span> },
                    { label: "Others", amount: otherCost, color: "#a855f7", icon: <FiTool size={14} /> }
                  ].map(item => {
                    const pct = totalCost > 0 ? Math.round((item.amount / totalCost) * 100) : 0;
                    return (
                      <div key={item.label} style={{ marginBottom: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ color: item.color }}>{item.icon}</div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>{money(item.amount)}</span>
                        </div>
                        <div className="util-bar-track" style={{ height: 6, borderRadius: 3 }}>
                          <div className="util-bar-fill" style={{ width: `${pct}%`, background: item.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 13, fontWeight: 800 }}>
                    <span>Total Expense</span>
                    <span style={{ color: "var(--accent)" }}>{money(totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "rgba(255,255,255,0.1)" }}>
                <div style={{ padding: 20 }}>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Fleet Efficiency</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 16 }}>Operational cost intelligence</div>

                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <FiDroplet size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase' }}>Avg Fuel Rate</div>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>₹106.40 <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}>/L</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <FuelExpenseFormModal vehicles={vehicles} onSuccess={onSaveSuccess} onClose={() => setShowModal(false)} />}
      {deletingFuel && <DeleteDialog log={deletingFuel} onConfirm={handleDeleteSubmit} onCancel={() => setDeletingFuel(null)} />}
    </div>
  );
}

function DeleteDialog({ log, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal brand-accent fef-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 18, overflow: 'hidden', padding: 0 }}>
        <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", padding: "20px 24px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <FiTrash size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Confirm Deletion</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Financial records cannot be recovered</div>
          </div>
        </div>
        <div style={{ padding: 24, background: "var(--bg-secondary)" }}>
          <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 20, lineHeight: 1.6 }}>
            Are you sure you want to delete the expense record <strong>{log.id}</strong> for <strong>{log.vehicleName}</strong>?
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
