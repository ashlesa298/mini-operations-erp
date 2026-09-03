import { useEffect, useState } from "react";
import employeeService from "../services/employeeService";
import metaService from "../services/metaService";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

const ROLES = ["ADMIN", "OPERATIONS", "SALES"];

export default function Employees() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPERATIONS", locationId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setEmployees(await employeeService.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    metaService.getLocations().then(setLocations).catch(() => {});
  }, []);

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await employeeService.create({ ...form, locationId: form.locationId || undefined });
      toast.success("Employee account created.");
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "OPERATIONS", locationId: "" });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (emp, role) => {
    try {
      await employeeService.update(emp.id, { role });
      toast.success(`${emp.name}'s role updated to ${role}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-toolbar">
        <div />
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Employee</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="state-message">Loading employees…</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={4} className="state-message">No employees found.</td></tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>
                    <select value={e.role} onChange={(ev) => handleRoleChange(e, ev.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{e.location?.name || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal
          title="New Employee"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" form="create-employee-form" type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create"}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <form id="create-employee-form" className="form" onSubmit={handleCreate}>
            <label className="field"><span>Full name</span>
              <input name="name" value={form.name} onChange={handleFormChange} required /></label>
            <label className="field"><span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleFormChange} required /></label>
            <label className="field"><span>Temporary password</span>
              <input type="password" name="password" value={form.password} onChange={handleFormChange} required minLength={6} /></label>
            <label className="field"><span>Role</span>
              <select name="role" value={form.role} onChange={handleFormChange}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select></label>
            <label className="field"><span>Location (optional)</span>
              <select name="locationId" value={form.locationId} onChange={handleFormChange}>
                <option value="">— None —</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select></label>
          </form>
        </Modal>
      )}
    </div>
  );
}