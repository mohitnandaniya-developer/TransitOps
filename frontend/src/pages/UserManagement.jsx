import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ROLE_LABELS, ROLE_VALUES } from "../utils/roles";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "dispatcher",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/users");
      setUsers(response.data.data.users);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (editing) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        };
        await api.put(`/users/${editing.id}`, payload);
        setMessage("User updated");
      } else {
        await api.post("/users", form);
        setMessage("User created");
      }
      resetForm();
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (target) => {
    setEditing(target);
    setForm({
      name: target.name,
      email: target.email,
      password: "",
      role: target.role,
    });
    setMessage("");
    setError("");
  };

  const updateStatus = async (target) => {
    setError("");
    setMessage("");
    try {
      await api.patch(`/users/${target.id}/status`, { isActive: !target.isActive });
      setMessage("User status updated");
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update status");
    }
  };

  const deleteUser = async (target) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/users/${target.id}`);
      setMessage("User deleted");
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete user");
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Fleet manager control</p>
          <h1>User Management</h1>
          <p>Create users, assign roles, and disable access within your organization.</p>
        </div>
        <div className="status-pill">{activeUsers} active</div>
      </section>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="two-column">
        <form className="panel form-stack" onSubmit={submitUser}>
          <div className="section-heading">
            <h2>{editing ? "Edit User" : "Create User"}</h2>
            <p>{editing ? editing.email : "Only fleet managers can create users."}</p>
          </div>

          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              required
            >
              {ROLE_VALUES.map((role) => (
                <option value={role} key={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              minLength={8}
              required={!editing}
              placeholder={editing ? "Leave blank to keep current password" : ""}
            />
          </label>

          <div className="button-row">
            {editing && (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Organization Users</h2>
            <p>{loading ? "Loading users..." : `${users.length} total users`}</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((target) => (
                  <tr key={target.id}>
                    <td>
                      <strong>{target.name}</strong>
                      <span>{target.email}</span>
                    </td>
                    <td>{ROLE_LABELS[target.role]}</td>
                    <td>
                      <span className={`state-chip ${target.isActive ? "active" : "inactive"}`}>
                        {target.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="ghost-button small" onClick={() => startEdit(target)}>
                          Edit
                        </button>
                        <button type="button" className="ghost-button small" onClick={() => updateStatus(target)}>
                          {target.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className="danger-button small"
                          onClick={() => deleteUser(target)}
                          disabled={target.id === currentUser?.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan="4">No users found.</td>
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
