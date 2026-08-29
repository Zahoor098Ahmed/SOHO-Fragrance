import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatPKR } from "../../data/products";

const admins = [
  { name: "Fatima Shah (Admin)", email: "admin@soho.com", role: "Admin", modules: 5, lastLogin: "Active now", status: "Active" },
  { name: "Kamran Khan (Owner)", email: "superadmin@soho.com", role: "Super Admin", modules: 12, lastLogin: "Active now", status: "Active" },
];

const auditLog = [
  { action: "Order status updated", by: "Fatima Shah (Admin)", resource: "#ORD-1044", time: "10 min ago" },
  { action: "Database parameters seeded", by: "System Autopilot", resource: "Configuration Initialized", time: "2 hours ago" },
  { action: "SMTP configurations loaded", by: "Kamran Khan (Owner)", resource: "Settings Updated", time: "5 hours ago" },
];

export default function SuperAdminDashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("soho_user");
      const authUser = userStr ? JSON.parse(userStr) : null;
      const token = authUser ? authUser.token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      
      // Fetch stats
      const statsRes = await fetch(`${apiBase}/admin/dashboard/statistics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const statsJson = await statsRes.json();

      // Fetch clients (limit to 5)
      const clientsRes = await fetch(`${apiBase}/admin/users?limit=5`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const clientsJson = await clientsRes.json();

      if (statsRes.ok) {
        setStatsData(statsJson);
      }
      if (clientsRes.ok) {
        setClients(clientsJson.users);
      }
    } catch (err) {
      console.error("Super Admin Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = [
    { label: "Total Users", value: statsData ? statsData.totalUsers : 0, change: "0 orders", color: "text-blue-600" },
    { label: "Total Customers", value: statsData ? statsData.totalCustomers : 0, change: ">= 1 order", color: "text-green-600" },
    { label: "New Users Today", value: statsData ? statsData.newUsersToday : 0, change: "Today", color: "text-purple-600" },
    { label: "New Customers Today", value: statsData ? statsData.newCustomersToday : 0, change: "Converted", color: "text-emerald-600" },
    { label: "Orders Today", value: statsData ? statsData.ordersToday : 0, change: "Today", color: "text-champagne" },
    { label: "Active Orders", value: statsData ? statsData.activeOrders : 0, change: "In delivery", color: "text-yellow-600" },
    { label: "Completed Orders", value: statsData ? statsData.completedOrders : 0, change: "Delivered", color: "text-green-700" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Super Admin Console</h1>
          <p className="text-sm text-muted-text mt-0.5">Full system control and oversight</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-3 py-1.5 border border-cream text-xs rounded-sm hover:border-champagne text-muted-text transition-all cursor-pointer bg-white"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-sm p-4 border border-cream flex flex-col justify-between shadow-xs">
            <div>
              <p className="text-[10px] text-muted-text uppercase font-semibold tracking-wider mb-2">{stat.label}</p>
              <p className={`text-2xl font-mono-custom font-semibold ${stat.color}`}>{loading ? "..." : stat.value}</p>
            </div>
            <p className="text-[9px] text-muted-text/75 mt-2 italic leading-tight">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Management */}
        <div className="bg-white rounded-sm border border-cream overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream">
            <h2 className="font-semibold text-dark-text">Admin Accounts</h2>
            <Link to="/superadmin/admins" className="text-xs text-champagne hover:underline tracking-wider">Manage</Link>
          </div>
          <div className="divide-y divide-cream">
            {admins.map((admin) => (
              <div key={admin.email} className="px-5 py-3 flex items-center justify-between hover:bg-ivory/50 transition-colors">
                <div>
                  <p className="text-sm text-dark-text font-medium">{admin.name}</p>
                  <p className="text-xs text-muted-text">{admin.email} · {admin.role}</p>
                  <p className="text-xs text-muted-text/70 mt-0.5">Last login: {admin.lastLogin}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm font-medium ${admin.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {admin.status}
                  </span>
                  <p className="text-[10px] text-muted-text/70 mt-1">{admin.modules} modules</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-cream">
            <Link to="/superadmin/admins" className="text-xs text-champagne hover:underline">+ Add Admin</Link>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-sm border border-cream overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream">
            <h2 className="font-semibold text-dark-text">Recent Audit Log</h2>
            <Link to="/superadmin/audit-logs" className="text-xs text-champagne hover:underline tracking-wider">View all</Link>
          </div>
          <div className="divide-y divide-cream">
            {auditLog.map((log, i) => (
              <div key={i} className="px-5 py-3 hover:bg-ivory/50 transition-colors">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-dark-text">{log.action}</p>
                  <span className="text-[10px] text-muted-text/70 ml-4 flex-shrink-0">{log.time}</span>
                </div>
                <p className="text-xs text-muted-text mt-0.5">By {log.by} · {log.resource}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clients / Users list */}
      <div className="bg-white rounded-sm border border-cream overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream">
          <h2 className="font-semibold text-dark-text">Client Accounts (Users: 0 Orders)</h2>
          <span className="text-xs text-muted-text">{loading ? "..." : clients.length} Newest Users</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-text">Loading client accounts...</div>
        ) : clients.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-text">
            No registered clients found.
          </div>
        ) : (
          <div className="divide-y divide-cream">
            {clients.map((client) => (
              <div key={client.email} className="px-5 py-3.5 flex items-center justify-between hover:bg-ivory/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-dark-text font-display">{client.name}</p>
                  <p className="text-xs text-muted-text font-mono mt-0.5">{client.email}</p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-champagne/10 text-champagne border border-champagne/10">
                  User
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-sm font-medium text-muted-text tracking-[0.15em] uppercase mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Admin Management", href: "/superadmin/admins" },
            { label: "Roles & Permissions", href: "/superadmin/roles" },
            { label: "Security", href: "/superadmin/security" },
            { label: "Audit Logs", href: "/superadmin/audit-logs" },
            { label: "Analytics", href: "/superadmin/analytics" },
            { label: "Payments", href: "/superadmin/payments" },
            { label: "Users list", href: "/superadmin/users" },
            { label: "Settings", href: "/superadmin/settings" },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="p-3 bg-white border border-cream rounded-sm text-sm text-dark-text hover:text-champagne hover:border-champagne/40 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
