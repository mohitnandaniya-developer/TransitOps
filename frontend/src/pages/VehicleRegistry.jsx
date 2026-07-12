import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { canAccess } from "../utils/roles";

const VEHICLE_TYPES = [
  { value: "truck", label: "Truck", price: 65 },
  { value: "mini_truck", label: "Mini Truck", price: 45 },
  { value: "van", label: "Van", price: 30 },
  { value: "bike", label: "Bike", price: 12 },
];

const VEHICLE_STATUSES = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "retired", label: "Retired" },
];

const emptyForm = {
  name: "",
  type: "truck",
  plate: "",
  capacityKg: "",
  odometerKm: "0",
  status: "available",
  region: "",
  pricePerKm: "65",
};

const labelFor = (items, value) => items.find((item) => item.value === value)?.label || value;

export default function VehicleRegistry() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canManage = user?.role === "fleet_manager";

  const loadVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/vehicles", {
        params: {
          includeRetired: statusFilter === "retired" ? "true" : undefined,
          status: statusFilter !== "active" && statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
        },
      });
      setVehicles(response.data.data.vehicles);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [statusFilter, typeFilter]);

  const visibleVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vehicles;
    return vehicles.filter((vehicle) => (
      vehicle.name.toLowerCase().includes(query)
      || vehicle.plate.toLowerCase().includes(query)
      || (vehicle.region || "").toLowerCase().includes(query)
    ));
  }, [vehicles, search]);

  const counts = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter((vehicle) => vehicle.status === "available").length,
    onTrip: vehicles.filter((vehicle) => vehicle.status === "on_trip").length,
    maintenance: vehicles.filter((vehicle) => vehicle.status === "maintenance" || vehicle.status === "out_of_service").length,
  }), [vehicles]);

  if (!canAccess(user?.role, "vehicles")) return <Navigate to="/dashboard" replace />;

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const setField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "type" && !editing) {
        next.pricePerKm = String(VEHICLE_TYPES.find((type) => type.value === value)?.price || 0);
      }
      return next;
    });
  };

  const startEdit = (vehicle) => {
    setEditing(vehicle);
    setMessage("");
    setError("");
    setForm({
      name: vehicle.name,
      type: vehicle.type,
      plate: vehicle.plate,
      capacityKg: String(vehicle.capacityKg),
      odometerKm: String(vehicle.odometerKm),
      status: vehicle.status,
      region: vehicle.region || "",
      pricePerKm: String(vehicle.pricePerKm),
    });
  };

  const submitVehicle = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const payload = {
      name: form.name,
      type: form.type,
      plate: form.plate,
      capacityKg: Number(form.capacityKg),
      odometerKm: Number(form.odometerKm),
      status: form.status,
      region: form.region || null,
      pricePerKm: Number(form.pricePerKm),
    };

    try {
      if (editing) {
        await api.put(`/vehicles/${editing.id}`, payload);
        setMessage("Vehicle updated");
      } else {
        await api.post("/vehicles", payload);
        setMessage("Vehicle created");
      }
      resetForm();
      await loadVehicles();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (vehicle, status) => {
    setError("");
    setMessage("");
    try {
      await api.patch(`/vehicles/${vehicle.id}/status`, { status });
      setMessage("Vehicle status updated");
      await loadVehicles();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update vehicle status");
    }
  };

  const retireVehicle = async (vehicle) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      setMessage("Vehicle retired");
      await loadVehicles();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to retire vehicle");
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Fleet inventory</p>
          <h1>Vehicle Registry</h1>
          <p>Track assets, capacity, odometer readings, rates, and operational status.</p>
        </div>
        <div className="status-pill">{counts.available} available</div>
      </section>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="metric-grid">
        <div className="metric-card">
          <span>Total Vehicles</span>
          <strong>{counts.total}</strong>
          <p>Filtered by current view</p>
        </div>
        <div className="metric-card">
          <span>On Trip</span>
          <strong>{counts.onTrip}</strong>
          <p>Assigned to active movement</p>
        </div>
        <div className="metric-card">
          <span>Service Attention</span>
          <strong>{counts.maintenance}</strong>
          <p>Maintenance or out of service</p>
        </div>
      </section>

      <section className={canManage ? "two-column" : ""}>
        {canManage && (
          <form className="panel form-stack" onSubmit={submitVehicle}>
            <div className="section-heading">
              <h2>{editing ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <p>{editing ? editing.plate : "Fleet managers can register operational assets."}</p>
            </div>

            <label>
              Vehicle Name
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} required />
            </label>

            <label>
              Vehicle Type
              <select value={form.type} onChange={(event) => setField("type", event.target.value)} required>
                {VEHICLE_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
              </select>
            </label>

            <label>
              Plate Number
              <input value={form.plate} onChange={(event) => setField("plate", event.target.value)} required />
            </label>

            <label>
              Capacity (kg)
              <input type="number" min="1" value={form.capacityKg} onChange={(event) => setField("capacityKg", event.target.value)} required />
            </label>

            <label>
              Odometer (km)
              <input type="number" min="0" step="0.1" value={form.odometerKm} onChange={(event) => setField("odometerKm", event.target.value)} required />
            </label>

            <label>
              Price Per Km
              <input type="number" min="0" step="0.01" value={form.pricePerKm} onChange={(event) => setField("pricePerKm", event.target.value)} required />
            </label>

            <label>
              Region
              <input value={form.region} onChange={(event) => setField("region", event.target.value)} placeholder="North, West, Depot A..." />
            </label>

            <label>
              Status
              <select value={form.status} onChange={(event) => setField("status", event.target.value)} required>
                {VEHICLE_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
              </select>
            </label>

            <div className="button-row">
              {editing && <button className="ghost-button" type="button" onClick={resetForm}>Cancel</button>}
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save Vehicle" : "Create Vehicle"}
              </button>
            </div>
          </form>
        )}

        <section className="panel">
          <div className="section-heading">
            <h2>Registered Vehicles</h2>
            <p>{loading ? "Loading vehicles..." : `${visibleVehicles.length} vehicles in view`}</p>
          </div>

          <div className="filters-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, plate, or region"
              aria-label="Search vehicles"
            />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by type">
              <option value="all">All types</option>
              {VEHICLE_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
              <option value="active">Active only</option>
              <option value="all">All non-retired</option>
              {VEHICLE_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Specs</th>
                  <th>Cost</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visibleVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <strong>{vehicle.name}</strong>
                      <span>{vehicle.plate}</span>
                    </td>
                    <td>
                      {labelFor(VEHICLE_TYPES, vehicle.type)}
                      <span>{vehicle.capacityKg.toLocaleString()} kg · {vehicle.odometerKm.toLocaleString()} km</span>
                      {vehicle.region && <span>{vehicle.region}</span>}
                    </td>
                    <td>
                      ₹{vehicle.pricePerKm.toLocaleString()}/km
                      <span>Base billing rate</span>
                    </td>
                    <td>
                      <span className={`state-chip ${vehicle.status === "available" ? "active" : vehicle.status === "retired" ? "inactive" : ""}`}>
                        {labelFor(VEHICLE_STATUSES, vehicle.status)}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="table-actions">
                          <button type="button" className="ghost-button small" onClick={() => startEdit(vehicle)}>Edit</button>
                          <select
                            className="compact-select"
                            value={vehicle.status}
                            onChange={(event) => updateStatus(vehicle, event.target.value)}
                            aria-label={`Update ${vehicle.name} status`}
                          >
                            {VEHICLE_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
                          </select>
                          <button
                            type="button"
                            className="danger-button small"
                            onClick={() => retireVehicle(vehicle)}
                            disabled={vehicle.status === "retired"}
                          >
                            Retire
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!loading && visibleVehicles.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 5 : 4}>No vehicles found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
