import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess } from "../utils/roles";

const notes = {
  vehicles: "Vehicle registry routes are reserved for the fleet module.",
  drivers: "Driver profile and compliance routes are reserved for the driver module.",
  trips: "Trip dispatch workflows are reserved for the dispatch module.",
  maintenance: "Maintenance logs are reserved for the safety and service module.",
  fuelExpenses: "Fuel and expense workflows are reserved for the finance module.",
  analytics: "Analytics and exports are reserved for the reporting module.",
};

export default function PlaceholderPage({ pageKey, title }) {
  const { user } = useAuth();

  if (!canAccess(user?.role, pageKey)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Module route</p>
          <h1>{title}</h1>
          <p>{notes[pageKey]}</p>
        </div>
        <div className="status-pill">Ready for integration</div>
      </section>

      <section className="panel empty-panel">
        <h2>{title}</h2>
        <p>
          This page is intentionally lightweight in the core-auth feature so other module owners can
          implement the business workflow without fighting the foundation.
        </p>
      </section>
    </div>
  );
}
