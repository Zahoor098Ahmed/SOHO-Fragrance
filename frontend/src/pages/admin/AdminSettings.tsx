import { useState, useEffect } from "react";
import AnnouncementBannerSettings from "../../components/AnnouncementBannerSettings";

interface AdminSelfCredential {
  _id: string;
  name: string;
  email: string;
  role: string;
  displayPassword?: string;
  createdAt?: string;
}

export default function AdminSettings() {
  const userStr = localStorage.getItem("soho_user");
  const storedUser = userStr ? JSON.parse(userStr) : null;
  const token = storedUser?.token || "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const [me, setMe] = useState<AdminSelfCredential | null>(() => {
    if (storedUser) {
      return {
        _id: storedUser.id || storedUser.userId || "",
        name: storedUser.name || "Admin",
        email: storedUser.email || "admin@soho.com",
        role: storedUser.role || "admin",
        displayPassword: "••••••••",
      };
    }
    return null;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password update form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadMyCredentials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.admins && data.admins.length > 0) {
          setMe(data.admins[0]);
        }
      } else {
        const data = await res.json();
        // If error, keep existing state if available
        if (!me) {
          setMessage({ type: "error", text: data.error || "Failed to load credentials." });
        }
      }
    } catch (err) {
      if (!me) {
        setMessage({ type: "error", text: "Connection error loading profile." });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyCredentials();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setUpdating(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/credentials/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: me._id,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");

      setMessage({ type: "success", text: "Your password has been successfully updated in the database." });
      setNewPassword("");
      setConfirmPassword("");
      await loadMyCredentials();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!me) return;
    if (!confirm("Are you sure you want to generate a new secure password for your account?")) return;
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/credentials/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: me._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      setMessage({ type: "success", text: `Password reset successfully. New Password: ${data.newPassword}` });
      await loadMyCredentials();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to reset password." });
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Admin Settings & Security</h1>
          <p className="text-sm text-muted-text mt-0.5">
            Manage your administrative credentials, view current password, update password, and customize storefront banner.
          </p>
        </div>
        <button
          type="button"
          onClick={loadMyCredentials}
          className="text-xs text-burgundy hover:text-espresso font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-sm text-sm border transition-all ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Row 1: Profile & Credentials (Left: Current Info & Password, Right: Change Password Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Left Card: Current Admin Profile & Password */}
        <div className="bg-white border border-cream rounded-sm p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-cream">
              <h2 className="font-display text-base font-semibold text-dark-text flex items-center gap-2">
                <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Admin Profile & Current Password
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-champagne/40 text-dark-text px-2 py-0.5 rounded-xs font-semibold">
                {me?.role || "Admin"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-text mb-1">Full Name</label>
                <div className="text-sm font-semibold text-dark-text bg-ivory border border-cream px-3.5 py-2.5 rounded-sm">
                  {me?.name || "Administrator"}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-text mb-1">Email Address</label>
                <div className="text-sm font-mono text-dark-text bg-ivory border border-cream px-3.5 py-2.5 rounded-sm">
                  {me?.email || "admin@soho.com"}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-text mb-1">Current Password</label>
                <div className="bg-ivory border border-cream px-3.5 py-2.5 rounded-sm flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-burgundy">
                    {showPassword ? (me?.displayPassword || "admin123") : "••••••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-text hover:text-dark-text text-xs p-1 cursor-pointer flex items-center gap-1.5"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    <span className="text-[11px] text-muted-text font-sans">{showPassword ? "Hide" : "Show"}</span>
                    {showPassword ? (
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
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-cream">
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full py-2.5 px-4 border border-burgundy/30 text-burgundy hover:bg-burgundy/10 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              Reset / Auto-Generate Password
            </button>
          </div>
        </div>

        {/* Right Card: Change Password Form */}
        <div className="bg-white border border-cream rounded-sm p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-cream">
              <h2 className="font-display text-base font-semibold text-dark-text flex items-center gap-2">
                <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Admin Password
              </h2>
              <p className="text-xs text-muted-text mt-0.5">
                Update your administrative login password. Minimum 6 characters required.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-text mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-text mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2.5 px-4 bg-burgundy hover:bg-espresso text-cream text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updating ? "Saving to Database..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-cream text-[11px] text-muted-text leading-relaxed">
            <span className="font-semibold text-dark-text">Security Note:</span> Your password grants administrative access to manage products, pricing, orders, and storefront settings.
          </div>
        </div>
      </div>

      {/* Row 2: Announcement Banner Settings */}
      <div className="w-full">
        <AnnouncementBannerSettings />
      </div>
    </div>
  );
}
