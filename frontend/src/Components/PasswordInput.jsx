import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordInput({ placeholder, value, onChange, required, minLength, wrapStyle }) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-wrap" style={wrapStyle}>
      <span className="input-icon"><FiLock size={14} /></span>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        style={{ paddingRight: "44px" }}
      />
      <button
        type="button"
        className="pwd-toggle-btn"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
      >
        {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </button>
    </div>
  );
}
