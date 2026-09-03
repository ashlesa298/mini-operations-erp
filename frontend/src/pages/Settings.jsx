import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="card settings-card">
      <h3 className="section-title">Profile</h3>
      <div className="settings-grid">
        <div><span className="field-label">Name</span><p>{user?.name}</p></div>
        <div><span className="field-label">Email</span><p>{user?.email}</p></div>
        <div><span className="field-label">Role</span><p>{user?.role}</p></div>
        <div><span className="field-label">Location</span><p>{user?.locationId || "Not assigned"}</p></div>
      </div>
    </div>
  );
}