import { useState, useEffect } from "react";
import { formatPKR } from "../../data/products";

interface Order {
  id: string;
  customer: string;
  email: string;
  items: string;
  amount: number;
  payment: string;
  status: string;
  date: string;
  city: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  customerSince: string;
  lastOrderDate: string;
  currentOrder: string;
}

interface RepeatCustomerOrder {
  id: string;
  date: string;
  status: string;
  amount: number;
  items: string;
  payment: string;
}

interface RepeatCustomer {
  key: string;
  customer: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orders: RepeatCustomerOrder[];
}

interface RepeatData {
  summary: {
    totalOrders: number;
    uniqueCustomers: number;
    repeatCustomersCount: number;
    repeatOrdersCount: number;
    repeatRevenue: number;
    repeatRate: number;
  };
  repeatCustomers: RepeatCustomer[];
}

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

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Repeat Customers Analytics & Modal State
  const [repeatData, setRepeatData] = useState<RepeatData | null>(null);
  const [loadingRepeat, setLoadingRepeat] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatSearchQuery, setRepeatSearchQuery] = useState("");
  const [expandedCustomerKey, setExpandedCustomerKey] = useState<string | null>(null);

  // Selected customer for detailed view modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Retrieve auth token from localStorage
  const userStr = localStorage.getItem("soho_user");
  const authUser = userStr ? JSON.parse(userStr) : null;
  const token = authUser ? authUser.token : "";

  const loadRepeatData = async () => {
    setLoadingRepeat(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/admin/repeat-customers`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setRepeatData(data);
      }
    } catch (err) {
      console.error("Failed to load repeat customers:", err);
    } finally {
      setLoadingRepeat(false);
    }
  };

  useEffect(() => {
    loadRepeatData();
  }, []);

  const fetchCustomers = async () => {
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
      if (orderStatusFilter !== "All") {
        queryParams.append("orderStatus", orderStatusFilter);
      }

      const res = await fetch(`${apiBase}/admin/customers?${queryParams.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers);
        setTotal(data.total);
      } else {
        throw new Error(data.error || "Unable to load customers.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, statusFilter, orderStatusFilter, page]);

  const handleOpenDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    setCustomerOrders([]);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/admin/customers/${customer._id}/orders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomerOrders(data);
      } else {
        console.error(data.error || "Failed to load customer orders.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">Customers Management</h1>
          <p className="text-xs text-muted-text mt-1">Manage and view details of SOHO fragrance clientele & repeat buyers.</p>
        </div>
      </div>

      {/* Repeat Customers Overview Banner */}
      <div className="bg-gradient-to-r from-ivory via-white to-amber-50/60 border border-amber-300/80 rounded-sm p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-500/10 border-2 border-amber-400 text-amber-800 text-xl flex items-center justify-center flex-shrink-0">
              🔁
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-display font-bold text-dark-text tracking-wide">
                  Repeat Customers Tracking
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {repeatData?.summary.repeatCustomersCount || 0} Repeated Clients
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {repeatData?.summary.repeatRate || 0}% Retention Rate
                </span>
              </div>
              <p className="text-xs text-muted-text mt-0.5">
                Overview of clients who have placed 2 or more orders with Maison SOHO Fragrance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-text">Repeat Clients</p>
              <p className="text-sm font-bold font-mono-custom text-dark-text">
                {repeatData ? `${repeatData.summary.repeatCustomersCount} / ${repeatData.summary.uniqueCustomers}` : "..."}
                <span className="text-[11px] font-normal text-amber-800 ml-1">
                  ({repeatData?.summary.repeatRate || 0}%)
                </span>
              </p>
            </div>

            <div className="h-8 w-px bg-cream hidden sm:block" />

            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-text">Repeat Orders</p>
              <p className="text-sm font-bold font-mono-custom text-dark-text">
                {repeatData?.summary.repeatOrdersCount || 0} Orders
              </p>
            </div>

            <div className="h-8 w-px bg-cream hidden sm:block" />

            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-text">Repeat Revenue</p>
              <p className="text-sm font-bold font-mono-custom text-green-700">
                {repeatData ? formatPKR(repeatData.summary.repeatRevenue) : "..."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRepeatModal(true)}
              className="px-3.5 py-2 bg-burgundy hover:bg-burgundy-light text-cream text-xs font-semibold tracking-wide rounded-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            >
              <span>👥</span>
              <span>View Repeat Breakdown ({repeatData?.summary.repeatCustomersCount || 0})</span>
            </button>
          </div>
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-text">Status:</label>
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

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-text">Order Status:</label>
            <select
              value={orderStatusFilter}
              onChange={(e) => { setOrderStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-cream text-xs text-dark-text focus:outline-none focus:border-champagne rounded-sm bg-white"
            >
              <option value="All">All Orders</option>
              {Object.keys(statusColor).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => { setRepeatOnly(!repeatOnly); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-sm transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
              repeatOnly
                ? "bg-amber-700 text-white shadow-xs"
                : "border border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
            }`}
          >
            <span>🔁</span>
            <span>Repeat Customers (≥ 2 Orders)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              repeatOnly ? "bg-white text-amber-900" : "bg-amber-200 text-amber-950"
            }`}>
              {repeatData?.summary.repeatCustomersCount || 0}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Customer List */}
      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-text">
            Loading customers...
          </div>
        ) : (repeatOnly ? customers.filter((c) => c.totalOrders > 1) : customers).length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-text">
            {repeatOnly ? "No repeat customers found with 2 or more orders." : "No customers found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-ivory border-b border-cream text-xs text-muted-text uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Customer Since</th>
                  <th className="px-6 py-4 font-semibold text-center">Orders</th>
                  <th className="px-6 py-4 font-semibold">Total Spent</th>
                  <th className="px-6 py-4 font-semibold">Current Order</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream text-dark-text">
                {(repeatOnly ? customers.filter((c) => c.totalOrders > 1) : customers).map((c) => (
                  <tr key={c._id} className="hover:bg-ivory/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center font-bold text-xs uppercase">
                          {c.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold font-display">{c.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-burgundy bg-burgundy/5 px-1.5 py-0.5 rounded border border-burgundy/10 font-medium">Customer</span>
                            {c.totalOrders > 1 && (
                              <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-bold flex items-center gap-1 shadow-2xs">
                                <span>🔁</span>
                                <span>Repeat Customer ({c.totalOrders} Orders)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs">{c.email}</p>
                      <p className="text-[10px] text-muted-text mt-0.5">{c.phone || "No phone added"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{c.customerSince}</td>
                    <td className="px-6 py-4 text-xs font-mono text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        c.totalOrders > 1 ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs" : "text-dark-text"
                      }`}>
                        {c.totalOrders > 1 ? `🔁 ${c.totalOrders}` : c.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-burgundy">{formatPKR(c.totalSpent)}</td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {c.currentOrder === "No Active Order" ? (
                        <span className="text-muted-text italic">No Active Order</span>
                      ) : (
                        <span className="font-semibold text-champagne bg-champagne/10 px-1.5 py-0.5 rounded">{c.currentOrder}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(c)}
                        className="text-xs text-champagne hover:underline cursor-pointer font-medium"
                      >
                        View Details
                      </button>
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
            Page {page} of {Math.ceil(total / limit)} ({total} total customers)
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

      {/* Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-dark-text/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-cream pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-burgundy text-cream flex items-center justify-center font-bold text-sm uppercase">
                  {selectedCustomer.name.slice(0, 2)}
                </div>
                <div>
                  <h2 className="font-display text-xl text-dark-text font-semibold">{selectedCustomer.name}</h2>
                  <p className="text-xs text-muted-text">{selectedCustomer.email} · {selectedCustomer.phone || "No phone"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-muted-text hover:text-dark-text cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedCustomer.totalOrders > 1 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 flex items-center gap-2">
                <span className="text-base">🔁</span>
                <div>
                  <strong>Repeat Client:</strong> This customer has placed {selectedCustomer.totalOrders} orders totaling {formatPKR(selectedCustomer.totalSpent)}.
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 my-5 bg-ivory p-4 border border-cream rounded-sm text-center">
              <div>
                <p className="text-[10px] text-muted-text tracking-wider uppercase font-semibold">Customer Since</p>
                <p className="text-sm font-semibold text-dark-text mt-1">{selectedCustomer.customerSince}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text tracking-wider uppercase font-semibold">Total Spent</p>
                <p className="text-sm font-semibold text-burgundy mt-1">{formatPKR(selectedCustomer.totalSpent)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-text tracking-wider uppercase font-semibold">Total Orders</p>
                <p className="text-sm font-semibold text-dark-text mt-1">{selectedCustomer.totalOrders} orders</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <h3 className="text-xs tracking-wider uppercase text-muted-text font-semibold mb-3">Order History</h3>
              {loadingOrders ? (
                <div className="text-center py-8 text-xs text-muted-text">Loading orders...</div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-text">No orders found.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-ivory border-b border-cream text-muted-text font-semibold">
                      <th className="px-4 py-2 font-mono">Order ID</th>
                      <th className="px-4 py-2">Items</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Date Placed</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream text-dark-text">
                    {customerOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-ivory/20">
                        <td className="px-4 py-3 font-mono font-semibold text-champagne">{order.id}</td>
                        <td className="px-4 py-3 text-muted-text">{order.items}</td>
                        <td className="px-4 py-3 font-semibold text-burgundy">{formatPKR(order.amount)}</td>
                        <td className="px-4 py-3 text-muted-text">{order.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-medium ${statusColor[order.status] || "text-gray-600 bg-gray-50"}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-cream pt-4 mt-4 flex justify-between items-center text-xs">
              <div className="text-muted-text">
                Current Active Order:{" "}
                {selectedCustomer.currentOrder === "No Active Order" ? (
                  <span className="italic">No Active Order</span>
                ) : (
                  <span className="font-semibold text-champagne font-mono bg-champagne/10 px-1.5 py-0.5 rounded ml-1">{selectedCustomer.currentOrder}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-espresso hover:bg-espresso/95 text-cream rounded-sm tracking-wider uppercase font-semibold cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Customers Breakdown Modal (Kon kon se user aur kitne user repeated hain) */}
      {showRepeatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-sm max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-cream max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-cream pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔁</span>
                  <h2 className="font-display text-xl font-bold text-dark-text">
                    Repeat Customers Breakdown
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {repeatData?.summary.repeatCustomersCount || 0} Repeated Clients
                  </span>
                </div>
                <p className="text-xs text-muted-text mt-1">
                  Kon kon se user aur kitne user repeated hain — Complete profile, contact details, total spend & order history.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRepeatModal(false)}
                className="text-muted-text hover:text-dark-text p-1.5 rounded-sm hover:bg-ivory transition-colors cursor-pointer"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Top 4 Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-ivory/70 border border-cream p-3 rounded-sm">
                <p className="text-[10px] uppercase font-semibold text-muted-text">Repeat Customers</p>
                <p className="text-lg font-bold font-mono-custom text-dark-text mt-0.5">
                  {repeatData?.summary.repeatCustomersCount || 0}
                  <span className="text-xs font-normal text-muted-text ml-1">
                    / {repeatData?.summary.uniqueCustomers || 0}
                  </span>
                </p>
                <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                  {repeatData?.summary.repeatRate || 0}% Customer Retention
                </p>
              </div>

              <div className="bg-ivory/70 border border-cream p-3 rounded-sm">
                <p className="text-[10px] uppercase font-semibold text-muted-text">Repeat Orders</p>
                <p className="text-lg font-bold font-mono-custom text-dark-text mt-0.5">
                  {repeatData?.summary.repeatOrdersCount || 0}
                  <span className="text-xs font-normal text-muted-text ml-1">
                    / {repeatData?.summary.totalOrders || 0}
                  </span>
                </p>
                <p className="text-[10px] text-muted-text mt-0.5">
                  {repeatData && repeatData.summary.totalOrders > 0
                    ? Math.round((repeatData.summary.repeatOrdersCount / repeatData.summary.totalOrders) * 100)
                    : 0}% of store orders
                </p>
              </div>

              <div className="bg-ivory/70 border border-cream p-3 rounded-sm">
                <p className="text-[10px] uppercase font-semibold text-muted-text">Repeat Revenue</p>
                <p className="text-lg font-bold font-mono-custom text-green-700 mt-0.5">
                  {repeatData ? formatPKR(repeatData.summary.repeatRevenue) : "..."}
                </p>
                <p className="text-[10px] text-muted-text mt-0.5">From returning clients</p>
              </div>

              <div className="bg-ivory/70 border border-cream p-3 rounded-sm">
                <p className="text-[10px] uppercase font-semibold text-muted-text">Avg Spend / Repeat</p>
                <p className="text-lg font-bold font-mono-custom text-champagne mt-0.5">
                  {repeatData && repeatData.summary.repeatCustomersCount > 0
                    ? formatPKR(Math.round(repeatData.summary.repeatRevenue / repeatData.summary.repeatCustomersCount))
                    : "PKR 0"}
                </p>
                <p className="text-[10px] text-muted-text mt-0.5">Lifetime Client Value</p>
              </div>
            </div>

            {/* Search Input Filter */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search repeat customers by name, phone (+92...), email, or city..."
                  value={repeatSearchQuery}
                  onChange={(e) => setRepeatSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-cream rounded-sm focus:border-champagne outline-none bg-ivory/30"
                />
                <span className="absolute left-3 top-2.5 text-xs text-muted-text">🔍</span>
                {repeatSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRepeatSearchQuery("")}
                    className="absolute right-3 top-2 text-xs text-muted-text hover:text-dark-text"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Customers List with Accordion */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingRepeat ? (
                <div className="text-center py-12 text-xs text-muted-text">
                  Loading repeat customers breakdown...
                </div>
              ) : !repeatData || repeatData.repeatCustomers.length === 0 ? (
                <div className="text-center py-12 bg-ivory/40 rounded border border-dashed border-cream p-6">
                  <p className="text-sm font-semibold text-dark-text">No Repeat Customers Found</p>
                  <p className="text-xs text-muted-text mt-1">
                    Clients who place 2 or more orders will automatically appear here.
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredList = repeatData.repeatCustomers.filter((c) => {
                    if (!repeatSearchQuery.trim()) return true;
                    const q = repeatSearchQuery.toLowerCase();
                    return (
                      (c.customer && c.customer.toLowerCase().includes(q)) ||
                      (c.phone && c.phone.toLowerCase().includes(q)) ||
                      (c.email && c.email.toLowerCase().includes(q)) ||
                      (c.city && c.city.toLowerCase().includes(q)) ||
                      (c.address && c.address.toLowerCase().includes(q))
                    );
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-muted-text">
                        No repeat customers found matching "{repeatSearchQuery}".
                      </div>
                    );
                  }

                  return filteredList.map((cust) => {
                    const isExpanded = expandedCustomerKey === cust.key;
                    const initials = (cust.customer || "CU")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={cust.key}
                        className="border border-cream rounded-sm bg-white overflow-hidden shadow-xs hover:border-champagne/70 transition-all"
                      >
                        {/* Customer Header Card */}
                        <div className="p-4 bg-gradient-to-r from-ivory/50 via-white to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream/80">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-amber-500/10 border-2 border-amber-400 text-amber-900 font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display text-sm font-bold text-dark-text">
                                  {cust.customer}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  🔁 {cust.ordersCount} Orders Placed
                                </span>
                              </div>
                              <p className="text-xs text-muted-text mt-0.5">
                                First Order: <strong className="text-dark-text">{cust.firstOrderDate}</strong> · Recent: <strong className="text-dark-text">{cust.lastOrderDate}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <div className="text-left sm:text-right mr-2">
                              <p className="text-[10px] uppercase font-semibold text-muted-text">Total Spent</p>
                              <p className="text-sm font-bold font-mono-custom text-green-700">
                                {formatPKR(cust.totalSpent)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setExpandedCustomerKey(isExpanded ? null : cust.key)}
                              className="px-2.5 py-1.5 bg-champagne/15 hover:bg-champagne/25 text-dark-text rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <span>{isExpanded ? "▲ Hide Orders" : `▼ View ${cust.orders.length} Orders`}</span>
                            </button>
                          </div>
                        </div>

                        {/* Customer Contact & Delivery Info */}
                        <div className="px-4 py-3 bg-ivory/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs border-b border-cream/50">
                          <div>
                            <span className="text-[10px] uppercase text-muted-text font-semibold block">Phone Number</span>
                            <a
                              href={`tel:${cust.phone}`}
                              className="font-mono text-dark-text font-medium hover:text-burgundy underline"
                            >
                              📞 {cust.phone}
                            </a>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-muted-text font-semibold block">Email Address</span>
                            {cust.email && cust.email !== "—" ? (
                              <a
                                href={`mailto:${cust.email}`}
                                className="text-dark-text font-medium hover:text-burgundy underline truncate block max-w-xs"
                              >
                                ✉️ {cust.email}
                              </a>
                            ) : (
                              <span className="text-muted-text italic">No email provided</span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-muted-text font-semibold block">Delivery Location</span>
                            <p className="text-dark-text font-medium truncate" title={`${cust.address}, ${cust.city}`}>
                              📍 {cust.city} {cust.address && cust.address !== "—" ? `· ${cust.address}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Expandable Order History Table */}
                        {isExpanded && (
                          <div className="p-4 bg-white animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text">
                                Complete Order History ({cust.orders.length} Orders)
                              </h4>
                              <span className="text-[11px] text-muted-text">
                                Sorted newest to oldest
                              </span>
                            </div>

                            <div className="overflow-x-auto border border-cream rounded-sm">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-ivory border-b border-cream text-muted-text text-[11px]">
                                    <th className="px-3 py-2 font-normal">Order ID</th>
                                    <th className="px-3 py-2 font-normal">Date</th>
                                    <th className="px-3 py-2 font-normal">Items Ordered</th>
                                    <th className="px-3 py-2 font-normal">Amount</th>
                                    <th className="px-3 py-2 font-normal">Payment</th>
                                    <th className="px-3 py-2 font-normal">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-cream">
                                  {cust.orders.map((ord) => (
                                    <tr key={ord.id} className="hover:bg-ivory/30 transition-colors">
                                      <td className="px-3 py-2 font-mono font-semibold text-dark-text">
                                        {ord.id}
                                      </td>
                                      <td className="px-3 py-2 text-muted-text whitespace-nowrap">
                                        {ord.date}
                                      </td>
                                      <td className="px-3 py-2 text-dark-text max-w-xs truncate" title={ord.items}>
                                        {ord.items}
                                      </td>
                                      <td className="px-3 py-2 font-mono font-bold text-dark-text">
                                        {formatPKR(ord.amount)}
                                      </td>
                                      <td className="px-3 py-2 text-muted-text">
                                        {ord.payment}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-semibold ${statusColor[ord.status] || "text-gray-600 bg-gray-50"}`}>
                                          {ord.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-4 border-t border-cream flex items-center justify-between">
              <span className="text-xs text-muted-text">
                Showing data dynamically calculated across all customer orders.
              </span>
              <button
                type="button"
                onClick={() => setShowRepeatModal(false)}
                className="px-4 py-2 bg-burgundy hover:bg-burgundy-light text-cream text-xs font-semibold rounded-sm transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
