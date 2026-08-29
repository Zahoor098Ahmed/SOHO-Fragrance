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

const defaultRoles = [
  { id: 1, name: "Super Admin", usersCount: 1, permissions: ["all"], level: "System Level" },
  { id: 2, name: "Admin", usersCount: 2, permissions: ["products.manage", "orders.manage", "customers.view"], level: "Store Level" },
  { id: 3, name: "Content Admin", usersCount: 1, permissions: ["content.manage", "reviews.manage"], level: "Content Level" },
];

export default function SuperAdminRoles() {
  const [roles, setRoles] = useState<typeof defaultRoles>([]);
  const [selectedRole, setSelectedRole] = useState<typeof defaultRoles[0] | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [newRoleModal, setNewRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", level: "Store Level" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("soho_roles");
      if (saved) {
        setRoles(JSON.parse(saved));
      } else {
        setRoles(defaultRoles);
      }
    } catch {
      setRoles(defaultRoles);
    }
  }, []);

  const saveRoles = (list: typeof defaultRoles) => {
    setRoles(list);
    try {
      localStorage.setItem("soho_roles", JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (role: typeof defaultRoles[0]) => {
    setSelectedRole(role);
    setPerms([...role.permissions]);
  };

  const togglePerm = (perm: string) => {
    if (perms.includes("all")) {
      // If "all" is set and we click something else, remove "all" and add that perm
      if (perm === "all") {
        setPerms([]);
      } else {
        setPerms([perm]);
      }
    } else {
      if (perm === "all") {
        setPerms(["all"]);
      } else {
        setPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
      }
    }
  };

  const handleSavePerms = () => {
    if (!selectedRole) return;
    const updated = roles.map((r) => r.id === selectedRole.id ? { ...r, permissions: perms } : r);
    saveRoles(updated);
    setSelectedRole(null);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.name.trim()) {
      const created = {
        id: roles.length + 1,
        name: newRole.name.trim(),
        usersCount: 0,
        permissions: ["products.view"],
        level: newRole.level,
      };
      saveRoles([...roles, created]);
      setNewRoleModal(false);
      setNewRole({ name: "", level: "Store Level" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Roles & Permissions</h1>
          <p className="text-sm text-muted-text mt-0.5">Define access levels and module permissions for admin users.</p>
        </div>
        <button
          onClick={() => setNewRoleModal(true)}
          className="px-4 py-2 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm cursor-pointer"
        >
          + New Role
        </button>
      </div>

      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        <div className="p-5 border-b border-cream flex justify-between items-center">
          <h2 className="font-semibold text-dark-text">Role Configurations</h2>
        </div>

        <div className="divide-y divide-cream">
          {roles.map((role) => (
            <div key={role.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-semibold text-dark-text text-lg">{role.name}</h3>
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-burgundy/10 text-burgundy">
                    {role.level}
                  </span>
                </div>
                <p className="text-xs text-muted-text">Assigned to {role.usersCount} active accounts</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="text-[10px] font-mono bg-ivory border border-cream px-2 py-0.5 rounded text-dark-text">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(role)}
                  className="px-3 py-1.5 border border-cream hover:bg-ivory text-xs text-burgundy transition-all rounded-sm font-medium cursor-pointer"
                >
                  Edit Permissions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Role Modal */}
      {newRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6 border border-cream shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-cream">
              <h2 className="font-display text-xl text-dark-text">Create New Role</h2>
              <button onClick={() => setNewRoleModal(false)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddRole} className="space-y-4">
              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Role Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Moderator"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Level Scope</label>
                <select
                  value={newRole.level}
                  onChange={(e) => setNewRole({ ...newRole, level: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text bg-white focus:outline-none focus:border-champagne rounded-sm"
                >
                  <option value="System Level">System Level</option>
                  <option value="Store Level">Store Level</option>
                  <option value="Content Level">Content Level</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-cream">
                <button type="submit" className="flex-1 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-[0.2em] uppercase transition-colors rounded-sm cursor-pointer">
                  Create Role
                </button>
                <button type="button" onClick={() => setNewRoleModal(false)} className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto border border-cream shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl text-dark-text">Permissions for {selectedRole.name}</h2>
                <p className="text-xs text-muted-text mt-0.5">Toggle system access rights</p>
              </div>
              <button onClick={() => setSelectedRole(null)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs text-muted-text tracking-wider uppercase mb-3">Assign Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer transition-all text-xs ${perms.includes("all") ? "bg-burgundy/10 text-burgundy font-medium" : "text-muted-text/70 hover:text-muted-text"}`}>
                  <input
                    type="checkbox"
                    checked={perms.includes("all")}
                    onChange={() => togglePerm("all")}
                    className="accent-burgundy"
                  />
                  all (Full System Access)
                </label>
                {allPermissions.map((perm) => (
                  <label key={perm} className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer transition-all text-xs ${perms.includes(perm) || perms.includes("all") ? "bg-burgundy/10 text-burgundy font-medium" : "text-muted-text/70 hover:text-muted-text"}`}>
                    <input
                      type="checkbox"
                      checked={perms.includes(perm) || perms.includes("all")}
                      disabled={perms.includes("all")}
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
              <button onClick={() => setSelectedRole(null)} className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
