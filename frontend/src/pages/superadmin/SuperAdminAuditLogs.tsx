import { useState } from "react";

export default function SuperAdminAuditLogs() {
  const [logs] = useState([
    { id: "LOG-928", action: "Updated Scent Profile recommendation algs", by: "Kamran Khan", role: "Super Admin", time: "Aug 24, 2026, 11:42 AM", ip: "192.168.1.1" },
    { id: "LOG-927", action: "Bulk adjusted prices for Unisex Collection", by: "Fatima Shah", role: "Admin", time: "Aug 24, 2026, 10:15 AM", ip: "192.168.1.14" },
    { id: "LOG-926", action: "Approved review #R-920", by: "Fatima Shah", role: "Admin", time: "Aug 23, 2026, 05:40 PM", ip: "192.168.1.14" },
    { id: "LOG-925", action: "Updated stock level for VELORÉN 50ml", by: "Ali Akber", role: "Content Admin", time: "Aug 23, 2026, 02:30 PM", ip: "192.168.2.22" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-dark-text">Audit Logs</h1>
        <p className="text-sm text-muted-text mt-0.5">Track all modifications, configuration updates, and admin operations.</p>
      </div>

      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream text-xs text-muted-text tracking-wider">
                <th className="text-left px-6 py-4 font-normal uppercase">Log ID</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Operation / Action</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Performed By</th>
                <th className="text-left px-6 py-4 font-normal uppercase">Date & Time</th>
                <th className="text-left px-6 py-4 font-normal uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-burgundy font-medium">{log.id}</td>
                  <td className="px-6 py-4 font-medium text-dark-text">{log.action}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark-text">{log.by}</p>
                    <p className="text-[10px] text-muted-text">{log.role}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-text">{log.time}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-text/70">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
