import { useState, useEffect, useMemo } from "react";
import "../styles/global.css";
import { Sidebar } from './Dashboard';
import "../styles/modal.css";
import api from '../api';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RouteTracker from '../Components/RouteTracker';

// ── SVG icons 
const IconTruck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const IconMiniTruck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5h12v10H1z" /><path d="M13 9h5l3 4v2h-8V9z" /><circle cx="5" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>;
const IconVan = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h18l2 5v4H2z" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
const IconBike = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6a1 1 0 0 0-1-1H9" /><path d="m12 6 4 4-4 4" /><path d="M5.5 17.5 9 6h6l3 5.5" /></svg>;

const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconSend = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const IconMapPin = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconFlag = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
const IconUser = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconPackage = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z" /><polyline points="2.32 6.16 12 11 21.68 6.16" /><line x1="12" y1="22.76" x2="12" y2="11" /></svg>;
const IconRupee = () => <span style={{ fontSize: 13, fontWeight: 600 }}>₹</span>;
const IconInfo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
const IconX = ({ size = 14, strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconRoute = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>;

const TYPE_ICONS = {
  "Truck": <IconTruck />,
  "Mini-Truck": <IconMiniTruck />,
  "Van": <IconVan />,
  "Bike": <IconBike />,
};

const EMPTY_FORM = { from: "", to: "", cargo: "", vehicleId: "", driverId: "", totalKM: "" };

// ── Completion Dialog Component ────────────────────────────────────────────
function CompletionDialog({ trip, vehicles, onConfirm, onDownload, onSendBill, onCancel }) {
  const vehicle = vehicles.find(v => v.id === trip.vehicleid || v.id === trip.vehicleId);
  const pricePerKm = Number(vehicle?.price_per_km ?? 0);
  const originalKM = Number(trip.totalkm ?? trip.totalKM ?? 0);

  const [extraKM, setExtraKM] = useState("");
  const [toll, setToll] = useState("");
  const [other, setOther] = useState("");

  const extraVal = Math.max(0, Number(extraKM) || 0);
  const tollVal = Math.max(0, Number(toll) || 0);
  const otherVal = Math.max(0, Number(other) || 0);

  const finalKM = originalKM + extraVal;
  const base = finalKM * pricePerKm;
  const total = base + tollVal + otherVal;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    await onConfirm({
      totalKM: finalKM,
      extraKM: extraVal,
      baseCost: base,
      tollCost: tollVal,
      otherCost: otherVal,
      totalCost: total,
      status: "completed"
    });
    setIsSaving(false);
    setIsSaved(true);
  };

  const handleDownload = () => {
    onDownload(trip, {
      totalKM: finalKM,
      extraKM: extraVal,
      baseCost: base,
      tollCost: tollVal,
      otherCost: otherVal,
      totalCost: total
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal completion-modal brand-accent" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="brand-icon-small">
              <svg viewBox="0 0 44 44" width="24" height="24">
                <rect width="44" height="44" rx="10" fill="#f97316" />
                <g transform="translate(10, 10)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </g>
              </svg>
            </div>
            <span>Complete Trip — {trip.id}</span>
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
        <div className="modal-body">
          {/* Summary Row */}
          <div className="cost-summary-header">
            <div className="cost-summary-item">
              <span className="cost-summary-label">Original KM</span>
              <span className="cost-summary-value">{originalKM > 0 ? `${originalKM} km` : "—"}</span>
            </div>
            <div className="cost-summary-item">
              <span className="cost-summary-label">Rate</span>
              <span className="cost-summary-value">₹{pricePerKm}/km</span>
            </div>
            <div className="cost-summary-item">
              <span className="cost-summary-label">Base Cost</span>
              <span className="cost-summary-value">₹{base.toLocaleString()}</span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="modal-row" style={{ marginTop: 16 }}>
            <div className="modal-field">
              <label>Extra KM Covered</label>
              <input type="number" min="0" step="1" placeholder="e.g. 15"
                value={extraKM} onChange={e => setExtraKM(e.target.value)} />
            </div>
          </div>
          <div className="modal-row" style={{ marginTop: 16 }}>
            <div className="modal-field" style={{ flex: 1 }}>
              <label>Toll Charges (₹)</label>
              <input type="number" min="0" step="1" placeholder="e.g. 250"
                value={toll} onChange={e => setToll(e.target.value)} />
            </div>
            <div className="modal-field" style={{ flex: 1 }}>
              <label>Other Expenses (₹)</label>
              <input type="number" min="0" step="1" placeholder="e.g. 150"
                value={other} onChange={e => setOther(e.target.value)} />
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="cost-breakdown-box">
            <div className="cost-breakdown-row">
              <span>Final Trip Distance</span>
              <span>{finalKM} km</span>
            </div>
            <div className="cost-breakdown-row">
              <span>Base Cost <span className="cost-dim">(KM × Rate)</span></span>
              <span>₹{base.toLocaleString()}</span>
            </div>
            <div className="cost-breakdown-row">
              <span>Toll Charges</span>
              <span>₹{tollVal.toLocaleString()}</span>
            </div>
            <div className="cost-breakdown-row">
              <span>Other Expenses</span>
              <span>₹{otherVal.toLocaleString()}</span>
            </div>
            <div className="cost-breakdown-row total-row">
              <span>Total Trip Cost</span>
              <span className="total-cost-val">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {!isSaved ? (
            <>
              <button className="btn-secondary" onClick={onCancel} disabled={isSaving}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirm} disabled={isSaving} style={{ backgroundColor: "#f97316", borderColor: "#f97316" }}>
                {isSaving ? "Saving..." : <><IconCheck /> Confirm &amp; Complete</>}
              </button>
            </>
          ) : (
            <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 10, padding: "4px 0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#22c55e" }}>Trip completed successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SendBillDialog({ trip, onSend, onCancel }) {
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter an email address");
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg("Please enter customer name");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address");
      return;
    }
    setErrorMsg("");
    setIsSending(true);
    await onSend(trip, email.trim(), customerName.trim());
    setIsSending(false);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal brand-accent" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, borderRadius: 16, overflow: "hidden" }}>
        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--primary-dark, #2563eb) 100%)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}>
            <IconMail />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Send Bill</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{trip.id}</div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "2px solid #ffffff",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: "bold",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            X
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Info banner */}
          <div style={{
            backgroundColor: "var(--surface, #0d1420)",
            border: "1px solid var(--border, rgba(255,255,255,0.07))",
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 10
          }}>
            <div style={{ color: "var(--primary, #3b82f6)", marginTop: 2, flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text, #e8edf5)", marginBottom: 4 }}>Send Trip Bill</div>
              <div style={{ fontSize: 13, color: "var(--muted, #5a6a80)", lineHeight: 1.5 }}>The bill PDF will be emailed to the customer with complete trip details and cost breakdown.</div>
            </div>
          </div>

          {/* Customer Name input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text, #374151)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}>
              Customer Name *
            </label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: errorMsg && !customerName.trim() ? "1px solid var(--error, #ef4444)" : "1px solid var(--border, #d1d5db)",
                borderRadius: 10,
                fontSize: 14,
                backgroundColor: "var(--surface, #ffffff)",
                color: "var(--text, #1f2937)",
                outline: "none",
                transition: "all 0.2s"
              }}
            />
          </div>

          {/* Email input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text, #374151)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}>
              Customer Email Address *
            </label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: errorMsg ? "1px solid var(--error, #ef4444)" : "1px solid var(--border, #d1d5db)",
                borderRadius: 10,
                fontSize: 14,
                backgroundColor: "var(--surface, #ffffff)",
                color: "var(--text, #1f2937)",
                outline: "none",
                transition: "all 0.2s"
              }}
            />
            {errorMsg && (
              <div style={{ color: "var(--error, #ef4444)", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Trip preview card */}
          <div style={{
            backgroundColor: "var(--surface, #0d1420)",
            border: "1px solid var(--border, rgba(255,255,255,0.07))",
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted, #5a6a80)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Trip Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Route</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text, #e8edf5)" }}>{trip.fromlocation} → {trip.tolocation}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Vehicle</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text, #e8edf5)" }}>{trip.vehicleName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Total Cost</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--success, #22d3a5)" }}>₹{Number(trip.totalcost || trip.totalCost || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px 24px",
          display: "flex",
          gap: 12,
          borderTop: "1px solid var(--border, #e5e7eb)"
        }}>
          <button
            onClick={onCancel}
            disabled={isSending}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 10,
              border: "1px solid var(--border, #d1d5db)",
              backgroundColor: "var(--surface, #ffffff)",
              color: "var(--text, #374151)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !email.trim()}
            style={{
              flex: 2,
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: isSending ? "var(--muted, #9ca3af)" : "linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--primary-dark, #2563eb) 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: isSending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
              boxShadow: isSending ? "none" : "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
          >
            {isSending ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="30" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <IconSend /> Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ trip, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal brand-accent" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, borderRadius: 16, overflow: "hidden" }}>
        {/* Header with danger gradient */}
        <div style={{
          background: "linear-gradient(135deg, var(--error, #ef4444) 0%, var(--error-dark, #dc2626) 100%)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}>
            <IconTrash />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Delete Trip</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{trip.id}</div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "2px solid #ffffff",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: "bold",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            X
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Warning banner */}
          <div style={{
            backgroundColor: "var(--surface, #0d1420)",
            border: "1px solid var(--border, rgba(255,255,255,0.07))",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--error, #f43f5e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--error, #f43f5e)", marginBottom: 6 }}>Warning: Permanent Deletion</div>
              <div style={{ fontSize: 13, color: "var(--text, #e8edf5)", lineHeight: 1.6 }}>
                Are you sure you want to permanently delete trip <strong style={{ color: "var(--text, #ffffff)", fontWeight: 700 }}>{trip.id}</strong>?
                This action cannot be undone. All trip data including billing history will be permanently removed.
              </div>
            </div>
          </div>

          {/* Trip info card */}
          <div style={{
            backgroundColor: "var(--surface, #0d1420)",
            border: "1px solid var(--border, rgba(255,255,255,0.07))",
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted, #5a6a80)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Trip to Delete</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Trip ID</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text, #e8edf5)", fontFamily: "monospace" }}>{trip.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Route</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text, #e8edf5)" }}>{trip.fromlocation} → {trip.tolocation}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Date</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text, #e8edf5)" }}>{trip.date}</span>
              </div>
              {(trip.totalcost || trip.totalCost) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--muted, #5a6a80)" }}>Total Cost</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--success, #22d3a5)" }}>₹{Number(trip.totalcost || trip.totalCost || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px 24px",
          display: "flex",
          gap: 12,
          borderTop: "1px solid var(--border, #e5e7eb)"
        }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 10,
              border: "1px solid var(--border, #d1d5db)",
              backgroundColor: "var(--surface, #ffffff)",
              color: "var(--text, #374151)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setIsDeleting(true);
              await onConfirm(trip);
            }}
            disabled={isDeleting}
            style={{
              flex: 2,
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: isDeleting ? "var(--muted, #9ca3af)" : "linear-gradient(135deg, var(--error, #ef4444) 0%, var(--error-dark, #dc2626) 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
              boxShadow: isDeleting ? "none" : "0 4px 12px rgba(239, 68, 68, 0.3)"
            }}
          >
            {isDeleting ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="30" />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <IconTrash /> Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Trip Modal ────────────────────────────────────────────────────────
function CreateTripModal({ vehicles, drivers, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const availableVehicles = vehicles.filter(v => v.status === "available");
  const availableDrivers = drivers.filter(d => d.status === "available");
  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
  const selectedDriver = drivers.find(d => d.id === form.driverId);

  const estimatedCost = useMemo(() => {
    if (!form.totalKM || !selectedVehicle) return null;
    const km = Number(form.totalKM);
    const rate = Number(selectedVehicle.price_per_km ?? 0);
    if (km <= 0 || rate <= 0) return null;
    return { km, rate, cost: km * rate };
  }, [form.totalKM, selectedVehicle]);

  const validationResult = (() => {
    if (!form.vehicleId || !form.driverId || !form.cargo) return null;
    const cargo = Number(form.cargo);
    const v = selectedVehicle; const d = selectedDriver;
    if (!v || !d) return null;
    if (!d.licenseValid) return { pass: false, msg: "Driver license expired — cannot dispatch" };
    if (cargo > v.capacity) return { pass: false, msg: `Cargo ${cargo}kg exceeds ${v.name} capacity of ${v.capacity}kg` };
    return { pass: true, msg: `✓ Check passed — ${cargo}kg < ${v.capacity}kg capacity. Ready to dispatch!` };
  })();

  const handleFieldChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const validateForm = () => {
    const errors = {};
    if (!form.from.trim()) errors.from = "Origin is required";
    if (!form.to.trim()) errors.to = "Destination is required";
    if (!form.cargo || form.cargo <= 0) errors.cargo = "Valid cargo weight is required";
    if (!form.vehicleId) errors.vehicleId = "Please select a vehicle";
    if (!form.driverId) errors.driverId = "Please select a driver";
    return errors;
  };

  const handleDispatch = async () => {
    setModalError(null);
    setFormErrors({});
    if (availableDrivers.length === 0) { setModalError("No driver available. Please add a driver in Driver Profiles."); return; }
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setModalError("Please fill all required fields correctly."); return; }
    if (!validationResult?.pass) { setModalError("Cannot dispatch trip. Please fix validation issues."); return; }
    try {
      setIsDispatching(true);
      const v = selectedVehicle;
      const newTripId = `TR-${Date.now().toString().slice(-4)}`;
      const km = Number(form.totalKM) || null;
      const rate = Number(v.price_per_km) || 0;
      const base = km && rate ? km * rate : null;
      await api.post('/trips', {
        id: newTripId, vehicleId: v.id, driverId: selectedDriver.id,
        fromLocation: form.from, toLocation: form.to,
        cargo: Number(form.cargo), status: "dispatched",
        date: new Date().toISOString(), totalKM: km, baseCost: base,
      });
      onSuccess(newTripId);
    } catch (err) {
      setModalError("Failed to dispatch trip. Please try again.");
    } finally {
      setIsDispatching(false);
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
        @keyframes ctmEnter {
          from { opacity: 0; transform: scale(0.93) translateY(-20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .ctm-modal { animation: ctmEnter 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .ctm-field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .ctm-section-title { font-size: 11px; font-weight: 700; color: var(--accent, #f97316); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .ctm-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .ctm-card { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; border: 1.5px solid var(--border); cursor: pointer; transition: all 0.18s; background: var(--bg-primary); margin-bottom: 6px; }
        .ctm-card:hover { border-color: var(--accent, #f97316); background: var(--bg-secondary); }
        .ctm-card.selected { border-color: var(--accent, #f97316); background: rgba(249,115,22,0.08); }
        .ctm-card.disabled { opacity: 0.45; cursor: not-allowed; }
        .ctm-scroll { max-height: 170px; overflow-y: auto; padding-right: 2px; }
        .ctm-scroll::-webkit-scrollbar { width: 4px; } .ctm-scroll::-webkit-scrollbar-track { background: transparent; } .ctm-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .ctm-validation.pass { background: rgba(34,197,94,0.1); border: 1.5px solid rgba(34,197,94,0.3); color: #22c55e; border-radius: 8px; padding: 10px 14px; font-size: 12px; font-weight: 500; }
        .ctm-validation.fail { background: rgba(239,68,68,0.08); border: 1.5px solid rgba(239,68,68,0.25); color: var(--error, #ef4444); border-radius: 8px; padding: 10px 14px; font-size: 12px; font-weight: 500; }
        .ctm-err { color: var(--error, #ef4444); font-size: 11px; margin-top: 4px; }
        .ctm-dispatch-btn { width: 100%; padding: 13px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316 0%, #ea6508 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
        .ctm-dispatch-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .ctm-dispatch-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <div
        className="modal ctm-modal brand-accent"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560, width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 18, overflow: "hidden", padding: 0 }}
      >
        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(135deg, #f97316 0%, #d45d00 100%)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>Dispatch New Trip</div>
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 }}>Fill in route, cargo, vehicle &amp; driver details</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "2px solid #ffffff",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: "bold",
              transition: "all 0.2s"
            }}
          >
            X
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", background: "var(--bg-secondary)" }}>
          {/* Global error */}
          {modalError && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", color: "var(--error,#ef4444)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {modalError}
            </div>
          )}

          {/* Route */}
          <div style={{ marginBottom: 18 }}>
            <div className="ctm-section-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              Route Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ctm-field">
                <label>From *</label>
                <input placeholder="Origin depot" value={form.from} onChange={e => handleFieldChange("from", e.target.value)} style={fieldStyle("from")} />
                {formErrors.from && <div className="ctm-err">{formErrors.from}</div>}
              </div>
              <div className="ctm-field">
                <label>To *</label>
                <input placeholder="Destination" value={form.to} onChange={e => handleFieldChange("to", e.target.value)} style={fieldStyle("to")} />
                {formErrors.to && <div className="ctm-err">{formErrors.to}</div>}
              </div>
            </div>
          </div>

          {/* Cargo & KM */}
          <div style={{ marginBottom: 18 }}>
            <div className="ctm-section-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
              Cargo &amp; Distance
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ctm-field">
                <label>Cargo Weight (kg) *</label>
                <input type="number" placeholder="e.g. 450" value={form.cargo} onChange={e => handleFieldChange("cargo", e.target.value)} style={fieldStyle("cargo")} />
                {formErrors.cargo && <div className="ctm-err">{formErrors.cargo}</div>}
              </div>
              <div className="ctm-field">
                <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <IconRoute /> Total Trip KM
                </label>
                <input type="number" min="0" placeholder="e.g. 320" value={form.totalKM} onChange={e => handleFieldChange("totalKM", e.target.value)} style={fieldStyle(null)} />
              </div>
            </div>
          </div>

          {/* Cost Estimate */}
          {estimatedCost && (
            <div style={{ background: "rgba(249,115,22,0.08)", border: "1.5px solid rgba(249,115,22,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--accent,#f97316)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Estimated Base Cost</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{estimatedCost.km} km × ₹{estimatedCost.rate}/km</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent,#f97316)" }}>₹{estimatedCost.cost.toLocaleString()}</div>
            </div>
          )}

          {/* Toll banner */}
          <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#ca8a04" }}>
            <IconInfo /> Toll charges and other expenses will be calculated after completing the trip.
          </div>

          {/* Vehicle */}
          <div style={{ marginBottom: 18 }}>
            <div className="ctm-section-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              Select Vehicle (Available Only) *
            </div>
            {formErrors.vehicleId && <div className="ctm-err" style={{ marginBottom: 8 }}>{formErrors.vehicleId}</div>}
            <div className="ctm-scroll">
              {availableVehicles.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", padding: "10px 0" }}>No vehicles available</div>}
              {availableVehicles.map(v => (
                <div key={v.id} className={`ctm-card ${form.vehicleId === v.id ? "selected" : ""}`} onClick={() => handleFieldChange("vehicleId", v.id)}>
                  <span style={{ fontSize: 18, color: form.vehicleId === v.id ? "var(--accent,#f97316)" : "var(--muted)" }}>{TYPE_ICONS[v.type] ?? <IconTruck />}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Max {v.capacity}kg · {v.type} · ₹{Number(v.price_per_km).toLocaleString()}/km</div>
                  </div>
                  {form.vehicleId === v.id && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconCheck />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Driver */}
          <div style={{ marginBottom: 18 }}>
            <div className="ctm-section-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Select Driver (Available Only) *
            </div>
            {formErrors.driverId && <div className="ctm-err" style={{ marginBottom: 8 }}>{formErrors.driverId}</div>}
            <div className="ctm-scroll">
              {availableDrivers.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", padding: "10px 0" }}>No drivers available</div>}
              {availableDrivers.map(d => (
                <div key={d.id} className={`ctm-card ${form.driverId === d.id ? "selected" : ""} ${!d.licenseValid ? "disabled" : ""}`} onClick={() => d.licenseValid && handleFieldChange("driverId", d.id)}>
                  <span style={{ fontSize: 18, color: form.driverId === d.id ? "var(--accent,#f97316)" : "var(--muted)" }}><IconUser /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: d.licenseValid ? "var(--muted)" : "var(--error,#ef4444)", marginTop: 2 }}>
                      {d.licenseValid ? `License valid · Exp ${d.expiry}` : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                          License expired — {d.expiry}
                        </div>
                      )}
                    </div>
                  </div>
                  {form.driverId === d.id && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconCheck />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>


          {/* Validation */}
          {validationResult && (
            <div className={`ctm-validation ${validationResult.pass ? "pass" : "fail"}`} style={{ marginBottom: 8 }}>
              {validationResult.msg}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexShrink: 0, background: "var(--bg-secondary)" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            Cancel
          </button>
          <button className="ctm-dispatch-btn" style={{ flex: 2 }} onClick={handleDispatch} disabled={isDispatching}>
            {isDispatching ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="30" /></svg> Dispatching...</>
            ) : (
              <><IconSend />&nbsp;Dispatch Trip</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TripDispatcher({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("All");
  const [successMsg, setSuccessMsg] = useState("");
  const [globalError, setGlobalError] = useState(null);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [sendingBillTrip, setSendingBillTrip] = useState(null);
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleDeleteSubmit = async (trip) => {
    try {
      await api.delete(`/trips/${trip.id}`);
      setSuccessMsg(`Trip ${trip.id} deleted successfully`);
      setTimeout(() => setSuccessMsg(""), 3500);
      setDeletingTrip(null);
      fetchData();
    } catch (err) {
      setGlobalError(err.response?.data?.error || "Failed to delete trip.");
      setDeletingTrip(null);
    }
  };

  const [companyInfo, setCompanyInfo] = useState(null);
  const isManager = user?.role === "Manager";

  useEffect(() => {
    fetchData();
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      if (user?.companyId) {
        const res = await api.get(`/companies/${user.companyId}`);
        setCompanyInfo(res.data);
      }
    } catch (err) {
      console.error("Error fetching company info:", err);
    }
  };

  const fetchData = async () => {
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/trips')
      ]);
      setVehicles(vRes.data);
      const _drivers = dRes.data.map(d => {
        const _days = Math.ceil((new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24));
        return { ...d, licenseValid: _days > 0 };
      });
      setDrivers(_drivers);
      setTrips(tRes.data);
    } catch (err) { console.error("Error fetching trip dispatcher data:", err); }
  };

  const onDispatchSuccess = (tripId) => {
    setShowCreateForm(false);
    fetchData();
    setSuccessMsg(`Trip ${tripId} dispatched successfully!`);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // Open completion dialog (only managers)
  const openCompleteDialog = (trip) => {
    if (!isManager) {
      setGlobalError("Only managers can complete trips.");
      return;
    }
    setCompletingTrip(trip);
  };

  const generateTripPDF = (trip, customerName, returnBase64 = false) => {
    const doc = new jsPDF();
    const companyName = companyInfo?.name || "TransitOps Systems";
    const companyInd = companyInfo?.industry || "Logistics & Supply Chain";

    // CRITICAL: Use ONLY totalKM for all calculations. extraKM is metadata only.
    // totalKM already includes any extra distance traveled.
    const actualDistance = Number(trip.totalkm || trip.totalKM || 0);
    
    const normalizedCosts = {
      tollCost: customerName?.tollCost ?? Number(trip.tollcost || trip.tollCost || 0),
      otherCost: customerName?.otherCost ?? Number(trip.othercost || trip.otherCost || 0),
      totalCost: customerName?.totalCost ?? Number(trip.totalcost || trip.totalCost || 0),
    };

    const primaryColor = [249, 115, 22]; // #f97316
    const darkColor = [30, 30, 30];
    const lightGray = [245, 245, 245];
    const accentGray = [100, 100, 100];

    // Set default font to ensure compatibility
    doc.setFont("helvetica", "normal");

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER SECTION - Premium Design
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Top gradient bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');

    // Logo - EXACT copy from favicon.svg
    // Orange rounded rectangle background (44x44 with rx=12)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');
    
    // White truck icon - EXACT from SVG with stroke, NO fill
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    
    // Base position after transform translate(10, 10)
    const baseX = 19;
    const baseY = 13;
    const s = 0.5; // scale factor
    
    // Cargo box: <rect x="1" y="3" width="15" height="13" fill="none" stroke="#ffffff" stroke-width="2"/>
    doc.rect(baseX + 1*s, baseY + 3*s, 15*s, 13*s, 'S');
    
    // Cab: <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" fill="none" stroke="#ffffff" stroke-width="2"/>
    doc.line(baseX + 16*s, baseY + 8*s, baseX + 20*s, baseY + 8*s);
    doc.line(baseX + 20*s, baseY + 8*s, baseX + 23*s, baseY + 11*s);
    doc.line(baseX + 23*s, baseY + 11*s, baseX + 23*s, baseY + 16*s);
    doc.line(baseX + 23*s, baseY + 16*s, baseX + 16*s, baseY + 16*s);
    doc.line(baseX + 16*s, baseY + 16*s, baseX + 16*s, baseY + 8*s);
    
    // Wheels: <circle cx="5.5" cy="18.5" r="2.5" fill="none" stroke="#ffffff" stroke-width="2"/>
    doc.circle(baseX + 5.5*s, baseY + 18.5*s, 2.5*s, 'S');
    doc.circle(baseX + 18.5*s, baseY + 18.5*s, 2.5*s, 'S');

    // Company name and tagline
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(String(companyName).toUpperCase(), 38, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 220);
    doc.text(String(companyInd), 38, 25);

    // Invoice label on right
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('INVOICE', 160, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 220);
    doc.text('#' + (trip.id || "N/A"), 160, 25);

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIP INFO SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    let yPos = 45;

    // Trip details in two columns
    doc.setFontSize(9);
    doc.setTextColor(accentGray[0], accentGray[1], accentGray[2]);
    doc.setFont("helvetica", "bold");
    doc.text('TRIP INFORMATION', 14, yPos);
    yPos += 8;

    // Left column
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    doc.text('Trip ID:', 14, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(trip.id || "N/A", 35, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.text('Date:', 14, yPos + 6);
    doc.setFont("helvetica", "bold");
    let formattedDate = trip.date || "N/A";
    if (trip.date && trip.date.includes('T')) {
      const d = new Date(trip.date);
      formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
    }
    doc.text(formattedDate, 35, yPos + 6);

    // Right column
    doc.setFont("helvetica", "normal");
    doc.text('Vehicle:', 110, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(trip.vehicleName || "N/A", 130, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.text('Driver:', 110, yPos + 6);
    doc.setFont("helvetica", "bold");
    doc.text(trip.driverName || "N/A", 130, yPos + 6);

    yPos += 16;

    // Customer name if provided
    if (typeof customerName === 'string' && customerName.trim()) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(14, yPos - 3, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('BILL TO: ' + customerName.toUpperCase(), 18, yPos + 2);
      yPos += 12;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROUTE SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, yPos - 3, 182, 12, 'F');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text('ROUTE DETAILS', 18, yPos + 2);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('FROM: ' + (trip.fromlocation || trip.fromLocation || "N/A"), 18, yPos + 7);
    doc.text('TO: ' + (trip.tolocation || trip.toLocation || "N/A"), 110, yPos + 7);
    
    yPos += 18;

    // ═══════════════════════════════════════════════════════════════════════════
    // CHARGES TABLE - Enhanced Design with proper price formatting
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Format prices properly to avoid encoding issues
    const baseCostFormatted = 'Rs. ' + Number(trip.basecost || trip.baseCost || 0).toLocaleString('en-IN');
    const tollCostFormatted = 'Rs. ' + normalizedCosts.tollCost.toLocaleString('en-IN');
    const otherCostFormatted = 'Rs. ' + normalizedCosts.otherCost.toLocaleString('en-IN');
    const totalCostFormatted = 'Rs. ' + normalizedCosts.totalCost.toLocaleString('en-IN');
    
    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Details', 'Amount (INR)']],
      body: [
        ['Base Transport Charge', actualDistance + ' km actual distance', baseCostFormatted],
        ['Toll Charges', 'Road & highway tolls', tollCostFormatted],
        ['Other Expenses', 'Miscellaneous operational costs', otherCostFormatted],
      ],
      foot: [['', 'TOTAL BILLABLE AMOUNT', totalCostFormatted]],
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left',
        cellPadding: 5,
        font: 'helvetica'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: darkColor,
        font: 'helvetica'
      },
      footStyles: { 
        fillColor: [44, 62, 80], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 11,
        cellPadding: 5,
        font: 'helvetica'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'left', cellWidth: 60 },
        2: { halign: 'right', cellWidth: 50 }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc).lastAutoTable.finalY + 12;

    // ═══════════════════════════════════════════════════════════════════════════
    // SUMMARY BOX
    // ═══════════════════════════════════════════════════════════════════════════
    
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(14, yPos, 182, 20, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('TRIP SUMMARY', 18, yPos + 5);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(accentGray[0], accentGray[1], accentGray[2]);
    doc.text('Total Distance: ' + actualDistance + ' km', 18, yPos + 11);
    doc.text('Base Rate: ' + baseCostFormatted + ' for ' + actualDistance + ' km', 18, yPos + 16);

    yPos += 28;

    // ═══════════════════════════════════════════════════════════════════════════
    // FOOTER SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer-generated invoice and does not require a physical signature.", 14, yPos);
    doc.text('Registered Office: ' + companyName + ', Industrial Estate, ' + companyInd + ' Division', 14, yPos + 5);
    
    // Bottom branding
    doc.setFontSize(7);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Powered by TransitOps — Intelligent Logistics Solutions", 14, yPos + 12);
    
    // Page number
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");
    doc.text('Generated on ' + new Date().toLocaleDateString('en-GB') + ' | Page 1 of 1', 160, yPos + 12);

    if (returnBase64) {
      return doc.output('datauristring').split(',')[1];
    }
    doc.save('Bill_' + trip.id + '.pdf');
  };

  const handleSendBillSubmit = async (trip, email, customerName) => {
    try {
      const pdfBase64 = generateTripPDF(trip, customerName, true);
      await api.post(`/trips/${trip.id}/email-bill`, { email, customerName, tripData: trip, pdfBase64 });
      setSuccessMsg(`Bill sent successfully to ${email}`);
      setTimeout(() => setSuccessMsg(""), 3500);
      setSendingBillTrip(null);
    } catch (err) {
      throw err;
    }
  };

  const handleCompleteConfirm = async (costData) => {
    if (!completingTrip) return;
    try {
      const trip = completingTrip;
      const response = await api.put(`/trips/${trip.id}`, costData);

      // Success - refresh data and keep dialog open for download
      setSuccessMsg(`Trip ${trip.id} completed successfully!`);
      setTimeout(() => setSuccessMsg(""), 3500);

      // Refresh the trips list
      await fetchData();

      // Close dialog shortly after — no more action buttons to interact with
      setTimeout(() => {
        if (completingTrip?.id === trip.id) {
          setCompletingTrip(null);
        }
      }, 1500);
    } catch (err) {
      console.error("Error completing trip:", err);
      setGlobalError(err.response?.data?.error || "Failed to complete trip");
      setCompletingTrip(null);
    }
  };

  const handleCancel = async (tripId) => {
    try {
      const trip = trips.find(t => t.id === tripId);
      await api.put(`/trips/${tripId}`, { status: "cancelled" });
      fetchData();
    } catch (err) {
      console.error("Error cancelling trip:", err);
    }
  };

  const filtered = trips.filter(t => filter === "All" || t.status === filter.toLowerCase());
  const counts = {
    all: trips.length,
    draft: trips.filter(t => t.status === "draft").length,
    dispatched: trips.filter(t => t.status === "dispatched").length,
    completed: trips.filter(t => t.status === "completed").length,
    cancelled: trips.filter(t => t.status === "cancelled").length,
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} currentPage="trips" onNavigate={onNavigate} onLogout={onLogout}
        theme={theme} onToggleTheme={onToggleTheme} permissions={permissions} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Trip Dispatcher</div>
            <div className="topbar-sub">Create &amp; manage trips — Point A to Point B</div>
          </div>
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="topbar-pill"><div className="status-dot" />{counts.dispatched} Active Trips</div>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #f97316 0%, #ea6508 100%)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                transition: "all 0.2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New Dispatch
            </button>
          </div>
        </div>

        <div className="page-body">
          {successMsg && (
            <div className="trip-status-bar success" style={{ marginBottom: 16 }}>
              <IconCheck /> {successMsg}
            </div>
          )}
          {globalError && (
            <div className="trip-status-bar" style={{
              backgroundColor: 'var(--error-bg, #fee)', color: 'var(--error-text, #c00)',
              padding: '12px', borderRadius: '6px', marginBottom: 16, fontSize: '13px',
              border: '1px solid var(--error-border, #fcc)'
            }}>
              {globalError}
            </div>
          )}

          {/* Summary Strip */}
          <div className="summary-strip" style={{ gridTemplateColumns: "repeat(5,1fr)", marginBottom: 20 }}>
            {[
              { label: "Total Trips", val: counts.all, icon: <IconSearch /> },
              { label: "Draft", val: counts.draft, icon: <IconSearch /> },
              { label: "Dispatched", val: counts.dispatched, icon: <IconTruck /> },
              { label: "Completed", val: counts.completed, icon: <IconCheck /> },
              { label: "Cancelled", val: counts.cancelled, icon: <IconFlag /> },
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

          <div>
            {/* ── Trip List (full width) ── */}
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">All Trips</div>
                </div>
                <div className="filter-bar">
                  {["All", "Draft", "Dispatched", "Completed", "Cancelled"].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`}
                      onClick={() => setFilter(f)}>{f}</button>
                  ))}
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontSize: 13 }}>No trips found</div>
                  )}
                  {filtered.map(trip => {
                    const tripBase = Number(trip.basecost ?? trip.baseCost ?? 0);
                    const tripTotal = Number(trip.totalcost ?? trip.totalCost ?? 0);
                    const tripKM = Number(trip.totalkm ?? trip.totalKM ?? 0);
                    return (
                      <div className="trip-card" key={trip.id}>
                        <div className="trip-card-header">
                          <span className="trip-card-id">{trip.id} · {
                            trip.date.includes('T')
                              ? `${new Date(trip.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                timeZone: 'Asia/Kolkata'
                              })} ${new Date(trip.date).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Asia/Kolkata'
                              })}`
                              : `${new Date(trip.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                timeZone: 'Asia/Kolkata'
                              })} ${new Date().toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Asia/Kolkata'
                              })}`
                          }</span>
                          <span className={`lifecycle-badge ${trip.status}`}>{trip.status}</span>
                        </div>
                        <div className="trip-card-route">
                          <span className="trip-point"><IconMapPin style={{ verticalAlign: 'middle', marginRight: 2 }} /> {trip.fromlocation}</span>
                          <div className="trip-arrow"><div className="trip-arrow-line" /></div>
                          <span className="trip-point"><IconFlag style={{ verticalAlign: 'middle', marginRight: 2 }} /> {trip.tolocation}</span>
                        </div>
                        <div className="trip-card-meta">
                          <span className="trip-meta-item">
                            {TYPE_ICONS[vehicles.find(v => v.id === (trip.vehicleid || trip.vehicleId))?.type] ?? <IconTruck />}
                            &nbsp;{trip.vehicleName}
                          </span>
                          <span className="trip-meta-item"><IconUser /> &nbsp;{trip.driverName}</span>
                          <span className="trip-meta-item"><IconPackage /> &nbsp;{trip.cargo} kg</span>
                          {tripKM > 0 && (
                            <span className="trip-meta-item"><IconRoute /> &nbsp;{tripKM} km</span>
                          )}
                        </div>

                        {/* Cost display for completed trips */}
                        {trip.status === "completed" && tripTotal > 0 && (
                          <div className="trip-cost-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div className="trip-cost-info">
                              <span className="trip-cost-label"><IconRupee /> Final Cost</span>
                              <span className="trip-cost-total">₹{tripTotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {isManager && (
                                <button className="btn-secondary" style={{
                                  padding: "6px 12px",
                                  fontSize: 11,
                                  background: "var(--surface, #ffffff)",
                                  color: "var(--error, #c00)",
                                  border: "1px solid var(--border, #e5e7eb)"
                                }}
                                  onClick={() => setDeletingTrip(trip)}>
                                  <IconTrash /> Delete
                                </button>
                              )}
                              <button className="btn-secondary" style={{
                                padding: "6px 12px",
                                fontSize: 11,
                                background: "var(--surface, #ffffff)",
                                color: "var(--text, #1f2937)",
                                border: "1px solid var(--border, #e5e7eb)"
                              }}
                                onClick={() => setSendingBillTrip(trip)}>
                                <IconMail /> Send Bill
                              </button>
                              <button className="btn-secondary" style={{
                                padding: "6px 12px",
                                fontSize: 11,
                                background: "var(--surface, #ffffff)",
                                color: "var(--text, #1f2937)",
                                border: "1px solid var(--border, #e5e7eb)"
                              }}
                                onClick={() => generateTripPDF(trip)}>
                                <IconDownload /> Download Bill
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Cost estimate for dispatched trips */}
                        {trip.status === "dispatched" && tripBase > 0 && (
                          <div className="trip-cost-summary estimated">
                            <span className="trip-cost-label"><IconRupee /> Est. Base</span>
                            <span className="trip-cost-estimate">₹{tripBase.toLocaleString()}</span>
                          </div>
                        )}

                        {(trip.status === "dispatched" || trip.status === "draft") && (
                          <div className="trip-card-actions">
                            {trip.status === "dispatched" && (
                              <>
                                <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 11 }}
                                  onClick={() => openCompleteDialog(trip)}>
                                  <IconCheck /> Mark Complete
                                </button>
                                <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 11, backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" }}
                                  onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}>
                                  <IconRoute /> {expandedTripId === trip.id ? 'Hide' : 'Track'}
                                </button>
                              </>
                            )}
                            <button className="btn-danger" onClick={() => handleCancel(trip.id)}>
                              <IconX /> Cancel
                            </button>
                          </div>
                        )}

                        {/* Delete button for cancelled trips */}
                        {trip.status === "cancelled" && (
                          <div className="trip-card-actions">
                            <button
                              className="btn-danger"
                              onClick={() => setDeletingTrip(trip)}
                              style={{
                                backgroundColor: "#ef4444",
                                borderColor: "#dc2626",
                                color: "#ffffff",
                                padding: "12px 16px",
                                fontSize: 13,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flex: 1,
                                justifyContent: 'center',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#dc2626";
                                e.target.style.boxShadow = "0 4px 8px rgba(220, 38, 38, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#ef4444";
                                e.target.style.boxShadow = "0 2px 4px rgba(239, 68, 68, 0.3)";
                              }}
                            >
                              <IconTrash size={18} /> Delete Trip
                            </button>
                          </div>
                        )}

                        {/* Route Tracking Display */}
                        {trip.status === "dispatched" && expandedTripId === trip.id && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                            <RouteTracker
                              source={trip.fromlocation}
                              destination={trip.tolocation}
                              tripStartTime={trip.date ? new Date(trip.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM'}
                              averageSpeed={45}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Trip Modal ── */}
      {showCreateForm && (
        <CreateTripModal
          vehicles={vehicles}
          drivers={drivers}
          onSuccess={onDispatchSuccess}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* ── Completion Dialog ── */}
      {completingTrip && (
        <CompletionDialog
          trip={completingTrip}
          vehicles={vehicles}
          onConfirm={handleCompleteConfirm}
          onDownload={generateTripPDF}
          onSendBill={(t) => { setCompletingTrip(null); setSendingBillTrip(t); }}
          onCancel={() => {
            setCompletingTrip(null);
            setSuccessMsg("");
          }}
        />
      )}

      {sendingBillTrip && (
        <SendBillDialog
          trip={sendingBillTrip}
          onSend={handleSendBillSubmit}
          onCancel={() => setSendingBillTrip(null)}
        />
      )}

      {deletingTrip && (
        <DeleteDialog
          trip={deletingTrip}
          onConfirm={handleDeleteSubmit}
          onCancel={() => setDeletingTrip(null)}
        />
      )}
    </div>
  );
}