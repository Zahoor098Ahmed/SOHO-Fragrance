import { useState, useEffect } from "react";

const defaultGateways = [
  { id: "cod", name: "Cash on Delivery (COD)", active: false, region: "Pakistan Nationwide", fee: "Rs. 0" },
  { id: "bank", name: "Bank Direct Transfer", active: true, region: "Pakistan Local Accounts", fee: "Rs. 0" },
  { id: "jazzcash", name: "JazzCash Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
  { id: "easypaisa", name: "Easypaisa Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
  { id: "nayapay", name: "NayaPay Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
  { id: "sadapay", name: "SadaPay Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
];

export default function SuperAdminPayments() {
  const [gateways, setGateways] = useState<typeof defaultGateways>([]);

  useEffect(() => {
    const loadGateways = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${apiBase}/config/gateways`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setGateways(data);
            return;
          }
        }
      } catch (err) {}
      setGateways(defaultGateways);
    };
    loadGateways();
  }, []);

  const toggleGateway = async (idx: number) => {
    const updated = gateways.map((g, i) => (i === idx ? { ...g, active: !g.active } : g));
    setGateways(updated);

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      await fetch(`${apiBase}/config/gateways`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: updated })
      });
    } catch (err) {
      console.error("Error saving gateways", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-dark-text">Payment Gateways</h1>
        <p className="text-sm text-muted-text mt-0.5">Activate payment gateways and define checkout fees.</p>
      </div>

      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        <div className="p-5 border-b border-cream">
          <h2 className="font-semibold text-dark-text font-display text-lg">System Payment Methods</h2>
        </div>

        <div className="divide-y divide-cream">
          {gateways.map((g, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-dark-text">{g.name}</h3>
                <p className="text-xs text-muted-text">Supported Region: {g.region}</p>
                <p className="text-xs text-muted-text/70 mt-1">Transaction Fees: {g.fee}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${g.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {g.active ? "Enabled" : "Disabled"}
                </span>
                <button
                  onClick={() => toggleGateway(idx)}
                  className="px-4 py-2 border border-cream hover:bg-ivory text-xs text-burgundy transition-all rounded-sm font-semibold cursor-pointer"
                >
                  {g.active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
