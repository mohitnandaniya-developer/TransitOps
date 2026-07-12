import { useState, useEffect } from "react";
import "../Styles/global.css";
import { FiSun, FiMoon, FiTruck, FiMail, FiLock, FiAlertTriangle, FiShield, FiUserPlus, FiX, FiBriefcase, FiHash } from "react-icons/fi";
import ForgotPwd from "./ForgotPwd";
import PasswordInput from "../Components/PasswordInput";

const ROLES = ["Manager", "Dispatcher", "Safety", "Analyst"];

const FEATURES = [
  "Real-time Tracking",
  "Driver Compliance",
  "Smart Dispatch",
  "Fuel Analytics",
  "Maintenance Logs",
  "Financial Reports",
];

const FIELD_LABEL = { fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" };

export default function LoginPage({ onLogin, setPage }) {
  const [role, setRole] = useState("Manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Register Modal State 
  const [showRegister, setShowRegister] = useState(false);
  const [regRole, setRegRole] = useState("Manager");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regCompanyId, setRegCompanyId] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // ── Company Registration Modal State 
  const [showCompany, setShowCompany] = useState(false);
  const [compName, setCompName] = useState("");
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState("");
  const [compResult, setCompResult] = useState(null); // { id, name }

  const [showForgot, setShowForgot] = useState(false);

  // ── Theme 
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("transitops-theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("transitops-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("transitops-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleRoleChange = (r) => { setRole(r); setError(""); setEmail(""); setPassword(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin && onLogin({ role: data.role, email: data.email, id: data.id, companyId: data.companyId || 'demo' });
      } else {
        setError(data.error || "Invalid credentials.");
        if (data.actualRole) setRole(data.actualRole);
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ── Register 
  const openRegister = () => {
    setRegError(""); setRegSuccess(""); setRegEmail(""); setRegPassword("");
    setRegConfirm(""); setRegRole("Manager"); setRegCompanyId("");
    setShowRegister(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(""); setRegSuccess("");
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    if (regPassword.length < 4) { setRegError("Password must be at least 4 characters."); return; }
    if (!regCompanyId.trim()) { setRegError("Company ID is required."); return; }
    setRegLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword, role: regRole, companyId: regCompanyId.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegSuccess(`Account created! You can now sign in as ${data.role}.`);
        setTimeout(() => { setShowRegister(false); setRole(regRole); setEmail(regEmail); }, 1800);
      } else {
        setRegError(data.error || "Registration failed.");
      }
    } catch {
      setRegError("Failed to connect to server.");
    } finally {
      setRegLoading(false);
    }
  };

  // ── Company Registration / Recovery 
  const [compMode, setCompMode] = useState("register"); // 'register' or 'recover'

  const openCompany = (mode = "register") => {
    setCompMode(mode);
    setCompName(""); setCompError(""); setCompResult(null);
    setShowCompany(true);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setCompError(""); setCompResult(null);
    if (!compName.trim()) { setCompError("Company name is required."); return; }
    setCompLoading(true);
    try {
      const endpoint = compMode === "register" ? "/api/companies" : "/api/companies/recover";
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: compName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompResult(data);
      } else {
        setCompError(data.error || "Failed to register company.");
      }
    } catch {
      setCompError("Failed to connect to server.");
    } finally {
      setCompLoading(false);
    }
  };

  if (showForgot) {
    return (
      <>
        <button className="login-theme-btn" onClick={() => setIsDark(!isDark)} title="Toggle theme" style={{ zIndex: 100 }}>
          {isDark ? <><FiSun size={14} /> Light Mode</> : <><FiMoon size={14} /> Dark Mode</>}
        </button>
        <ForgotPwd onBack={() => setShowForgot(false)} />
      </>
    );
  }

  return (
    <div className="login-root">
      <div className="grid-bg" />
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      <button className="login-theme-btn" onClick={() => setIsDark(!isDark)} title="Toggle theme">
        {isDark ? <><FiSun size={14} /> Light Mode</> : <><FiMoon size={14} /> Dark Mode</>}
      </button>

      {/* ── Left Panel ── */}
      <div className="left-panel fade-in">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setPage?.('login')}>
          <div className="brand-icon"><FiTruck size={28} /></div>
          <div className="brand-name">Transit<span>Ops</span></div>
        </div>
        <div className="left-center">
          <div className="hero-tag"><div className="dot" />Fleet Operations System</div>
          <h1 className="hero-title">Drive Your<br />Fleet <span className="highlight">Smarter.</span></h1>
          <p className="hero-sub">
            Centralized logistics hub for real-time vehicle tracking,
            driver compliance, dispatch management, and financial reporting.
            Replace manual logbooks with a rule-based digital hub.
          </p>
          <div className="feature-pills">
            {FEATURES.map((f) => (<div className="pill" key={f}><div className="pill-dot" />{f}</div>))}
          </div>
          <div className="stats-row">
            <div className="stat"><div className="stat-val">99<span>%</span></div><div className="stat-label">Uptime</div></div>
            <div className="stat"><div className="stat-val">4<span>x</span></div><div className="stat-label">Faster Dispatch</div></div>
            <div className="stat"><div className="stat-val">0</div><div className="stat-label">Logbooks</div></div>
          </div>
        </div>
        <div className="left-footer">
          <div className="status-dot" />
          All systems operational &nbsp;·&nbsp; v2.0.0 &nbsp;·&nbsp; TransitOps © 2026
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="right-panel fade-in">
        <div className="form-header">
          <div className="form-title">Welcome back</div>
          <div className="form-sub">Sign in to your role-based workspace.<br />Select your role to continue.</div>
        </div>

        <div className="role-selector">
          {ROLES.map((r) => (
            <button key={r} className={`role-btn ${role === r ? "active" : ""}`} onClick={() => handleRoleChange(r)}>{r}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email Address</label>
            <div className="input-wrap">
              <span className="input-icon"><FiMail size={14} /></span>
              <input type="email" placeholder={`${role.toLowerCase()}@company.com`}
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="forgot">
            <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>Forgot Password?</a>
          </div>
          {error && <div className="error-msg"><FiAlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {error}</div>}
          <button type="submit" className={`submit-btn ${loading ? "loading" : ""}`}>
            {loading ? <><span className="spinner" />Authenticating...</> : `Sign in as ${role}`}
          </button>
        </form>

        <div className="divider">or</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>New user? </span>
            <button onClick={openRegister}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Register with Company ID
            </button>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Lost your ID? </span>
            <button onClick={() => openCompany('recover')}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Recover Company ID
            </button>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Starting fresh? </span>
            <button onClick={() => openCompany('register')}
              style={{ background: "none", border: "none", color: "var(--success)", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Register New Company
            </button>
          </div>
        </div>

        <div className="security-note">
          <FiShield size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> &nbsp; Secured with Role-Based Access Control (RBAC)
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Register User Modal
      ══════════════════════════════════════════════════════ */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, width: "100%" }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiUserPlus size={16} /> Create Account
              </div>
              <button type="button" className="modal-close" onClick={() => setShowRegister(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRegister}>
                {/* Role */}
                <div className="modal-field" style={{ marginBottom: 14 }}>
                  <label style={FIELD_LABEL}>Role</label>
                  <select value={regRole} onChange={e => setRegRole(e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Company ID */}
                <div className="modal-field" style={{ marginBottom: 14 }}>
                  <label style={FIELD_LABEL}>Company ID</label>
                  <div className="input-wrap" style={{ marginTop: 6 }}>
                    <span className="input-icon"><FiHash size={14} /></span>
                    <input type="text" placeholder="e.g. CO-AB1234" value={regCompanyId}
                      onChange={e => setRegCompanyId(e.target.value)} required />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Ask your company admin for the Company ID.
                  </div>
                </div>

                {/* Email */}
                <div className="modal-field" style={{ marginBottom: 14 }}>
                  <label style={FIELD_LABEL}>Email Address</label>
                  <div className="input-wrap" style={{ marginTop: 6 }}>
                    <span className="input-icon"><FiMail size={14} /></span>
                    <input type="email" placeholder="you@company.com" value={regEmail}
                      onChange={e => setRegEmail(e.target.value)} required />
                  </div>
                </div>

                {/* Password */}
                <div className="modal-field" style={{ marginBottom: 14 }}>
                  <label style={FIELD_LABEL}>Password</label>
                  <PasswordInput placeholder="Choose a password" value={regPassword}
                    onChange={e => setRegPassword(e.target.value)} required minLength={4} wrapStyle={{ marginTop: 6 }} />
                </div>

                {/* Confirm Password */}
                <div className="modal-field" style={{ marginBottom: 18 }}>
                  <label style={FIELD_LABEL}>Confirm Password</label>
                  <PasswordInput placeholder="Re-enter password" value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)} required minLength={4} wrapStyle={{ marginTop: 6 }} />
                </div>

                {regError && <div className="error-msg" style={{ marginBottom: 12 }}><FiAlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {regError}</div>}
                {regSuccess && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#22c55e", marginBottom: 12 }}>{regSuccess}</div>}

                <button type="submit" className={`submit-btn ${regLoading ? "loading" : ""}`} disabled={regLoading} style={{ width: "100%" }}>
                  {regLoading ? <><span className="spinner" />Creating account...</> : `Register as ${regRole}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          Company Modal (Register & Recover)
      ══════════════════════════════════════════════════════ */}
      {showCompany && (
        <div className="modal-overlay" onClick={() => { if (!compResult) setShowCompany(false); }} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: "100%", padding: 0, overflow: "hidden" }}>
            <div className="modal-header" style={{ padding: "20px 24px 16px" }}>
              <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiBriefcase size={16} /> Company Settings
              </div>
              <button type="button" className="modal-close" onClick={() => setShowCompany(false)}>
                <FiX size={20} />
              </button>
            </div>

            {!compResult && (
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.1)" }}>
                <button
                  onClick={() => { setCompMode('register'); setCompError(""); setCompName(""); }}
                  style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: compMode === 'register' ? "2px solid var(--success)" : "2px solid transparent", color: compMode === 'register' ? "var(--success)" : "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                >
                  Register New
                </button>
                <button
                  onClick={() => { setCompMode('recover'); setCompError(""); setCompName(""); }}
                  style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: compMode === 'recover' ? "2px solid var(--accent)" : "2px solid transparent", color: compMode === 'recover' ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                >
                  Recover ID
                </button>
              </div>
            )}

            <div className="modal-body" style={{ padding: "24px" }}>
              {!compResult ? (
                <form onSubmit={handleCompanySubmit}>
                  <div className="modal-field" style={{ marginBottom: 18 }}>
                    <label style={FIELD_LABEL}>Wait, What's the Company Name?</label>
                    <div className="input-wrap" style={{ marginTop: 6 }}>
                      <span className="input-icon"><FiBriefcase size={14} /></span>
                      <input type="text" placeholder="e.g. Sharma Logistics Pvt Ltd"
                        value={compName} onChange={e => setCompName(e.target.value)} required autoFocus />
                    </div>
                  </div>

                  {compMode === 'register' ? (
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                      A unique <strong>Company ID</strong> will be generated for you. Share it with your team members so they can register under your company.
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                      Enter the exact company name you registered with to retrieve its <strong>Company ID</strong>.
                    </div>
                  )}

                  {compError && <div className="error-msg" style={{ marginBottom: 12 }}><FiAlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {compError}</div>}

                  <button type="submit" className={`submit-btn ${compLoading ? "loading" : ""}`} disabled={compLoading} style={{ width: "100%", background: compMode === 'register' ? "var(--success)" : "var(--accent)", borderColor: compMode === 'register' ? "var(--success)" : "var(--accent)" }}>
                    {compLoading ? <><span className="spinner" />{compMode === 'register' ? "Creating..." : "Searching..."}</> : (compMode === 'register' ? "Create Company" : "Find Company ID")}
                  </button>
                </form>
              ) : (
                /* ── Success state: show the generated/recovered Company ID ── */
                <div style={{ textAlign: "center", padding: "0 0 8px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{compResult.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
                    {compMode === 'register' ? "Your company has been registered!" : "Company retrieved successfully!"}
                  </div>

                  <div style={{ background: "rgba(249,115,22,0.08)", border: "2px dashed var(--accent)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Company ID</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)", letterSpacing: 4, fontFamily: "monospace" }}>{compResult.id}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Share this ID with your team so they can register</div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(compResult.id)}
                      style={{ flex: 1, padding: "10px 16px", background: "rgba(249,115,22,0.1)", border: "1px solid var(--accent)", borderRadius: 8, color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Copy ID
                    </button>
                    <button
                      onClick={() => { setShowCompany(false); openRegister(); setRegCompanyId(compResult.id); }}
                      className="submit-btn" style={{ flex: 1 }}>
                      Register Now →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}