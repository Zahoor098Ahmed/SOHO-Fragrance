import { useState, useEffect } from "react";
import { formatPKR } from "../../data/products";

const statusOptions = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Refunded"];

const orders = [
  { id: "#ORD-1045", customer: "Ayesha Khan", phone: "0300-1234567", items: "SOVÉRANE 100ml × 1", amount: 12000, payment: "JazzCash", status: "Delivered", date: "23 Aug 2026", city: "Karachi" },
  { id: "#ORD-1044", customer: "Hassan Raza", phone: "0321-9876543", items: "NOIRVÉA 50ml × 2", amount: 11000, payment: "COD", status: "Shipped", date: "22 Aug 2026", city: "Lahore" },
  { id: "#ORD-1043", customer: "Sara Ahmed", phone: "0333-5551234", items: "RAVÉLIEN 100ml × 1", amount: 7500, payment: "Easypaisa", status: "Processing", date: "22 Aug 2026", city: "Islamabad" },
];

const statusColor: Record<string, string> = {
  Delivered: "text-green-700 bg-green-50",
  Shipped: "text-blue-700 bg-blue-50",
  Processing: "text-yellow-700 bg-yellow-50",
  Confirmed: "text-purple-700 bg-purple-50",
  Pending: "text-gray-600 bg-gray-50",
  "Out for Delivery": "text-orange-700 bg-orange-50",
  Packed: "text-indigo-700 bg-indigo-50",
  Cancelled: "text-red-700 bg-red-50",
  Refunded: "text-pink-700 bg-pink-50",
};

export default function AdminOrders() {
  const [localOrders, setLocalOrders] = useState<typeof orders>([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<typeof orders[0] | null>(null);
  const [tempStatus, setTempStatus] = useState("");

  const loadOrders = async () => {
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/orders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLocalOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpen = (order: typeof orders[0]) => {
    setSelected(order);
    setTempStatus(order.status);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/orders/${encodeURIComponent(selected.id)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: tempStatus })
      });
      if (res.ok) {
        setLocalOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: tempStatus } : o)));
      }
    } catch (err) {
      console.error(err);
    }
    setSelected(null);
  };

  const filtered = filter === "All" ? localOrders : localOrders.filter((o) => o.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold text-dark-text">Orders</h1>
        <p className="text-sm text-muted-text mt-0.5">{localOrders.length} total orders</p>
      </div>

      {/* Status filters */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {["All", ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-sm transition-all cursor-pointer ${filter === s ? "bg-burgundy text-cream" : "border border-cream text-muted-text hover:border-champagne"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-sm border border-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory">
                {["Order", "Customer", "Items", "Amount", "Payment", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-text font-normal tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-t border-cream hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3 font-mono-custom text-xs text-dark-text">{order.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-dark-text font-medium">{order.customer}</p>
                    <p className="text-xs text-muted-text">{order.city}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-text max-w-xs">{order.items}</td>
                  <td className="px-4 py-3 font-mono-custom text-dark-text">{formatPKR(order.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-text">{order.payment}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${statusColor[order.status] || "text-gray-600 bg-gray-50"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-text">{order.date}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleOpen(order)} className="text-xs text-champagne hover:underline cursor-pointer">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-dark-text/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-dark-text">Order {selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between"><span className="text-muted-text">Customer</span><span className="text-dark-text font-medium">{selected.customer}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Phone</span><span className="text-dark-text">{selected.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">City</span><span className="text-dark-text">{selected.city}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Items</span><span className="text-dark-text text-right max-w-xs">{selected.items}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Payment</span><span className="text-dark-text">{selected.payment}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Amount</span><span className="font-mono-custom text-burgundy font-semibold">{formatPKR(selected.amount)}</span></div>
            </div>
            <div>
              <label className="text-xs text-muted-text tracking-wider uppercase mb-1.5 block">Update Status</label>
              <select
                value={tempStatus}
                onChange={(e) => setTempStatus(e.target.value)}
                className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm mb-4"
              >
                {statusOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button
              onClick={handleUpdate}
              className="w-full py-2.5 bg-burgundy text-cream text-xs tracking-[0.2em] uppercase hover:bg-dark-burgundy transition-colors rounded-sm cursor-pointer"
            >
              Update Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
