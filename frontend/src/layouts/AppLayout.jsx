import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess, NAV_ITEMS, ROLE_LABELS } from "../utils/roles";

const THEME_KEY = "transitops-theme";

export default function AppLayout() {
  const { user, organization, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAccess(user?.role, item.key)),
    [user?.role]
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">TO</div>
          <div>
            <div className="brand-name">TransitOps</div>
            <div className="brand-subtitle">Smart transport control</div>
          </div>
        </div>

        <div className="tenant-card">
          <div className="tenant-name">{organization?.name || "TransitOps Organization"}</div>
          <div className="tenant-role">{ROLE_LABELS[user?.role] || "Operator"}</div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <span className="nav-marker" aria-hidden="true">{item.marker}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="danger-button" type="button" onClick={logout}>Logout</button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="mobile-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-panel">
        <header className="topbar">
          <button
            className="icon-button"
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <span aria-hidden="true">≡</span>
          </button>
          <div>
            <div className="topbar-title">TransitOps Workspace</div>
            <div className="topbar-subtitle">Organization-scoped operations</div>
          </div>
          <div className="topbar-user" aria-label="Current user">
            <div className="avatar" aria-hidden="true">{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <div>
              <div className="topbar-user-name">{user?.name}</div>
              <div className="topbar-user-role">{ROLE_LABELS[user?.role]}</div>
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
