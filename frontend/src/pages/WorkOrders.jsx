import { useEffect, useState } from "react";
import workOrderService from "../services/workOrderService";
import metaService from "../services/metaService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const NEXT_STATUS = { ASSIGNED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };

export default function WorkOrders() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ locationId: "", itemId: "", requiredQty: "", assignedUserId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await workOrderService.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    metaService.getLocations().then(setLocations).catch(() => {});
    metaService.getItems().then(setItems).catch(() => {});
    if (user?.role === "ADMIN") metaService.getUsers().then(setUsers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await workOrderService.create({ ...form, requiredQty: Number(form.requiredQty) });
      toast.success("Work order created.");
      setShowCreate(false);
      setForm({ locationId: "", itemId: "", requiredQty: "", assignedUserId: "" });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      await workOrderService.updateStatus(order.id, next);
      toast.success(`Work order moved to ${next.replace("_", " ")}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const canUpdate = ["ADMIN", "OPERATIONS"].includes(user?.role);

  return (
    <div>
      <div className="page-toolbar">
        <div />
        {user?.role === "ADMIN" && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Work Order</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th><th>Item</th><th>Required</th><th>Available</th>
              <th>Shortage</th><th>Assigned To</th><th>Status</th>{canUpdate && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="state-message">Loading work orders…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="state-message">No work orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.location?.name}</td>
                  <td>{o.item?.name}</td>
                  <td>{o.requiredQty}</td>
                  <td>{o.availableQty}</td>
                  <td>{o.shortage > 0
                    ? <span className="stock-pill stock-low">{o.shortage}</span>
                    : <span className="stock-pill stock-ok">0</span>}</td>
                  <td>{o.assignedUser?.name}</td>
                  <td><StatusBadge status={o.status} /></td>
                  {canUpdate && (
                    <td>
                      {NEXT_STATUS[o.status] && (
                        <button className="btn btn-sm btn-secondary" disabled={updatingId === o.id} onClick={() => advance(o)}>
                          {updatingId === o.id ? "Updating…" : `Mark ${NEXT_STATUS[o.status].replace("_", " ")}`}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal
          title="New Work Order"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" form="create-wo-form" type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create"}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <form id="create-wo-form" className="form" onSubmit={handleCreate}>
            <label className="field">
              <span>Location</span>
              <select name="locationId" value={form.locationId} onChange={handleFormChange} required>
                <option value="">Select location</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Item</span>
              <select name="itemId" value={form.itemId} onChange={handleFormChange} required>
                <option value="">Select item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Required quantity</span>
              <input type="number" min="1" name="requiredQty" value={form.requiredQty} onChange={handleFormChange} required />
            </label>
            <label className="field">
              <span>Assign to</span>
              <select name="assignedUserId" value={form.assignedUserId} onChange={handleFormChange} required>
                <option value="">Select user</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}