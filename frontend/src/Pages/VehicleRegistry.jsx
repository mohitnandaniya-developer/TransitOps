import { useState, useEffect } from "react";
import "../styles/global.css";
import "../styles/modal.css";
import { Sidebar } from './Dashboard';
import api from '../api';

// ── Constants ──────────────────────────────────────────────────────────────
const REGIONS = ["North", "South", "East", "West", "Central"];
const TYPES = ["Truck", "Mini-Truck", "Van", "Bike"];

const DEFAULT_PRICES = { Truck: 65, "Mini-Truck": 45, Van: 30, Bike: 12 };

const EMPTY_FORM = {
  name: "", type: "Truck", plate: "", capacity: "",
  odometer: "", region: "North", price_per_km: DEFAULT_PRICES["Truck"]
};

// ── SVG Icons (no emoji) ────────────────────────────────────────────────────
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
const IconSearch = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconFleet = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const IconAvail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const IconOnTrip = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconOOS = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>;
const IconPrice = () => <span style={{ fontSize: 18, fontWeight: 600 }}>₹</span>;

const TYPE_ICONS = {
  "Truck": <IconTruck />,
  "Mini-Truck": <IconMiniTruck />,
  "Van": <IconVan />,
  "Bike": <IconBike />,
};

function DeleteDialog({ vehicle, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal brand-accent" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="brand-icon-small" style={{ backgroundColor: "#ef4444", display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: 'white' }}>
              <IconTrash />
            </div>
            <span>Delete Vehicle — {vehicle.id}</span>
          </div>
          <button 
            className="modal-close" 
            onClick={onCancel} 
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: '2px solid #ffffff', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              padding: 0,
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            X
          </button>
        </div>
        <div className="modal-body" style={{ padding: '20px' }}>
          <p style={{ fontSize: 13, color: "var(--text, #374151)", marginBottom: 16, lineHeight: 1.5 }}>
            Are you sure you want to permanently delete vehicle <strong>{vehicle.name}</strong> ({vehicle.id})?<br /><br />
            <span style={{ color: "var(--error, #ef4444)", fontWeight: 600 }}>WARNING: This will permanently remove all historical references to this asset.</span>
          </p>
        </div>
        <div className="modal-footer" style={{ display: "flex", gap: 12, padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn-secondary" onClick={onCancel} disabled={isDeleting} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={async () => {
            setIsDeleting(true);
            await onConfirm(vehicle);
          }} disabled={isDeleting} style={{ flex: 1, backgroundColor: "#ef4444", borderColor: "#ef4444", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isDeleting ? "Deleting..." : <><IconTrash /> Delete Final</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vehicle Form Modal ───────────────────────────────────────────────────────
function VehicleFormModal({ vehicle, isManager, onSuccess, onClose }) {
  const [form, setForm] = useState(vehicle || EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTypeChange = (t) => {
    setForm(f => ({
      ...f,
      type: t,
      price_per_km: isManager ? (DEFAULT_PRICES[t] ?? 0) : f.price_per_km
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Vehicle name is required';
    if (!form.plate.trim()) errors.plate = 'License plate is required';
    if (!form.capacity || form.capacity <= 0) errors.capacity = 'Valid capacity is required';
    if (form.odometer === "" || form.odometer < 0) errors.odometer = 'Valid odometer reading is required';
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        odometer: Number(form.odometer),
        price_per_km: isManager ? Number(form.price_per_km) : undefined,
      };
      if (vehicle?.id) {
        await api.put(`/vehicles/${vehicle.id}`, payload);
      } else {
        const tempId = `VH-${Date.now().toString().slice(-4)}`;
        await api.post('/vehicles', { ...payload, id: tempId, status: "available", retired: false });
      }
      onSuccess();
    } catch (err) {
      setModalError("Failed to save vehicle. Please try again.");
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
        @keyframes vfmEnter {
          from { opacity: 0; transform: scale(0.93) translateY(-20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .vfm-modal { animation: vfmEnter 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .vfm-field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .vfm-section-title { font-size: 11px; font-weight: 700; color: var(--accent, #f97316); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .vfm-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .vfm-err { color: var(--error, #ef4444); font-size: 11px; margin-top: 4px; }
        .vfm-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316 0%, #ea6508 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
        .vfm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .vfm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        select option { background-color: var(--card, #1a2332); color: var(--text, #e8edf5); }
      `}</style>
      <div
        className="modal vfm-modal brand-accent"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, width: "100%", borderRadius: 18, overflow: "hidden", padding: 0 }}
      >
        <div style={{ background: "linear-gradient(135deg, #f97316 0%, #d45d00 100%)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Update fleet inventory details</div>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {modalError}
            </div>
          )}

          <div className="vfm-section-title">Identity &amp; Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="vfm-field">
              <label>Vehicle Name *</label>
              <input placeholder="e.g. Fleet-Truck-01" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={fieldStyle("name")} />
              {formErrors.name && <div className="vfm-err">{formErrors.name}</div>}
            </div>
            <div className="vfm-field">
              <label>Type</label>
              <select value={form.type} onChange={e => handleTypeChange(e.target.value)} style={fieldStyle("type")}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="vfm-section-title">Compliance &amp; Region</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="vfm-field">
              <label>License Plate *</label>
              <input placeholder="e.g. GJ-01-AB-1234" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} style={fieldStyle("plate")} />
              {formErrors.plate && <div className="vfm-err">{formErrors.plate}</div>}
            </div>
            <div className="vfm-field">
              <label>Region</label>
              <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={fieldStyle("region")}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="vfm-section-title">Specifications</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div className="vfm-field">
              <label>Cap (kg) *</label>
              <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} style={fieldStyle("capacity")} />
              {formErrors.capacity && <div className="vfm-err">{formErrors.capacity}</div>}
            </div>
            <div className="vfm-field">
              <label>Odo (km) *</label>
              <input type="number" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} style={fieldStyle("odometer")} />
              {formErrors.odometer && <div className="vfm-err">{formErrors.odometer}</div>}
            </div>
          </div>

          {isManager && (
            <div className="vfm-section-title">Pricing</div>
          )}
          <div className="vfm-field" style={{ marginBottom: 24, display: isManager ? "block" : "none" }}>
            <label>Rate per KM (₹)</label>
            <input type="number" step="0.5" value={form.price_per_km} onChange={e => setForm(f => ({ ...f, price_per_km: e.target.value }))} style={fieldStyle("price_per_km")} />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button className="vfm-btn" style={{ flex: 2 }} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Save Vehicle</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function VehicleRegistry({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [updatedOdometer, setUpdatedOdometer] = useState(null);

  const isManager = user?.role === "Manager";

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      const newVehicles = res.data;
      if (vehicles.length > 0) {
        const updatedVehicles = newVehicles.map(newVehicle => {
          const oldVehicle = vehicles.find(v => v.id === newVehicle.id);
          if (oldVehicle && oldVehicle.odometer !== newVehicle.odometer) {
            setUpdatedOdometer(newVehicle.id);
            setTimeout(() => setUpdatedOdometer(null), 3000);
          }
          return newVehicle;
        });
        setVehicles(updatedVehicles);
      } else {
        setVehicles(newVehicles);
      }
    } catch (err) { console.error("Error fetching vehicles:", err); }
  };

  const onSaveSuccess = () => {
    setShowModal(false);
    setEditTarget(null);
    fetchVehicles();
  };

  const filtered = vehicles.filter(v => {
    const matchType = typeFilter === "All" || v.type === typeFilter;
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.plate && v.plate.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

  const counts = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    onTrip: vehicles.filter(v => v.status === "on-trip").length,
    outOfService: vehicles.filter(v => v.status === "out-of-service").length,
  };

  const handleDeleteSubmit = async (vehicle) => {
    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      fetchVehicles();
      setDeletingVehicle(null);
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setDeletingVehicle(null);
    }
  };

  const toggleRetired = async (v) => {
    try {
      await api.put(`/vehicles/${v.id}`, {
        ...v,
        retired: !v.retired,
        status: !v.retired ? "out-of-service" : "available"
      });
      fetchVehicles();
    } catch (err) { console.error("Error toggling retired:", err); }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} currentPage="vehicles" onNavigate={onNavigate} onLogout={onLogout}
        theme={theme} onToggleTheme={onToggleTheme} permissions={permissions} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Vehicle Registry</div>
            <div className="topbar-sub">Manage physical fleet assets — CRUD operations</div>
          </div>
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="topbar-pill"><div className="status-dot" />{counts.total} Vehicles Total</div>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Vehicle
            </button>
          </div>
        </div>

        <div className="page-body">
          {/* Summary Strip */}
          <div className="summary-strip" style={{ marginBottom: 20 }}>
            {[
              { icon: <IconFleet />, val: counts.total, label: "Total Fleet" },
              { icon: <IconAvail />, val: counts.available, label: "Available" },
              { icon: <IconOnTrip />, val: counts.onTrip, label: "On Trip" },
              { icon: <IconOOS />, val: counts.outOfService, label: "Out of Service" },
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
              <div className="panel-title">All Vehicles</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="filter-search">
                  <span style={{ color: "var(--muted)", fontSize: 12 }}><IconSearch /></span>
                  <input placeholder="Search name or plate..." value={search}
                    onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="filter-bar">
              {["All", ...TYPES].map(t => (
                <button key={t} className={`filter-btn ${typeFilter === t ? "active" : ""}`}
                  onClick={() => setTypeFilter(t)}>{t}</button>
              ))}
              <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />
              {["All", "available", "on-trip", "out-of-service"].map(s => (
                <button key={s} className={`filter-btn ${statusFilter === s ? "active" : ""}`}
                  onClick={() => setStatus(s)}>
                  {s === "All" ? "All Status" : s === "out-of-service" ? "Out of Service" : s.replace("-", " ")}
                </button>
              ))}
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th><th>Name &amp; Type</th><th>License Plate</th>
                  <th>Capacity</th><th>Odometer</th><th>Region</th>
                  <th>Rate / KM</th><th>Status</th><th>Out of Service</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} style={{ opacity: v.retired ? 0.5 : 1 }}>
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{v.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{TYPE_ICONS[v.type] ?? <IconTruck />}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{v.type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{v.plate}</td>
                    <td>{Number(v.capacity).toLocaleString()} kg</td>
                    <td style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      backgroundColor: updatedOdometer === v.id ? "var(--success-bg-light, #f0fdf4)" : undefined,
                      color: updatedOdometer === v.id ? "var(--success, #16a34a)" : undefined,
                      fontWeight: updatedOdometer === v.id ? 600 : undefined,
                      transition: "all 0.3s ease"
                    }}>
                      {Number(v.odometer).toLocaleString()} km
                      {updatedOdometer === v.id && (
                        <span style={{ marginLeft: 4, fontSize: 10 }}>✓ Updated</span>
                      )}
                    </td>
                    <td>{v.region}</td>
                    <td>
                      <span className="price-badge">
                        <IconPrice />
                        {Number(v.price_per_km).toLocaleString()}/km
                      </span>
                    </td>
                    <td><span className={`status-pill ${v.status}`}>{v.status === "out-of-service" ? "Out of Service" : v.status.replace("-", " ")}</span></td>
                    <td>
                      <div className="toggle-wrapper">
                        <label className="toggle">
                          <input type="checkbox" checked={v.retired} onChange={() => toggleRetired(v)} title="Toggle Out of Service" />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="btn-action btn-action-edit" onClick={() => { setEditTarget(v); setShowModal(true); }} title="Edit">
                          <IconEdit />
                        </button>
                        {isManager && (
                          <button className="btn-action btn-action-danger" onClick={() => setDeletingVehicle(v)} title="Delete">
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <VehicleFormModal
          vehicle={editTarget}
          isManager={isManager}
          onSuccess={onSaveSuccess}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}

      {deletingVehicle && (
        <DeleteDialog
          vehicle={deletingVehicle}
          onConfirm={handleDeleteSubmit}
          onCancel={() => setDeletingVehicle(null)}
        />
      )}
    </div>
  );
}