import { useState, useEffect } from "react";

const defaultMethods = [
  { zone: "Karachi Same-Day Delivery", price: 250, time: "4-12 Hours", active: true },
  { zone: "Pakistan Standard Shipping", price: 0, time: "2-3 Working Days", active: true },
  { zone: "International Priority Scent Delivery", price: 6500, time: "5-7 Working Days", active: false },
];

export default function SuperAdminShipping() {
  const [methods, setMethods] = useState<typeof defaultMethods>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newZone, setNewZone] = useState({ zone: "", price: 0, time: "" });

  useEffect(() => {
    const loadShipping = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${apiBase}/config/shipping`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setMethods(data);
            return;
          }
        }
      } catch (err) {}
      setMethods(defaultMethods);
    };
    loadShipping();
  }, []);

  const saveMethods = async (list: typeof defaultMethods) => {
    setMethods(list);
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      await fetch(`${apiBase}/config/shipping`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: list })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMethod = (idx: number) => {
    const updated = methods.map((m, i) => (i === idx ? { ...m, active: !m.active } : m));
    saveMethods(updated);
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      zone: newZone.zone,
      price: Number(newZone.price) || 0,
      time: newZone.time,
      active: true,
    };
    saveMethods([...methods, created]);
    setModalOpen(false);
    setNewZone({ zone: "", price: 0, time: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Shipping & Delivery</h1>
          <p className="text-sm text-muted-text mt-0.5">Manage delivery areas, shipping rates, and estimated transit times.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm cursor-pointer"
        >
          + New Shipping Zone
        </button>
      </div>

      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        <div className="p-5 border-b border-cream flex justify-between items-center">
          <h2 className="font-semibold text-dark-text font-display text-lg">Delivery Options</h2>
        </div>

        <div className="divide-y divide-cream">
          {methods.map((m, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-dark-text">{m.zone}</h3>
                <p className="text-xs text-muted-text">Transit Time: {m.time}</p>
                <p className="text-xs text-champagne font-semibold mt-1">Delivery Charge: {m.price === 0 ? "Free Shipping" : `Rs. ${m.price}`}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {m.active ? "Enabled" : "Disabled"}
                </span>
                <button
                  onClick={() => toggleMethod(idx)}
                  className="px-4 py-2 border border-cream hover:bg-ivory text-xs text-burgundy transition-all rounded-sm font-semibold cursor-pointer"
                >
                  {m.active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Shipping Zone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6 border border-cream shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-cream">
              <h2 className="font-display text-xl text-dark-text">Add New Shipping Zone</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddZone} className="space-y-4">
              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Zone Name (e.g. Lahore Express)</label>
                <input
                  required
                  type="text"
                  value={newZone.zone}
                  onChange={(e) => setNewZone({ ...newZone, zone: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Delivery Charge (PKR)</label>
                <input
                  required
                  type="number"
                  value={newZone.price}
                  onChange={(e) => setNewZone({ ...newZone, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Estimated Transit Time (e.g. 1-2 Days)</label>
                <input
                  required
                  type="text"
                  value={newZone.time}
                  onChange={(e) => setNewZone({ ...newZone, time: e.target.value })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-cream">
                <button type="submit" className="flex-1 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-[0.2em] uppercase transition-colors rounded-sm cursor-pointer">
                  Create Zone
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
