import { useState, useEffect } from "react";

interface SmtpAccount {
  _id: string;
  senderName: string;
  email: string;
  status: "Active" | "Inactive";
  pass: string;
}

export default function SuperAdminSettings() {
  // Maison Settings
  const [storeName, setStoreName] = useState("SOHO Fragrance");
  const [currency, setCurrency] = useState("PKR (₨)");
  const [supportEmail, setSupportEmail] = useState("support@sohofragrance.com");
  const [savingMaison, setSavingMaison] = useState(false);

  // SMTP Accounts List
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State for Add/Edit SMTP
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSenderName, setFormSenderName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPass, setFormPass] = useState("");
  const [submittingSmtp, setSubmittingSmtp] = useState(false);

  const userStr = localStorage.getItem("soho_user");
  const token = userStr ? JSON.parse(userStr).token : "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const fetchConfig = async (key: string, defaultValue: string, setter: (val: string) => void) => {
    try {
      const res = await fetch(`${apiBase}/config/${key}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const val = await res.json();
        if (val) setter(val);
      } else {
        setter(defaultValue);
      }
    } catch (err) {
      setter(defaultValue);
    }
  };

  const loadSmtpAccounts = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/smtp-accounts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSmtpAccounts(data);
      }
    } catch (err) {
      console.error("Failed to load SMTP accounts:", err);
    }
  };

  const loadAllSettings = async () => {
    setLoading(true);
    await Promise.all([
      fetchConfig("store_name", "SOHO Fragrance", setStoreName),
      fetchConfig("currency", "PKR (₨)", setCurrency),
      fetchConfig("support_email", "support@sohofragrance.com", setSupportEmail),
      loadSmtpAccounts()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  const saveConfigKey = async (key: string, value: string) => {
    const res = await fetch(`${apiBase}/config/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ value })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Failed to save ${key}`);
    }
  };

  const handleSaveMaison = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMaison(true);
    setMessage(null);
    try {
      await Promise.all([
        saveConfigKey("store_name", storeName),
        saveConfigKey("currency", currency),
        saveConfigKey("support_email", supportEmail),
      ]);
      setMessage({ type: "success", text: "Maison Settings updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update Maison Settings." });
    } finally {
      setSavingMaison(false);
    }
  };

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSmtp(true);
    setMessage(null);

    const cleanPassword = formPass.replace(/\s+/g, "");

    try {
      if (editingId) {
        const res = await fetch(`${apiBase}/admin/smtp-accounts/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            senderName: formSenderName,
            email: formEmail,
            pass: cleanPassword
          })
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: "success", text: "SMTP account updated successfully." });
          setEditingId(null);
          setFormSenderName("");
          setFormEmail("");
          setFormPass("");
          loadSmtpAccounts();
        } else {
          throw new Error(data.error || "Failed to update SMTP account.");
        }
      } else {
        const res = await fetch(`${apiBase}/admin/smtp-accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            senderName: formSenderName,
            email: formEmail,
            pass: cleanPassword,
            status: smtpAccounts.length === 0 ? "Active" : "Inactive"
          })
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: "success", text: "SMTP account added successfully." });
          setFormSenderName("");
          setFormEmail("");
          setFormPass("");
          loadSmtpAccounts();
        } else {
          throw new Error(data.error || "Failed to add SMTP account.");
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setSubmittingSmtp(false);
    }
  };

  const handleActivate = async (id: string) => {
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/smtp-accounts/${id}/activate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: "success", text: "SMTP account activated successfully." });
        loadSmtpAccounts();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to activate SMTP account.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to activate SMTP account." });
    }
  };

  const handleEditInit = (account: SmtpAccount) => {
    setEditingId(account._id);
    setFormSenderName(account.senderName);
    setFormEmail(account.email);
    setFormPass(account.pass);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormSenderName("");
    setFormEmail("");
    setFormPass("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMTP profile?")) return;
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/smtp-accounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: "success", text: "SMTP account deleted successfully." });
        loadSmtpAccounts();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete SMTP account.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete SMTP account." });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-display font-semibold text-dark-text">Global Settings</h1>
        <p className="text-sm text-muted-text mt-0.5">Configure main shop defaults, contact nodes, and active SMTP gateways.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-sm text-sm border transition-all ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-text bg-white border border-cream rounded-sm">
          Loading system configurations...
        </div>
      ) : (
        <>
          {/* Row 1: SMTP Accounts Section (Left: Form, Right: List Table) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Card: Add/Edit Form */}
            <div className="bg-white border border-cream rounded-sm p-6 lg:col-span-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 border-b border-cream pb-3">
                  <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h2 className="font-display text-lg font-semibold text-dark-text">
                    {editingId ? "Edit SMTP Account" : "Add SMTP Account"}
                  </h2>
                </div>
                <p className="text-xs text-muted-text mt-1.5">Verify and save a new Gmail account.</p>

                <form onSubmit={handleSmtpSubmit} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs text-muted-text mb-1">Sender Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SOHO Fragrance"
                      value={formSenderName}
                      onChange={(e) => setFormSenderName(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-text mb-1">Gmail Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. username@gmail.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-text mb-1">Gmail App Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={formPass}
                      onChange={(e) => setFormPass(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text font-mono"
                    />
                    <span className="text-[10px] text-muted-text mt-1 block">
                      Generate a 16-character App Password under Google Account settings.
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingSmtp}
                      className="flex-1 py-3 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm disabled:opacity-50 cursor-pointer text-center"
                    >
                      {submittingSmtp ? "Processing..." : editingId ? "Update SMTP Account" : "Verify & Save SMTP"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-3 border border-cream hover:bg-ivory text-xs text-muted-text tracking-wider uppercase font-semibold rounded-sm transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right Card: Active SMTP Accounts List */}
            <div className="bg-white border border-cream rounded-sm p-6 lg:col-span-7 shadow-xs">
              <div className="flex items-center gap-2 border-b border-cream pb-3 mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="font-display text-lg font-semibold text-dark-text">Active SMTP Accounts</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-ivory border-b border-cream text-xs text-muted-text uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Gmail Address</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream text-dark-text">
                    {smtpAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-ivory/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs text-dark-text">{account.senderName}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-text">{account.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                            account.status === "Active"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {account.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {account.status === "Inactive" && (
                              <button
                                onClick={() => handleActivate(account._id)}
                                className="px-3 py-1 bg-burgundy hover:bg-espresso text-cream text-[10px] tracking-wider uppercase font-semibold transition-colors rounded-sm cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleEditInit(account)}
                              className="p-1 text-champagne hover:text-burgundy transition-colors cursor-pointer"
                              title="Edit account"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(account._id)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                              title="Delete account"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {smtpAccounts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-xs text-muted-text">
                          No SMTP profiles saved. The system will fall back to environment variables.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 2: Maison Settings & Quick SMTP Guide Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Card: Maison Settings (col-span 7) */}
            <div className="bg-white border border-cream rounded-sm p-6 lg:col-span-7 flex flex-col justify-between shadow-xs">
              <div>
                <h2 className="font-display text-lg font-semibold text-dark-text border-b border-cream pb-3">Maison Settings</h2>
                <form onSubmit={handleSaveMaison} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs text-muted-text mb-1">Maison Store Name</label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-text mb-1">System Currency Display</label>
                    <input
                      type="text"
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-muted-text mb-1">Customer Support Email Node</label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={savingMaison}
                      className="px-8 py-3 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm mt-2 disabled:opacity-50 cursor-pointer"
                    >
                      {savingMaison ? "Saving..." : "Save Maison Settings"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Card: Quick SMTP Guide (col-span 5) */}
            <div className="bg-amber-50/40 border border-amber-100 rounded-sm p-6 lg:col-span-5 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="font-display text-sm font-semibold text-amber-900 flex items-center gap-2 border-b border-amber-200/50 pb-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Quick SMTP Guide
                </h3>
                
                <ol className="mt-4 space-y-2 text-xs text-amber-800 list-decimal list-inside leading-relaxed">
                  <li>
                    <span className="font-semibold">Enable 2-Step Verification</span> on your Google account.
                  </li>
                  <li>
                    <span className="font-semibold">Create a 16-character App Password</span> in your account settings.
                  </li>
                  <li>
                    <span className="font-semibold">Paste the password</span> in the form. Spaces are automatically stripped.
                  </li>
                  <li>
                    <span className="font-semibold">Dynamic refresh</span> instantly updates without a server reboot.
                  </li>
                </ol>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
