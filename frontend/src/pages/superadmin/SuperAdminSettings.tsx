import { useState, useEffect } from "react";
import AnnouncementBannerSettings from "../../components/AnnouncementBannerSettings";

interface SmtpAccount {
  _id: string;
  senderName: string;
  email: string;
  status: "Active" | "Inactive";
  pass: string;
}

interface AdminCredential {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  displayPassword?: string;
  createdAt?: string;
}

export default function SuperAdminSettings() {
  // Administrative Credentials
  const [superAdmins, setSuperAdmins] = useState<AdminCredential[]>([]);
  const [admins, setAdmins] = useState<AdminCredential[]>([]);
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});
  const [targetUserModal, setTargetUserModal] = useState<AdminCredential | null>(null);
  const [modalNewPass, setModalNewPass] = useState("");
  const [modalConfirmPass, setModalConfirmPass] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const loadCredentials = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/credentials`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuperAdmins(data.superAdmins || []);
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error("Failed to load admin credentials:", err);
    }
  };

  const loadAllSettings = async () => {
    setLoading(true);
    await Promise.all([
      fetchConfig("store_name", "SOHO Fragrance", setStoreName),
      fetchConfig("currency", "PKR (₨)", setCurrency),
      fetchConfig("support_email", "support@sohofragrance.com", setSupportEmail),
      loadSmtpAccounts(),
      loadCredentials()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  const togglePassVisibility = (id: string) => {
    setShowPassMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserModal) return;
    if (modalNewPass.length < 6) {
      setCredMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (modalNewPass !== modalConfirmPass) {
      setCredMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setModalLoading(true);
    setCredMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/credentials/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId: targetUserModal._id,
          newPassword: modalNewPass
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");
      setCredMessage({ type: "success", text: data.message || "Password updated successfully." });
      setTargetUserModal(null);
      setModalNewPass("");
      setModalConfirmPass("");
      await loadCredentials();
    } catch (err: any) {
      setCredMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async (target: AdminCredential) => {
    if (!confirm(`Are you sure you want to reset password for ${target.name} (${target.email})?`)) return;
    setCredMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/credentials/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: target._id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      setCredMessage({ type: "success", text: `${data.message} New Temporary Password: ${data.newPassword}` });
      await loadCredentials();
    } catch (err: any) {
      setCredMessage({ type: "error", text: err.message || "Failed to reset password." });
    }
  };

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

          {/* Row 3: Top Announcement Bar & Promotional Banner */}
          <div className="mt-6">
            <AnnouncementBannerSettings />
          </div>

          {/* Row 4: Administrative Credentials & Password Management */}
          <div className="bg-white border border-cream rounded-sm p-6 shadow-xs mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-dark-text flex items-center gap-2">
                  <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Administrative Credentials & Password Management
                </h2>
                <p className="text-xs text-muted-text mt-0.5">
                  View and manage login credentials for Super Admin and Administrators. Reset or update passwords instantly.
                </p>
              </div>
              <button
                onClick={loadCredentials}
                className="text-xs text-burgundy hover:text-espresso font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Credentials
              </button>
            </div>

            {credMessage && (
              <div className={`mt-4 p-3 rounded-sm text-xs border ${credMessage.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {credMessage.text}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
              {/* Left Column: Super Admin Master Account */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-burgundy bg-burgundy/10 px-2.5 py-1 rounded-xs">
                    Super Admin Master Account
                  </span>
                </div>
                <div className="space-y-4">
                  {superAdmins.map((sa) => {
                    const isVisible = !!showPassMap[sa._id];
                    return (
                      <div key={sa._id} className="p-5 rounded-sm border border-burgundy/20 bg-burgundy/5 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-base text-dark-text">{sa.name}</span>
                              <div className="text-xs text-muted-text mt-0.5 font-mono">{sa.email}</div>
                            </div>
                            <span className="text-[10px] font-mono uppercase bg-burgundy text-cream px-2 py-0.5 rounded-xs font-semibold">Super Admin</span>
                          </div>

                          <div className="mt-4 p-3 bg-white border border-cream rounded-sm flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-muted-text font-semibold">Current Password</span>
                              <span className="font-mono text-base font-semibold text-burgundy">
                                {isVisible ? (sa.displayPassword || "superadmin123@123") : "••••••••••••"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePassVisibility(sa._id)}
                              className="text-muted-text hover:text-dark-text text-xs p-1.5 cursor-pointer flex items-center gap-1"
                              title={isVisible ? "Hide Password" : "Show Password"}
                            >
                              <span className="text-[11px] text-muted-text font-sans">{isVisible ? "Hide" : "Show"}</span>
                              {isVisible ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-cream/80 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUserModal(sa);
                              setModalNewPass("");
                              setModalConfirmPass("");
                              setCredMessage(null);
                            }}
                            className="flex-1 py-2 px-3 bg-burgundy hover:bg-espresso text-cream text-xs font-semibold rounded-sm transition-colors cursor-pointer tracking-wider uppercase"
                          >
                            Change Password
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(sa)}
                            className="py-2 px-4 border border-burgundy/30 text-burgundy hover:bg-burgundy/10 text-xs font-semibold rounded-sm transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Administrator Accounts */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-dark-text bg-cream/70 px-2.5 py-1 rounded-xs">
                    Administrator Accounts ({admins.length})
                  </span>
                </div>

                {admins.length === 0 ? (
                  <p className="text-xs text-muted-text italic py-8 text-center bg-ivory border border-cream rounded-sm">
                    No regular administrator accounts registered.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {admins.map((adm) => {
                      const isVisible = !!showPassMap[adm._id];
                      return (
                        <div key={adm._id} className="p-5 rounded-sm border border-cream bg-ivory/50 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-base text-dark-text">{adm.name}</span>
                                <div className="text-xs text-muted-text mt-0.5 font-mono">{adm.email}</div>
                              </div>
                              <span className="text-[10px] font-mono uppercase bg-champagne/40 text-dark-text px-2 py-0.5 rounded-xs font-semibold">Admin</span>
                            </div>

                            <div className="mt-4 p-3 bg-white border border-cream rounded-sm flex items-center justify-between">
                              <div>
                                <span className="block text-[10px] uppercase tracking-wider text-muted-text font-semibold">Password</span>
                                <span className="font-mono text-base font-semibold text-dark-text">
                                  {isVisible ? (adm.displayPassword || "admin123") : "••••••••••••"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => togglePassVisibility(adm._id)}
                                className="text-muted-text hover:text-dark-text text-xs p-1.5 cursor-pointer flex items-center gap-1"
                                title={isVisible ? "Hide Password" : "Show Password"}
                              >
                                <span className="text-[11px] text-muted-text font-sans">{isVisible ? "Hide" : "Show"}</span>
                                {isVisible ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-cream flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetUserModal(adm);
                                setModalNewPass("");
                                setModalConfirmPass("");
                                setCredMessage(null);
                              }}
                              className="flex-1 py-2 px-3 bg-dark-text hover:bg-burgundy text-cream text-xs font-semibold rounded-sm transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              Change Password
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(adm)}
                              className="py-2 px-3 border border-cream text-muted-text hover:text-burgundy hover:border-burgundy text-xs font-semibold rounded-sm transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal for Changing Password */}
          {targetUserModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-sm border border-cream max-w-md w-full p-6 shadow-xl relative animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setTargetUserModal(null)}
                  className="absolute top-4 right-4 text-muted-text hover:text-dark-text text-lg cursor-pointer"
                >
                  ✕
                </button>
                <div className="mb-4">
                  <h3 className="font-display text-lg font-semibold text-dark-text">Change Password</h3>
                  <p className="text-xs text-muted-text mt-1">
                    Set a new password for <span className="font-semibold text-burgundy">{targetUserModal.name}</span> ({targetUserModal.email}).
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted-text mb-1">New Password (min. 6 characters)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={modalNewPass}
                      onChange={(e) => setModalNewPass(e.target.value)}
                      placeholder="Enter new secure password"
                      className="w-full px-3 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-text mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={modalConfirmPass}
                      onChange={(e) => setModalConfirmPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTargetUserModal(null)}
                      className="px-4 py-2 text-xs border border-cream text-muted-text hover:text-dark-text rounded-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-5 py-2 bg-burgundy hover:bg-espresso text-cream text-xs font-semibold rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {modalLoading ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
