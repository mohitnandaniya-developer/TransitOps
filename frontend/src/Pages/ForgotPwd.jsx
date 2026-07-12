import { useState } from "react";
import "../Styles/global.css";
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiArrowRight, FiKey } from "react-icons/fi";
import PasswordInput from "../Components/PasswordInput";

export default function ForgotPwd({ onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setError(data.error || "Email is not registered.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length < 6) return setError("OTP must be 6 digits.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(3);
      } else {
        setError(data.error || "Invalid OTP.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 4) return setError("Password must be at least 4 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root" style={{ overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      
      <div className="right-panel fade-in" style={{ margin: "auto", maxWidth: 480, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px", zIndex: 10 }}>
        
        {step !== 4 && (
          <button onClick={onBack} className="btn-secondary" style={{ marginBottom: 24, width: "fit-content", padding: "6px 12px", border: "none", background: "transparent", color: "var(--muted)" }}>
            <FiArrowLeft /> Back to Sign In
          </button>
        )}

        <div className="form-header" style={{ marginBottom: 24 }}>
          <div className="form-title">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter OTP"}
            {step === 3 && "Secure Your Account"}
            {step === 4 && "Password Reset Complete"}
          </div>
          <div className="form-sub">
            {step === 1 && "Enter your registered email address to receive a secure password reset link."}
            {step === 2 && `We've sent a 6-digit verification code to ${email}. It expires in 15 minutes.`}
            {step === 3 && "Choose a strong password with at least 4 characters."}
            {step === 4 && "Your password has been successfully updated. You can now use it to sign in."}
          </div>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="fade-in">
            <div className="field">
              <label>Email Address</label>
              <div className="input-wrap">
                <span className="input-icon"><FiMail size={14} /></span>
                <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className={`submit-btn ${loading ? "loading" : ""}`}>
              {loading ? <><span className="spinner" />Sending...</> : <>Send Reset Code <FiArrowRight size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></>}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="fade-in">
            <div className="field">
              <label>6-Digit OTP</label>
              <div className="input-wrap">
                <span className="input-icon"><FiKey size={14} /></span>
                <input type="text" placeholder="------" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} style={{ letterSpacing: 8, fontSize: 16, fontWeight: 700 }} />
              </div>
            </div>
            <button type="submit" className={`submit-btn ${loading ? "loading" : ""}`}>
              {loading ? <><span className="spinner" />Verifying...</> : <>Verify OTP <FiArrowRight size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></>}
            </button>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="fade-in">
            <div className="field" style={{ marginBottom: 14 }}>
              <label>New Password</label>
              <PasswordInput
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Confirm Password</label>
              <PasswordInput
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>
            <button type="submit" className={`submit-btn ${loading ? "loading" : ""}`}>
              {loading ? <><span className="spinner" />Resetting...</> : <>Save New Password <FiCheckCircle size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></>}
            </button>
          </form>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
            <FiCheckCircle size={64} color="var(--success)" style={{ marginBottom: 20 }} />
            <button onClick={onBack} className="submit-btn" style={{ background: "transparent", border: "1px solid var(--success)", color: "var(--success)" }}>
              Return to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
