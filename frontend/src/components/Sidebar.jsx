import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "OPERATIONS", "SALES"] },
  { to: "/work-orders", label: "Work Orders", roles: ["ADMIN", "OPERATIONS"] },
  { to: "/inventory", label: "Inventory", roles: ["ADMIN", "OPERATIONS", "SALES"] },
  { to: "/transfers", label: "Transfers", roles: ["ADMIN", "OPERATIONS"] },
  { to: "/orders", label: "Customer Orders", roles: ["ADMIN", "SALES"] },
  { to: "/reports", label: "Reports", roles: ["ADMIN", "OPERATIONS", "SALES"] },
  { to: "/employees", label: "Employees", roles: ["ADMIN"] },
  { to: "/settings", label: "Settings", roles: ["ADMIN", "OPERATIONS", "SALES"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const visible = LINKS.filter((l) => l.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">MO</span>
        <span className="logo-text">Mini Ops ERP</span>
      </div>
      <nav className="sidebar-nav">
        {visible.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}