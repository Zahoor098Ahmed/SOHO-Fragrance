import { useState, useEffect } from "react";

interface AuditLogItem {
  id?: string;
  logId?: string;
  action: string;
  by?: string;
  performedBy?: string;
  role: string;
  targetResource?: string;
  time?: string;
  createdAt?: string;
  ip?: string;
  ipAddress?: string;
}

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("soho_user");
      const authUser = userStr ? JSON.parse(userStr) : null;
      const token = authUser ? authUser.token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/admin/audit-logs?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to fetch audit records.");
      }

      const data = await res.json();
      const loadedLogs = Array.isArray(data) ? data : Array.isArray(data.logs) ? data.logs : [];
      setLogs(loadedLogs);
    } catch (err: any) {
      console.error("Audit log error:", err);
      setError(err.message || "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Audit Logs</h1>
          <p className="text-sm text-muted-text mt-0.5">
            Track all modifications, configuration updates, and admin operations recorded in MongoDB Atlas.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-burgundy/10 hover:bg-burgundy/20 text-burgundy text-xs font-semibold tracking-wider rounded-sm transition-colors cursor-pointer flex items-center gap-2"
        >
          <span>{loading ? "Refreshing..." : "↻ Refresh Logs"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-cream rounded-sm overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream text-xs text-muted-text tracking-wider bg-ivory/40">
                <th className="text-left px-6 py-4 font-normal uppercase">Log ID</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Operation / Action</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Resource</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Performed By</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Date & Time</th>
                <th className="text-left px-6 py-4 font-normal uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-muted-text">
                    Fetching live audit trail from Atlas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-muted-text">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const logId = log.logId || log.id || `LOG-${idx + 1000}`;
                  const performer = log.performedBy || log.by || "System Admin";
                  const role = log.role || "Admin";
                  const resource = log.targetResource || "System";
                  const timestamp = log.time || (log.createdAt ? new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent");
                  const ip = log.ipAddress || log.ip || "127.0.0.1";

                  return (
                    <tr key={logId} className="hover:bg-ivory/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-burgundy font-medium">
                        {logId}
                      </td>
                      <td className="px-6 py-4 font-medium text-dark-text max-w-xs sm:max-w-md">
                        {log.action}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-champagne/20 text-burgundy border border-champagne/40">
                          {resource}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-dark-text">{performer}</p>
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[9px] rounded font-semibold uppercase tracking-wider ${
                            role.toLowerCase().includes("super")
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-text whitespace-nowrap">
                        {timestamp}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-text/70">
                        {ip}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
