import { useEffect, useState } from "react";
import { Link } from "react-router";
import { products } from "../../data/products";
import { formatPKR } from "../../data/products";

const statusColor: Record<string, string> = {
  Delivered: "text-green-700 bg-green-100",
  Shipped: "text-blue-700 bg-blue-100",
  Processing: "text-yellow-700 bg-yellow-100",
  Confirmed: "text-purple-700 bg-purple-100",
  Pending: "text-gray-600 bg-gray-100",
  "Out for Delivery": "text-orange-700 bg-orange-100",
  Packed: "text-indigo-700 bg-indigo-100",
  Cancelled: "text-red-700 bg-red-100",
  Refunded: "text-pink-700 bg-pink-100",
};

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const lowStock = products.filter((p) => p.stock50ml < 25 || p.stock100ml < 15);

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

      // Fetch recent orders
      const ordersRes = await fetch(`${apiBase}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const ordersJson = await ordersRes.json();

      if (statsRes.ok) {
        setStatsData(statsJson);
      }
      if (ordersRes.ok) {
        setRecentOrders(ordersJson.slice(0, 5));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = [
    { label: "Total Users", value: statsData ? statsData.totalUsers : 0, change: "Registered (0 orders)", color: "text-blue-600" },
    { label: "Total Customers", value: statsData ? statsData.totalCustomers : 0, change: "Clients (>= 1 order)", color: "text-green-600" },
    { label: "Repeat Customers", value: statsData ? statsData.repeatCustomersCount : 0, change: statsData ? `${statsData.repeatRate}% retention (${statsData.repeatOrdersCount} orders)` : ">= 2 orders", color: "text-amber-700" },
    { label: "New Customers Today", value: statsData ? statsData.newCustomersToday : 0, change: "Converted today", color: "text-emerald-600" },
    { label: "Orders Today", value: statsData ? statsData.ordersToday : 0, change: "Placed in last 24h", color: "text-champagne" },
    { label: "Active Orders", value: statsData ? statsData.activeOrders : 0, change: "In delivery pipeline", color: "text-yellow-600" },
    { label: "Completed Orders", value: statsData ? statsData.completedOrders : 0, change: "Fully delivered", color: "text-green-700" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Dashboard</h1>
          <p className="text-sm text-muted-text mt-0.5">Welcome back. Here is a live summary of Maison SOHO.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-cream overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream">
            <h2 className="font-semibold text-dark-text">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-champagne hover:underline tracking-wider">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ivory text-xs text-muted-text">
                  <th className="text-left px-5 py-2.5 font-normal tracking-wider">Order</th>
                  <th className="text-left px-5 py-2.5 font-normal tracking-wider hidden md:table-cell">Customer</th>
                  <th className="text-left px-5 py-2.5 font-normal tracking-wider hidden lg:table-cell">Product Items</th>
                  <th className="text-right px-5 py-2.5 font-normal tracking-wider">Amount</th>
                  <th className="text-left px-5 py-2.5 font-normal tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-muted-text">Loading orders...</td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-muted-text">No active orders.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-cream hover:bg-ivory/50 transition-colors">
                      <td className="px-5 py-3 font-mono-custom text-xs text-dark-text">{order.id}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-dark-text">{order.customer}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-muted-text text-xs max-w-xs truncate">{order.items}</td>
                      <td className="px-5 py-3 text-right font-mono-custom text-dark-text">{formatPKR(order.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${statusColor[order.status] || "text-gray-600 bg-gray-100"}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-sm border border-cream overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream">
            <h2 className="font-semibold text-dark-text">Low Stock</h2>
            <Link to="/admin/inventory" className="text-xs text-champagne hover:underline tracking-wider">Manage</Link>
          </div>
          <div className="divide-y divide-cream">
            {lowStock.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-text font-display">{p.name}</p>
                  <p className="text-xs text-muted-text mt-0.5 font-mono">50ml: {p.stock50ml} · 100ml: {p.stock100ml}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${p.stock50ml < 10 || p.stock100ml < 5 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {p.stock50ml < 10 || p.stock100ml < 5 ? "Critical" : "Low"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Add Product", href: "/admin/products", icon: "M12 4v16m8-8H4" },
          { label: "View Orders", href: "/admin/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "Users list", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" },
          { label: "Customers", href: "/admin/customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
        ].map((action) => (
          <Link key={action.href} to={action.href} className="flex items-center gap-3 p-4 bg-white border border-cream rounded-sm hover:border-champagne hover:shadow-sm transition-all">
            <svg className="w-4 h-4 text-champagne flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} />
            </svg>
            <span className="text-sm text-dark-text">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
