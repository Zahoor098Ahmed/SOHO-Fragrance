import { useState, useEffect } from "react";

interface BannerData {
  _id?: string;
  title?: string;
  message: string;
  link: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
}

export default function AnnouncementBannerSettings() {
  const [banner, setBanner] = useState<BannerData>({
    title: "Complimentary Delivery",
    message: "Complimentary nationwide delivery on orders above Rs. 5,000 | Handcrafted in Pakistan",
    link: "/collection",
    bgColor: "#1A1008",
    textColor: "#E8D8C8",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userStr = localStorage.getItem("soho_user");
  const token = userStr ? JSON.parse(userStr).token : "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const loadBanner = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/banners/active`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setBanner({
            _id: data._id,
            title: data.title || "Complimentary Delivery",
            message: data.message || "",
            link: data.link || "/collection",
            bgColor: data.bgColor || "#1A1008",
            textColor: data.textColor || "#E8D8C8",
            isActive: data.isActive !== undefined ? data.isActive : true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load banner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanner();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiBase}/banners/active`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(banner),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update banner.");

      setMessage({ type: "success", text: "Announcement banner updated in database and active across website." });
      
      // Dispatch event to instantly update active Navbar across the client app
      window.dispatchEvent(new Event("banner-updated"));

      // Cross-tab auto-sync via localStorage and BroadcastChannel
      try {
        localStorage.setItem("soho_banner_sync", Date.now().toString());
        const channel = new BroadcastChannel("soho_sync_channel");
        channel.postMessage("banner-updated");
        channel.close();
      } catch (_) {}
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update announcement banner." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-cream rounded-sm p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-dark-text flex items-center gap-2">
            <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Top Announcement Bar & Promotional Banner
          </h2>
          <p className="text-xs text-muted-text mt-0.5">
            Customize the message, link, and appearance of the banner displayed at the very top of the website.
          </p>
        </div>
        <button
          type="button"
          onClick={loadBanner}
          className="text-xs text-burgundy hover:text-espresso font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reload
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-sm text-xs border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-muted-text">Loading banner configuration...</div>
      ) : (
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* Live Preview */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-text font-semibold mb-2">Live Storefront Preview</label>
            <div
              style={{
                backgroundColor: banner.bgColor || "#1A1008",
                color: banner.textColor || "#E8D8C8",
              }}
              className="py-2.5 px-4 text-center text-xs tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-2 rounded-sm border border-champagne/20 transition-all"
            >
              <span>{banner.message || "Your announcement message will appear here..."}</span>
              {banner.link && (
                <span className="underline underline-offset-2 font-bold ml-1">
                  Explore →
                </span>
              )}
            </div>
            {!banner.isActive && (
              <p className="text-[11px] text-amber-700 font-medium mt-1">⚠️ The banner is currently disabled and hidden from the storefront.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-muted-text mb-1">Banner Announcement Message</label>
              <textarea
                required
                rows={2}
                value={banner.message}
                onChange={(e) => setBanner({ ...banner, message: e.target.value })}
                placeholder="e.g. Complimentary nationwide delivery on orders above Rs. 5,000 | Handcrafted in Pakistan"
                className="w-full px-3 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-text mb-1">Explore Button Link</label>
              <input
                type="text"
                value={banner.link}
                onChange={(e) => setBanner({ ...banner, link: e.target.value })}
                placeholder="/collection"
                className="w-full px-3 py-2 text-sm border border-cream focus:border-champagne bg-ivory outline-none rounded-sm transition-colors text-dark-text"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banner.isActive}
                  onChange={(e) => setBanner({ ...banner, isActive: e.target.checked })}
                  className="w-4 h-4 text-burgundy rounded-xs focus:ring-burgundy"
                />
                <span className="text-xs font-semibold text-dark-text">Enable Banner on Storefront</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-muted-text mb-1">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={banner.bgColor}
                  onChange={(e) => setBanner({ ...banner, bgColor: e.target.value })}
                  className="w-9 h-9 p-0.5 border border-cream rounded-sm cursor-pointer"
                />
                <input
                  type="text"
                  value={banner.bgColor}
                  onChange={(e) => setBanner({ ...banner, bgColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-cream focus:border-champagne bg-ivory outline-none rounded-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-text mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={banner.textColor}
                  onChange={(e) => setBanner({ ...banner, textColor: e.target.value })}
                  className="w-9 h-9 p-0.5 border border-cream rounded-sm cursor-pointer"
                />
                <input
                  type="text"
                  value={banner.textColor}
                  onChange={(e) => setBanner({ ...banner, textColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-cream focus:border-champagne bg-ivory outline-none rounded-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving to Database..." : "Save Announcement Banner"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
