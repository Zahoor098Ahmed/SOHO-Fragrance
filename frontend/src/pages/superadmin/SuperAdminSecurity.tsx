import { useState, useEffect } from "react";

const defaultIps = ["192.168.1.100 (Home)", "110.39.2.14 (Office)"];

export default function SuperAdminSecurity() {
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [twoFactor, setTwoFactor] = useState(true);
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [ipModalOpen, setIpModalOpen] = useState(false);

  useEffect(() => {
    const loadSecurity = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${apiBase}/config/security`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (Array.isArray(data.ips)) setIps(data.ips);
            if (typeof data.twoFactor === "boolean") setTwoFactor(data.twoFactor);
            if (data.sessionTimeout) setSessionTimeout(data.sessionTimeout);
            return;
          }
        }
      } catch (err) {}
      setIps(defaultIps);
    };
    loadSecurity();
  }, []);

  const saveSecurity = async (updatedIps: string[], updated2fa: boolean, updatedTimeout: string) => {
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      await fetch(`${apiBase}/config/security`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          value: { ips: updatedIps, twoFactor: updated2fa, sessionTimeout: updatedTimeout }
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const saveIps = (list: string[]) => {
    setIps(list);
    saveSecurity(list, twoFactor, sessionTimeout);
  };

  const handle2faToggle = () => {
    const updated = !twoFactor;
    setTwoFactor(updated);
    saveSecurity(ips, updated, sessionTimeout);
  };

  const handleTimeoutChange = (val: string) => {
    setSessionTimeout(val);
    saveSecurity(ips, twoFactor, val);
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIp.trim()) {
      const updated = [...ips, newIp.trim()];
      saveIps(updated);
      setNewIp("");
      setIpModalOpen(false);
    }
  };

  const handleRemoveIp = (ipToRemove: string) => {
    const updated = ips.filter((ip) => ip !== ipToRemove);
    saveIps(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-dark-text">Security Controls</h1>
        <p className="text-sm text-muted-text mt-0.5">Enforce system security policies, session configurations, and access security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Settings */}
        <div className="bg-white border border-cream rounded-sm p-6 space-y-6">
          <h2 className="font-display text-lg font-semibold text-dark-text border-b border-cream pb-3">Authentication Policies</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark-text">Enforce 2-Factor Authentication (2FA)</p>
                <p className="text-xs text-muted-text">Require admins to verify sign-ins via secondary code.</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={handle2faToggle}
                className="accent-burgundy w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-muted-text">Session Inactivity Timeout (minutes)</label>
              <select
                value={sessionTimeout}
                onChange={(e) => handleTimeoutChange(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="bg-white border border-cream rounded-sm p-6 space-y-6">
          <h2 className="font-display text-lg font-semibold text-dark-text border-b border-cream pb-3">IP Whitelisting</h2>
          <p className="text-xs text-muted-text">Restrict access to super admin console from registered networks only.</p>
          <div className="space-y-3">
            {ips.map((ip, idx) => (
              <div key={idx} className="flex justify-between items-center bg-ivory p-3 rounded-sm border border-cream text-sm text-dark-text">
                <span className="font-mono">{ip}</span>
                <button
                  onClick={() => handleRemoveIp(ip)}
                  className="text-xs text-red-500 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => setIpModalOpen(true)}
              className="w-full py-2 border border-dashed border-cream hover:border-champagne text-xs text-burgundy tracking-wider uppercase font-semibold transition-all mt-2 cursor-pointer"
            >
              + Add IP Range
            </button>
          </div>
        </div>
      </div>

      {/* Add IP Modal */}
      {ipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6 border border-cream shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-cream">
              <h2 className="font-display text-xl text-dark-text">Add IP Whitelist</h2>
              <button onClick={() => setIpModalOpen(false)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddIp} className="space-y-4">
              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">IP Address / Description</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 192.168.1.150 (Laptop)"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-cream">
                <button type="submit" className="flex-1 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-[0.2em] uppercase transition-colors rounded-sm cursor-pointer">
                  Whitelist IP
                </button>
                <button type="button" onClick={() => setIpModalOpen(false)} className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm">
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
