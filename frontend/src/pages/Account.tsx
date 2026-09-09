import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useStore } from "../store/store";

interface Order {
  id: string;
  date: string;
  amount: number;
  status: string;
  items: string;
  payment: string;
  city: string;
}

export default function Account() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "addresses" | "preferences">("orders");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const getInitialUserOrders = (): Order[] => {
    try {
      const saved = localStorage.getItem("soho_user_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  };

  const [userOrders, setUserOrders] = useState<Order[]>(getInitialUserOrders);
  const [orderPage, setOrderPage] = useState<number>(1);
  const ORDERS_PER_PAGE = 5;
  const totalOrderPages = Math.ceil(userOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = userOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

  useEffect(() => {
    if (orderPage > totalOrderPages && totalOrderPages > 0) {
      setOrderPage(1);
    }
  }, [userOrders.length, totalOrderPages, orderPage]);

  const resolveProfileName = (role?: string, email?: string, name?: string) => {
    if (role === "superadmin" || email === "superadmin@soho.com") return "Super Admin";
    if (role === "admin" || email === "admin@soho.com") return "Admin";
    return name || "Guest User";
  };

  const [userProfile, setUserProfile] = useState({
    name: resolveProfileName(state.user?.role, state.user?.email, state.user?.name),
    email: state.user?.email || "guest@soho.com",
    phone: "+92 300 1234567",
    newsletter: true,
  });

  const [address, setAddress] = useState({
    street: "12-C, Lane 4, Zamzama Commercial Area",
    city: "Karachi",
    postalCode: "75500",
    country: "Pakistan",
  });

  const [preferences, setPreferences] = useState({
    scentFamily: "Amber Woody",
    concentration: "Eau de Parfum",
    intensity: "Strong",
  });

  const loadProfile = async () => {
    if (!state.user) return;
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/auth/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile({
          name: resolveProfileName(data.role || state.user?.role, data.email || state.user?.email, data.name || state.user?.name),
          email: data.email || state.user?.email,
          phone: data.phone || "+92 300 1234567",
          newsletter: true
        });
        setAddress({
          street: data.street || "12-C, Lane 4, Zamzama Commercial Area",
          city: data.city || "Karachi",
          postalCode: data.postalCode || "75500",
          country: data.country || "Pakistan"
        });
        setPreferences({
          scentFamily: data.scentFamily || "Amber Woody",
          concentration: data.scentConcentration || "Eau de Parfum",
          intensity: data.scentIntensity || "Strong"
        });
      } else {
        // Fallback for mock/test users
        setUserProfile((p) => ({
          ...p,
          name: resolveProfileName(state.user?.role, state.user?.email, state.user?.name),
          email: state.user?.email || "guest@soho.com"
        }));
      }
    } catch (err) {
      setUserProfile((p) => ({
        ...p,
        name: resolveProfileName(state.user?.role, state.user?.email, state.user?.name),
        email: state.user?.email || "guest@soho.com"
      }));
    }
  };

  useEffect(() => {
    loadProfile();
  }, [state.user]);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!state.user) return;
      try {
        const userStr = localStorage.getItem("soho_user");
        const token = userStr ? JSON.parse(userStr).token : "";
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const emailParam = state.user.email ? `?email=${encodeURIComponent(state.user.email)}` : "";

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiBase}/orders${emailParam}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const localSaved = getInitialUserOrders();
            const orderMap = new Map<string, Order>();
            data.forEach((o: Order) => orderMap.set(o.id, o));
            localSaved.forEach((o: Order) => {
              if (!orderMap.has(o.id)) orderMap.set(o.id, o);
            });
            const merged = Array.from(orderMap.values());
            setUserOrders(merged);
            try {
              localStorage.setItem("soho_user_orders", JSON.stringify(merged));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
      }
    };
    fetchUserOrders();
  }, [state.user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);

    // Optimistically update localStorage and application state
    const updatedUser = { ...state.user, name: userProfile.name };
    dispatch({ type: "SET_USER", user: updatedUser as any });

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      await fetch(`${apiBase}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userProfile.name,
          phone: userProfile.phone
        })
      });
    } catch (err) {}
    loadProfile();
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingAddress(false);
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      await fetch(`${apiBase}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          street: address.street,
          city: address.city,
          postalCode: address.postalCode,
          country: address.country
        })
      });
      loadProfile();
    } catch (err) {}
  };

  const updatePreference = async (key: string, value: string) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      await fetch(`${apiBase}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          scentFamily: key === "scentFamily" ? value : preferences.scentFamily,
          scentConcentration: key === "concentration" ? value : preferences.concentration,
          scentIntensity: key === "intensity" ? value : preferences.intensity
        })
      });
    } catch (err) {}
  };

  const storeUser = state.user || { name: "Guest User", email: "guest@soho.com", role: "user" };

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-3">Maison SOHO</p>
          <h1 className="font-display text-4xl lg:text-5xl text-dark-text font-light">My Account</h1>
          <p className="text-muted-text text-sm mt-2">Welcome back, {resolveProfileName(storeUser.role, storeUser.email, storeUser.name)}</p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="space-y-1">
            {[
              { id: "orders", label: "Order History", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
              { id: "profile", label: "Profile Details", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              { id: "addresses", label: "Saved Addresses", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
              { id: "preferences", label: "Scent Preferences", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs tracking-wider uppercase font-semibold transition-all rounded-sm ${
                  activeTab === tab.id
                    ? "bg-espresso text-cream border-l-2 border-champagne"
                    : "text-muted-text hover:text-dark-text hover:bg-cream"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
            <div className="pt-6 space-y-2">
              {(storeUser.role === "admin" || storeUser.role === "superadmin") && (
                <Link
                  to="/admin"
                  className="w-full inline-block text-center border border-champagne text-champagne hover:bg-champagne hover:text-dark-text transition-colors py-3 text-xs tracking-wider uppercase font-semibold rounded-sm"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  dispatch({ type: "LOGOUT" });
                  navigate("/login");
                }}
                className="w-full text-center border border-red-200 hover:border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors py-3 text-xs tracking-wider uppercase font-semibold rounded-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 bg-white border border-cream p-6 lg:p-8 rounded-sm">
            {activeTab === "orders" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-2xl text-dark-text">Recent Orders</h2>
                    <p className="text-xs text-muted-text mt-1">View tracking details, items and delivery invoices for your purchases.</p>
                  </div>
                  {userOrders.length > 0 && (
                    <span className="text-xs text-muted-text font-medium bg-ivory border border-cream px-3 py-1.5 rounded-sm">
                      Showing <span className="font-semibold text-dark-text">{Math.min((orderPage - 1) * ORDERS_PER_PAGE + 1, userOrders.length)}</span>–
                      <span className="font-semibold text-dark-text">{Math.min(orderPage * ORDERS_PER_PAGE, userOrders.length)}</span> of <span className="font-semibold text-dark-text">{userOrders.length}</span> orders
                    </span>
                  )}
                </div>

                {userOrders.length === 0 ? (
                  <p className="text-muted-text text-sm py-8 text-center bg-ivory border border-cream rounded-sm">You haven't placed any orders yet.</p>
                ) : (
                  <div className="space-y-6">
                    {paginatedOrders.map((order) => (
                      <div key={order.id} className="border border-cream rounded-sm p-5 space-y-4 hover:border-champagne/40 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream pb-4">
                          <div>
                            <span className="text-xs text-muted-text">Order ID</span>
                            <p className="text-sm font-semibold text-dark-text tracking-wider">{order.id}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-text">Placed On</span>
                            <p className="text-sm text-dark-text">{order.date}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-text">Total</span>
                            <p className="text-sm font-semibold text-burgundy">Rs. {order.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className={`inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm font-semibold ${
                              order.status === "Delivered" ? "bg-green-100 text-green-700" :
                              order.status === "Processing" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="py-2 text-sm text-dark-text">
                          <p className="text-xs text-muted-text uppercase tracking-wider mb-1">Items</p>
                          <p className="font-semibold font-display text-dark-text">{order.items}</p>
                          <p className="text-xs text-muted-text mt-1">Payment Method: {order.payment} · Shipping City: {order.city}</p>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalOrderPages > 1 && (
                      <div className="pt-4 border-t border-cream flex flex-wrap items-center justify-between gap-4">
                        <p className="text-xs text-muted-text">
                          Page <span className="font-semibold text-dark-text">{orderPage}</span> of <span className="font-semibold text-dark-text">{totalOrderPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={orderPage === 1}
                            onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all border ${
                              orderPage === 1
                                ? "border-cream text-muted-text/50 cursor-not-allowed bg-cream/20"
                                : "border-cream text-dark-text hover:bg-champagne/10 hover:border-champagne cursor-pointer"
                            }`}
                          >
                            ← Previous
                          </button>

                          {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setOrderPage(num)}
                              className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                                orderPage === num
                                  ? "bg-burgundy text-cream shadow-sm"
                                  : "border border-cream text-dark-text hover:bg-champagne/10"
                              }`}
                            >
                              {num}
                            </button>
                          ))}

                          <button
                            type="button"
                            disabled={orderPage === totalOrderPages}
                            onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all border ${
                              orderPage === totalOrderPages
                                ? "border-cream text-muted-text/50 cursor-not-allowed bg-cream/20"
                                : "border-cream text-dark-text hover:bg-champagne/10 hover:border-champagne cursor-pointer"
                            }`}
                          >
                            Next 5 →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl text-dark-text">Personal Details</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-champagne hover:underline tracking-wider uppercase font-semibold"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none disabled:bg-ivory disabled:text-muted-text transition-colors rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        disabled={!isEditing}
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                        className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none disabled:bg-ivory disabled:text-muted-text transition-colors rounded-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none disabled:bg-ivory disabled:text-muted-text transition-colors rounded-sm"
                    />
                  </div>

                  {isEditing && (
                    <button
                      type="submit"
                      className="px-8 py-3 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm"
                    >
                      Save Changes
                    </button>
                  )}
                </form>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <h2 className="font-display text-2xl text-dark-text mb-6">Default Shipping Address</h2>
                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="border border-cream rounded-sm p-6 space-y-4">
                    <div>
                      <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Street Address</label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">City</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Country</label>
                      <input
                        type="text"
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                        className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-6 py-2.5 border border-cream hover:bg-ivory text-dark-text text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="border border-cream rounded-sm p-6 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-dark-text">{userProfile.name}</p>
                      <p className="text-sm text-muted-text">{address.street}</p>
                      <p className="text-sm text-muted-text">{address.city}, {address.postalCode}</p>
                      <p className="text-sm text-muted-text">{address.country}</p>
                      <p className="text-sm text-muted-text mt-2">Phone: {userProfile.phone}</p>
                    </div>
                    <div className="border-t border-cream pt-4 flex gap-4">
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="text-xs text-champagne hover:underline tracking-wider uppercase font-semibold cursor-pointer"
                      >
                        Edit Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "preferences" && (
              <div>
                <h2 className="font-display text-2xl text-dark-text mb-2">Scent Profile</h2>
                <p className="text-muted-text text-sm mb-6">Tell us your tastes and we'll suggest matching scents.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-2">Favorite Scent Family</label>
                    <div className="flex flex-wrap gap-2">
                      {["Amber Woody", "Citrus Floral", "Fresh Spicy", "Leather Oud"].map((fam) => (
                        <button
                          key={fam}
                          onClick={() => updatePreference("scentFamily", fam)}
                          className={`px-4 py-2 text-xs font-medium border rounded-sm transition-all cursor-pointer ${
                            preferences.scentFamily === fam
                              ? "border-burgundy bg-burgundy/5 text-burgundy"
                              : "border-cream hover:border-champagne text-muted-text"
                          }`}
                        >
                          {fam}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-2">Preferred Concentration</label>
                    <div className="flex flex-wrap gap-2">
                      {["Eau de Toilette", "Eau de Parfum", "Extrait de Parfum"].map((conc) => (
                        <button
                          key={conc}
                          onClick={() => updatePreference("concentration", conc)}
                          className={`px-4 py-2 text-xs font-medium border rounded-sm transition-all cursor-pointer ${
                            preferences.concentration === conc
                              ? "border-burgundy bg-burgundy/5 text-burgundy"
                              : "border-cream hover:border-champagne text-muted-text"
                          }`}
                        >
                          {conc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-2">Sillage & Strength</label>
                    <div className="flex flex-wrap gap-2">
                      {["Subtle", "Moderate", "Strong"].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => updatePreference("intensity", lvl)}
                          className={`px-4 py-2 text-xs font-medium border rounded-sm transition-all cursor-pointer ${
                            preferences.intensity === lvl
                              ? "border-burgundy bg-burgundy/5 text-burgundy"
                              : "border-cream hover:border-champagne text-muted-text"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-ivory border border-cream p-4 rounded-sm">
                    <h4 className="text-xs font-semibold text-dark-text tracking-wider uppercase mb-1">Recommended for You</h4>
                    <p className="text-xs text-muted-text mb-3">Based on your Amber Woody & Strong sillage preference:</p>
                    <Link
                      to="/product/veloren"
                      className="text-xs text-burgundy hover:underline tracking-wider font-semibold uppercase"
                    >
                      Explore VELORÉN →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
