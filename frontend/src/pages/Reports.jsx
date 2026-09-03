import { useEffect, useState } from "react";
import reportService from "../services/reportService";
import inventoryService from "../services/inventoryService";
import DashboardCard from "../components/DashboardCard";

const LOW_STOCK_THRESHOLD = 10;

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([reportService.getDashboard(), inventoryService.list()])
      .then(([dash, inv]) => {
        setSummary(dash);
        setLowStock(inv.filter((r) => r.physicalQty - r.reservedQty < LOW_STOCK_THRESHOLD));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-message">Loading reports…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="dashboard-grid">
        <DashboardCard label="Low Stock Items" value={summary.lowStockItems} tone={summary.lowStockItems > 0 ? "warning" : "default"} />
        <DashboardCard label="Open Work Orders" value={summary.openWorkOrders} />
        <DashboardCard label="Pending Transfers" value={summary.pendingTransfers} />
        <DashboardCard label="Pending Orders" value={summary.pendingOrders} />
      </div>

      <h3 className="section-title">Low Stock Report</h3>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr><th>Item</th><th>Location</th><th>Batch</th><th>Available</th></tr>
          </thead>
          <tbody>
            {lowStock.length === 0 ? (
              <tr><td colSpan={4} className="state-message">No low-stock items. Everything looks healthy.</td></tr>
            ) : (
              lowStock.map((r) => (
                <tr key={r.id}>
                  <td>{r.item?.name}</td>
                  <td>{r.location?.name}</td>
                  <td className="mono">{r.batchNumber}</td>
                  <td><span className="stock-pill stock-low">{r.physicalQty - r.reservedQty}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}