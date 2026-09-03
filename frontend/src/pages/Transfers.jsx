import { useEffect, useState } from "react";
import transferService from "../services/transferService";
import metaService from "../services/metaService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

export default function Transfers() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = ["ADMIN", "OPERATIONS"].includes(user?.role);

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ sourceLocationId: "", destinationLocationId: "", itemId: "", quantity: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setTransfers(await transferService.list());
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
  }, []);

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await transferService.create({ ...form, quantity: Number(form.quantity) });
      toast.success("Transfer requested.");
      setShowCreate(false);
      setForm({ sourceLocationId: "", destinationLocationId: "", itemId: "", quantity: "" });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (id, action) => {
    setActingId(id);
    try {
      if (action === "dispatch") await transferService.dispatch(id);
      else await transferService.receive(id);
      toast.success(action === "dispatch" ? "Transfer dispatched." : "Transfer received.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <div className="page-toolbar">
        <div />
        {canManage && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Request Transfer</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th><th>Destination</th><th>Item</th><th>Quantity</th><th>Status</th>{canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="state-message">Loading transfers…</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={6} className="state-message">No transfers yet.</td></tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id}>
                  <td>{t.sourceLocation?.name}</td>
                  <td>{t.destinationLocation?.name}</td>
                  <td>{t.item?.name}</td>
                  <td>{t.quantity}</td>
                  <td><StatusBadge status={t.status} /></td>
                  {canManage && (
                    <td>
                      {t.status === "REQUESTED" && (
                        <button className="btn btn-sm btn-secondary" disabled={actingId === t.id} onClick={() => act(t.id, "dispatch")}>
                          {actingId === t.id ? "Working…" : "Dispatch"}
                        </button>
                      )}
                      {t.status === "DISPATCHED" && (
                        <button className="btn btn-sm btn-primary" disabled={actingId === t.id} onClick={() => act(t.id, "receive")}>
                          {actingId === t.id ? "Working…" : "Receive"}
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
          title="Request Internal Transfer"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" form="create-transfer-form" type="submit" disabled={submitting}>
                {submitting ? "Requesting…" : "Request"}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <form id="create-transfer-form" className="form" onSubmit={handleCreate}>
            <label className="field">
              <span>Source location</span>
              <select name="sourceLocationId" value={form.sourceLocationId} onChange={handleFormChange} required>
                <option value="">Select location</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Destination location</span>
              <select name="destinationLocationId" value={form.destinationLocationId} onChange={handleFormChange} required>
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
              <span>Quantity</span>
              <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleFormChange} required />
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}