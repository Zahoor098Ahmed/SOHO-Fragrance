import { useState, useEffect } from "react";

const allPermissions = [
  "products.view", "products.manage",
  "orders.view", "orders.manage",
  "customers.view", "customers.manage",
  "inventory.view", "inventory.manage",
  "reviews.view", "reviews.manage",
  "coupons.manage", "shipping.manage",
  "payments.view", "payment.settings",
  "content.manage", "analytics.view",
  "admins.manage", "security.manage", "audit.view",
];

const defaultAdmins = [
  { id: 1, name: "Admin Ali", email: "ali@soho.pk", role: "Admin", status: "Active", perms: ["products.view", "products.manage", "orders.view", "orders.manage", "customers.view", "inventory.view", "analytics.view", "reviews.view"] },
  { id: 2, name: "Admin Sara", email: "sara@soho.pk", role: "Admin", status: "Active", perms: ["products.view", "orders.view", "customers.view", "content.manage", "analytics.view"] },
  { id: 3, name: "Admin Hamza", email: "hamza@soho.pk", role: "Content Admin", status: "Inactive", perms: ["content.manage", "products.view", "reviews.view"] },
];

export default function SuperAdminAdmins() {
  const [localAdmins, setLocalAdmins] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "admin" });

  const loadAdmins = async () => {
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter users that have role admin or superadmin
        const admins = data.filter((u: any) => u.role === "admin" || u.role === "superadmin");

        // Fetch permissions for each admin dynamically from Config
        const adminsWithPerms = await Promise.all(
          admins.map(async (admin: any) => {
            try {
              const pRes = await fetch(`${apiBase}/config/admin_perms_${admin._id}`, {
                headers: { "Authorization": `Bearer ${token}` }
              });
              if (pRes.ok) {
                const permsVal = await pRes.json();
                return { ...admin, perms: permsVal || [] };
              }
            } catch (err) {}
            return { ...admin, perms: [] };
          })
        );
        setLocalAdmins(adminsWithPerms);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const openAdmin = (admin: any) => {
    setSelected(admin);
    setPerms([...(admin.perms || [])]);
  };

  const toggleAdminStatus = async (id: string) => {
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const admin = localAdmins.find((a) => a._id === id);
      if (!admin) return;

      const newStatus = (admin.status || "Active") === "Active" ? "Inactive" : "Active";

      const res = await fetch(`${apiBase}/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadAdmins();
      }
    } catch (err) {}
  };

  const togglePerm = (perm: string) => {
    setPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const handleSavePerms = async () => {
    if (!selected) return;
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      // Save permissions in config
      await fetch(`${apiBase}/config/admin_perms_${selected._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: perms })
      });
      setSelected(null);
      loadAdmins();
    } catch (err) {}
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadAdmins();
      }
    } catch (err) {}
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          role: newAdmin.role.toLowerCase() === "superadmin" ? "superadmin" : "admin"
        })
      });
      if (res.ok) {
        setAddModalOpen(false);
        setNewAdmin({ name: "", email: "", password: "", role: "admin" });
        loadAdmins();
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Admin Management</h1>
          <p className="text-sm text-muted-text mt-0.5">Create, manage and control admin access</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-burgundy hover:bg-espresso text-cream text-xs tracking-[0.2em] uppercase transition-colors rounded-sm cursor-pointer"
        >
          + Add Admin
        </button>
      </div>

      <div className="bg-white rounded-sm border border-cream overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream">
              {["Name", "Email", "Role", "Permissions", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localAdmins.map((admin) => (
              <tr key={admin._id} className="border-t border-cream hover:bg-ivory/50 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-dark-text font-medium">{admin.name}</p>
                </td>
                <td className="px-5 py-3 text-muted-text text-xs">{admin.email}</td>
                <td className="px-5 py-3 text-muted-text text-xs">{admin.role}</td>
                <td className="px-5 py-3 text-xs text-muted-text/75">{(admin.perms || []).length} permissions</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm font-medium ${(admin.status || "Active") === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {admin.status || "Active"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => openAdmin(admin)} className="text-xs text-champagne hover:underline cursor-pointer">Edit</button>
                    <button
                      onClick={() => toggleAdminStatus(admin._id)}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      {(admin.status || "Active") === "Active" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6 border border-cream shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-cream">
              <h2 className="font-display text-xl text-dark-text">Add New Admin</h2>
              <button onClick={() => setAddModalOpen(false)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Full Name</label>
                <input
                  required
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Email Address</label>
                <input
                  required
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Password</label>
                <input
                  required
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}                 className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">System Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text bg-white focus:outline-none focus:border-champagne rounded-sm"
                >
                  <option value="Admin">Admin</option>
                  <option value="Content Admin">Content Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-cream">
                <button type="submit" className="flex-1 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-[0.2em] uppercase transition-colors rounded-sm cursor-pointer">
                  Create Admin
                </button>
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission editor */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto border border-cream shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl text-dark-text">Edit {selected.name}</h2>
                <p className="text-xs text-muted-text mt-0.5">Manage permissions</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs text-muted-text tracking-wider uppercase mb-3">Assign Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((perm) => (
                  <label key={perm} className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer transition-all text-xs ${perms.includes(perm) ? "bg-burgundy/10 text-burgundy font-medium" : "text-muted-text/70 hover:text-muted-text"}`}>
                    <input
                      type="checkbox"
                      checked={perms.includes(perm)}
                      onChange={() => togglePerm(perm)}
                      className="accent-burgundy"
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSavePerms}
                className="flex-1 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-[0.2em] uppercase transition-colors rounded-sm cursor-pointer"
              >
                Save Permissions
              </button>
              <button onClick={() => setSelected(null)} className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
