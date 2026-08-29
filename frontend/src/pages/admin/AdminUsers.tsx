import { useState, useEffect } from "react";
import { useLocation } from "react-router";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  createdAt: string;
  totalOrders: number;
  lastOrderDate: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const location = useLocation();
  const isSuperAdminView = location.pathname.startsWith("/superadmin");

  // Retrieve current logged-in user from localStorage to check permissions
  const userStr = localStorage.getItem("soho_user");
  const authUser = userStr ? JSON.parse(userStr) : null;
  const token = authUser ? authUser.token : "";
  const isSuperAdminUser = authUser?.role === "superadmin";

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const queryParams = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        limit: limit.toString()
      });
      if (statusFilter !== "All") {
        queryParams.append("status", statusFilter);
      }

      const res = await fetch(`${apiBase}/admin/users?${queryParams.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setTotal(data.total);
      } else {
        throw new Error(data.error || "Unable to load users.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, page]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!isSuperAdminUser) {
      alert("Access denied. Only Super Admin can change user status.");
      return;
    }
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === id ? { ...u, status: newStatus } : u));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user status.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!isSuperAdminUser) {
      alert("Access denied. Only Super Admin can delete users.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this user account?")) {
      return;
    }
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
        setTotal(total - 1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">Users</h1>
          <p className="text-xs text-muted-text mt-1">Manage and view registered accounts who are not customers yet (0 successful orders).</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 border border-cream rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-cream rounded-sm focus:border-champagne outline-none transition-colors"
          />
          <svg className="w-4 h-4 text-muted-text absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-text">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-cream text-xs text-dark-text focus:outline-none focus:border-champagne rounded-sm bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Users List */}
      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-text">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-text">
            No new users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-ivory border-b border-cream text-xs text-muted-text uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">User Name</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold">Registration Date</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Orders</th>
                  <th className="px-6 py-4 font-semibold">Last Order</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream text-dark-text">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-ivory/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-champagne/10 text-champagne flex items-center justify-center font-bold text-xs uppercase">
                          {u.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold font-display">{u.name}</p>
                          <span className="text-[10px] text-muted-text bg-ivory px-1.5 py-0.5 rounded border border-cream font-medium">User</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs">{u.email}</p>
                      <p className="text-[10px] text-muted-text mt-0.5">{u.phone || "No phone added"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-center">{u.totalOrders}</td>
                    <td className="px-6 py-4 text-xs text-muted-text">{u.lastOrderDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {isSuperAdminUser ? (
                        <>
                          <button
                            onClick={() => handleToggleStatus(u._id, u.status)}
                            className="text-xs text-champagne hover:underline cursor-pointer font-medium"
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-xs text-red-500 hover:underline cursor-pointer font-medium"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-text font-medium italic">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-xs border border-cream text-muted-text rounded-sm hover:border-champagne disabled:opacity-50 cursor-pointer"
          >
            Previous Page
          </button>
          <span className="text-xs text-muted-text">
            Page {page} of {Math.ceil(total / limit)} ({total} total users)
          </span>
          <button
            onClick={() => setPage(p => (p * limit < total ? p + 1 : p))}
            disabled={page * limit >= total}
            className="px-3 py-1 text-xs border border-cream text-muted-text rounded-sm hover:border-champagne disabled:opacity-50 cursor-pointer"
          >
            Next Page
          </button>
        </div>
      )}
    </div>
  );
}
