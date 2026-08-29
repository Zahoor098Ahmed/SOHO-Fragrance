import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userStr = localStorage.getItem("soho_user");
  const token = userStr ? JSON.parse(userStr).token : "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/admin/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 10 seconds (real-time order updates)
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/notifications/mark-read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setIsOpen(false);
    if (!notification.isRead) {
      try {
        await fetch(`${apiBase}/admin/notifications/${notification._id}/read`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        });
        setNotifications(notifications.map((n) => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error(err);
      }
    }
    
    // Redirect admin or superadmin correctly based on current view
    const isSuperAdminView = window.location.pathname.startsWith("/superadmin");
    const linkTarget = isSuperAdminView 
      ? notification.link.replace("/admin", "/superadmin") 
      : notification.link;

    navigate(linkTarget);
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      const res = await fetch(`${apiBase}/admin/notifications`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-full text-muted-text hover:text-burgundy hover:bg-ivory transition-colors relative cursor-pointer focus:outline-none"
        aria-label="View notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white rounded-full flex items-center justify-center px-1 text-[9px] font-bold border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-white border border-cream rounded-sm shadow-lg overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-ivory border-b border-cream flex items-center justify-between">
            <span className="text-xs font-semibold text-dark-text tracking-wider uppercase">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-champagne hover:text-burgundy hover:underline font-semibold"
              >
                Mark read
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-cream">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-text">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-ivory/40 transition-colors ${
                    !n.isRead ? "bg-burgundy/[0.02]" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      n.type === "order" ? "bg-green-50 text-green-700" : "bg-champagne/10 text-champagne"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {n.type === "order" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </span>
                  </div>

                  {/* Text Message */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold font-display text-dark-text ${!n.isRead ? "font-bold" : ""}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-muted-text mt-0.5 leading-relaxed break-words">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-muted-text/80 mt-1 block">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Unread indicator */}
                  {!n.isRead && (
                    <div className="flex-shrink-0 self-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full block" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-cream bg-ivory flex justify-center">
              <button
                onClick={handleClearAll}
                className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-semibold"
              >
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
