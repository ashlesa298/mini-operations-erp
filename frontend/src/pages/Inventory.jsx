import { useEffect, useState } from "react";
import inventoryService from "../services/inventoryService";
import metaService from "../services/metaService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

const LOW_STOCK_THRESHOLD = 10;

export default function Inventory() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = ["ADMIN", "OPERATIONS"].includes(user?.role);

  const [records, setRecords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({ locationId: "", categoryId: "", search: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ itemId: "", locationId: "", batchNumber: "", physicalQty: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadInventory = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      setRecords(await inventoryService.list(activeFilters));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    metaService.getLocations().then(setLocations).catch(() => {});
    metaService.getCategories().then(setCategories).catch(() => {});
    metaService.getItems().then(setItems).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const next = { ...filters, [e.target.name]: e.target.value };
    setFilters(next);
    loadInventory(next);
  };

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await inventoryService.create({ ...form, physicalQty: Number(form.physicalQty) });
      toast.success("Inventory record created.");
      setShowCreate(false);
      setForm({ itemId: "", locationId: "", batchNumber: "", physicalQty: "" });
      loadInventory();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-toolbar">
        <div className="filter-bar">
          <select name="locationId" value={filters.locationId} onChange={handleFilterChange}>
            <option value="">All locations</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="search" placeholder="Search item name…" value={filters.search} onChange={handleFilterChange} />
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Inventory</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th><th>Category</th><th>Location</th><th>Batch</th>
              <th>Physical</th><th>Reserved</th><th>Available</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="state-message">Loading inventory…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="state-message">No inventory records found.</td></tr>
            ) : (
              records.map((r) => {
                const available = r.physicalQty - r.reservedQty;
                const low = available < LOW_STOCK_THRESHOLD;
                return (
                  <tr key={r.id}>
                    <td>{r.item?.name}</td>
                    <td>{r.item?.category?.name}</td>
                    <td>{r.location?.name}</td>
                    <td className="mono">{r.batchNumber}</td>
                    <td>{r.physicalQty}</td>
                    <td>{r.reservedQty}</td>
                    <td><span className={`stock-pill ${low ? "stock-low" : "stock-ok"}`}>{available}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal
          title="Add Inventory Record"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" form="create-inventory-form" type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          {formError && <div className="alert alert-error">{formError}</div>}
          <form id="create-inventory-form" className="form" onSubmit={handleCreate}>
            <label className="field">
              <span>Item</span>
              <select name="itemId" value={form.itemId} onChange={handleFormChange} required>
                <option value="">Select item</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Location</span>
              <select name="locationId" value={form.locationId} onChange={handleFormChange} required>
                <option value="">Select location</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Batch number</span>
              <input name="batchNumber" value={form.batchNumber} onChange={handleFormChange} required />
            </label>
            <label className="field">
              <span>Physical quantity</span>
              <input type="number" min="1" name="physicalQty" value={form.physicalQty} onChange={handleFormChange} required />
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}