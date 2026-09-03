import { useEffect, useState } from "react";
import reportService from "../services/reportService";
import DashboardCard from "../components/DashboardCard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-message">Loading dashboard…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="dashboard-grid">
      <DashboardCard label="Total Inventory Items" value={data.totalInventoryItems} />
      <DashboardCard
        label="Low Stock Items"
        value={data.lowStockItems}
        tone={data.lowStockItems > 0 ? "warning" : "default"}
      />
      <DashboardCard label="Open Work Orders" value={data.openWorkOrders} />
      <DashboardCard label="Pending Transfers" value={data.pendingTransfers} />
      <DashboardCard label="Pending Orders" value={data.pendingOrders} />
      <DashboardCard label="Total Reserved Stock" value={data.totalReservedStock} />
    </div>
  );
}