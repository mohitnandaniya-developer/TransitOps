import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess, NAV_ITEMS, ROLE_LABELS } from "../utils/roles";

export default function Dashboard() {
  const { user, organization } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => canAccess(user?.role, item.key) && item.key !== "dashboard");

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Core workspace</p>
          <h1>Dashboard</h1>
          <p>
            {organization?.name} is ready for role-based TransitOps modules.
          </p>
        </div>
        <div className="status-pill">{ROLE_LABELS[user?.role]}</div>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <span>Identity</span>
          <strong>{user?.name}</strong>
          <p>{user?.email}</p>
        </div>
        <div className="metric-card">
          <span>Tenant</span>
          <strong>{organization?.name}</strong>
          <p>All protected APIs scope data by organizationId.</p>
        </div>
        <div className="metric-card">
          <span>Access</span>
          <strong>{visibleItems.length}</strong>
          <p>Navigation entries available to this role.</p>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Available Modules</h2>
          <p>Business modules are routed and permission-gated for team integration.</p>
        </div>
        <div className="module-grid">
          {visibleItems.map((item) => (
            <Link className="module-tile" to={item.path} key={item.key}>
              <span className="nav-marker">{item.marker}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.path}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
