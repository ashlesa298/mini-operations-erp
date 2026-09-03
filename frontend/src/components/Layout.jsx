import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const TITLES = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/work-orders": "Work Orders",
  "/transfers": "Internal Transfers",
  "/orders": "Customer Orders",
  "/reports": "Reports",
  "/employees": "Employees",
  "/settings": "Settings",
};

export default function Layout() {
  const location = useLocation();
  const title = TITLES[location.pathname] || "Mini Operations ERP";

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}