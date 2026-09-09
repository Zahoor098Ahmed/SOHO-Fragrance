import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useStore } from "../store/store";
import NotificationBell from "../components/NotificationBell";

const saNav = [
  { label: "Dashboard", href: "/superadmin" },
  { label: "Admin Management", href: "/superadmin/admins" },
  { label: "Roles & Permissions", href: "/superadmin/roles" },
  { label: "Products", href: "/superadmin/products" },
  { label: "Orders", href: "/superadmin/orders" },
  { label: "Users", href: "/superadmin/users" },
  { label: "Customers", href: "/superadmin/customers" },
  { label: "Inventory", href: "/superadmin/inventory" },
  { label: "Reviews", href: "/superadmin/reviews" },
  { label: "Payments", href: "/superadmin/payments" },
  { label: "Shipping", href: "/superadmin/shipping" },
  { label: "Analytics", href: "/superadmin/analytics" },
  { label: "Security", href: "/superadmin/security" },
  { label: "Audit Logs", href: "/superadmin/audit-logs" },
  { label: "Settings", href: "/superadmin/settings" },
];

export default function SuperAdminLayout() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const displayName = "Super Admin";
  const userInitials = "SA";

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  return (
    <div className="h-screen bg-ivory flex overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-dark-text/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-espresso flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-cream/10">
          <div className="text-lg tracking-[0.15em] text-cream font-display font-semibold leading-none">SOHO</div>
          <div className="text-[8px] tracking-[0.35em] text-champagne font-light mt-0.5">SUPER ADMIN</div>
          <div className="mt-2 px-2 py-0.5 bg-champagne/10 rounded text-[9px] text-champagne tracking-widest inline-block">
            PRIVILEGED ACCESS
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {saNav.map((item) => {
            const active = location.pathname === item.href || (item.href !== "/superadmin" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-6 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-burgundy/30 text-champagne border-r-2 border-champagne"
                    : "text-cream/60 hover:text-cream hover:bg-cream/5"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-cream/10 space-y-3">
          <Link to="/" className="block text-xs text-champagne/60 hover:text-champagne transition-colors tracking-wider">
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors tracking-wider uppercase font-semibold"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 bg-ivory border-b border-cream flex items-center px-6 gap-4">
          <button className="lg:hidden text-muted-text hover:text-dark-text" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xs text-muted-text tracking-widest">SUPER ADMIN CONSOLE</span>
          <div className="flex-1" />
          <Link to="/" className="text-xs text-muted-text hover:text-burgundy transition-colors tracking-wider mr-2">
            View Store
          </Link>
          <div className="mr-2">
            <NotificationBell />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-burgundy flex items-center justify-center text-cream text-xs font-semibold shadow-xs" title={displayName}>
              {userInitials}
            </div>
            <span className="text-xs font-semibold text-dark-text tracking-wide hidden sm:inline">{displayName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
