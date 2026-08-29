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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Selected customer for detailed view modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Retrieve auth token from localStorage
  const userStr = localStorage.getItem("soho_user");
  const authUser = userStr ? JSON.parse(userStr) : null;
  const token = authUser ? authUser.token : "";

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
          <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">Customers</h1>
          <p className="text-xs text-muted-text mt-1">Manage and view details of SOHO fragrance clientele (users with at least 1 successful order).</p>
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
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-text">
            No customers found.
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
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-ivory/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center font-bold text-xs uppercase">
                          {c.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold font-display">{c.name}</p>
                          <span className="text-[10px] text-burgundy bg-burgundy/5 px-1.5 py-0.5 rounded border border-burgundy/10 font-medium">Customer</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs">{c.email}</p>
                      <p className="text-[10px] text-muted-text mt-0.5">{c.phone || "No phone added"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{c.customerSince}</td>
                    <td className="px-6 py-4 text-xs font-mono text-center">{c.totalOrders}</td>
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
    </div>
  );
}
