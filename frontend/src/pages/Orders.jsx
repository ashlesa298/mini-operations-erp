import { useEffect, useState } from "react";
import orderService from "../services/orderService";
import metaService from "../services/metaService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";

const emptyLine = () => ({ itemId: "", locationId: "", quantity: "" });

export default function Orders() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = ["ADMIN", "SALES"].includes(user?.role);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await orderService.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    metaService.getCustomers().then(setCustomers).catch(() => {});
    metaService.getItems().then(setItems).catch(() => {});
    metaService.getLocations().then(setLocations).catch(() => {});
  }, []);

  const updateLine = (idx, field, value) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setLines([emptyLine()]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await orderService.create({
        customerId: customerId || undefined,
        customerName: customerId ? undefined : customerName,
        items: lines.map((l) => ({ ...l, quantity: Number(l.quantity) })),
      });
      toast.success("Order created and stock reserved.");
      setShowCreate(false);
      resetForm();
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await orderService.cancel(cancelTarget.id);
      toast.success("Order cancelled and stock released.");
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <div className="page-toolbar">
        <div />
        {canManage && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Order</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Items</th><th>Reserved</th><th>Status</th>{canManage && <th></th>}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="state-message">Loading orders…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="state-message">No customer orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer?.name}</td>
                  <td>
                    {o.items?.map((it) => (
                      <div key={it.id} className="order-line">
                        {it.item?.name} × {it.quantity} @ {it.location?.name}
                      </div>
                    ))}
                  </td>
                  <td>{o.items?.reduce((s, it) => s + it.reservedQty, 0)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  {canManage && (
                    <td>
                      {["PENDING", "RESERVED"].includes(o.status) && (
                        <button className="btn btn-sm btn-danger" onClick={() => setCancelTarget(o)}>Cancel</button>
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
          title="New Customer Order"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" form="create-order-form" type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create & Reserve"}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <form id="create-order-form" className="form" onSubmit={handleCreate}>
            <label className="field">
              <span>Existing customer</span>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— New customer —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {!customerId && (
              <label className="field">
                <span>New customer name</span>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required={!customerId} />
              </label>
            )}

            <div className="order-lines">
              <span className="field-label">Order items</span>
              {lines.map((line, idx) => (
                <div className="order-line-row" key={idx}>
                  <select value={line.itemId} onChange={(e) => updateLine(idx, "itemId", e.target.value)} required>
                    <option value="">Item</option>
                    {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <select value={line.locationId} onChange={(e) => updateLine(idx, "locationId", e.target.value)} required>
                    <option value="">Location</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <input type="number" min="1" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(idx, "quantity", e.target.value)} required />
                  {lines.length > 1 && (
                    <button type="button" className="icon-btn" onClick={() => removeLine(idx)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>+ Add item</button>
            </div>
          </form>
        </Modal>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel order?"
          message={`This will cancel the order for ${cancelTarget.customer?.name} and release all reserved stock.`}
          confirmLabel={cancelling ? "Cancelling…" : "Cancel order"}
          onCancel={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  );
}