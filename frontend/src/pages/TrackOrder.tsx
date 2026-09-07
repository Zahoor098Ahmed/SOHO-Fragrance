import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";

const statusBadges: Record<string, { label: string; color: string }> = {
  "Pending Verification": { label: "Payment Verification Pending", color: "bg-amber-100 text-amber-900 border-amber-300" },
  Pending: { label: "Order Pending", color: "bg-gray-100 text-gray-800 border-gray-300" },
  Confirmed: { label: "Order Confirmed", color: "bg-purple-100 text-purple-900 border-purple-300" },
  Processing: { label: "Processing & Blending", color: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  Packed: { label: "Packed & Ready for Dispatch", color: "bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold" },
  Shipped: { label: "Dispatched / In Transit", color: "bg-blue-100 text-blue-900 border-blue-300" },
  "Out for Delivery": { label: "Out for Delivery", color: "bg-orange-100 text-orange-900 border-orange-300" },
  Delivered: { label: "Delivered", color: "bg-green-100 text-green-900 border-green-300" },
  Cancelled: { label: "Cancelled", color: "bg-red-100 text-red-900 border-red-300" },
  Refunded: { label: "Refunded", color: "bg-pink-100 text-pink-900 border-pink-300" },
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const performTrack = async (idToSearch: string) => {
    if (!idToSearch) return;
    setLoading(true);
    setSearched(true);
    const searchId = idToSearch.toUpperCase().trim();

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/orders/track/${encodeURIComponent(searchId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No order found.");
      }
      setTrackingInfo(data);
    } catch (err) {
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId) {
      setOrderId(urlId);
      performTrack(urlId);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performTrack(orderId);
  };

  const currentBadge = trackingInfo ? (statusBadges[trackingInfo.status] || { label: trackingInfo.status, color: "bg-gray-100 text-gray-800 border-gray-300" }) : null;

  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="hero-gradient py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Tracking</p>
          <h1 className="font-display text-4xl lg:text-6xl text-cream font-light leading-tight">
            Track Your Order
          </h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-cream p-8 rounded-lg mb-8 border border-cream shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs uppercase tracking-wider text-muted-text mb-2 font-semibold" htmlFor="order-id">
                Order ID or Tracking Number
              </label>
              <input
                required
                id="order-id"
                type="text"
                placeholder="e.g. #ORD-2666"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-3 bg-ivory border border-champagne/30 focus:border-champagne outline-none transition-colors text-sm text-dark-text rounded-sm font-mono-custom"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3.5 bg-burgundy hover:bg-espresso text-cream text-xs uppercase tracking-[0.2em] font-semibold transition-colors rounded-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "Searching..." : "Track Status"}
            </button>
          </form>
        </div>

        {searched && trackingInfo && (
          <div className="bg-cream p-8 rounded-lg border border-cream shadow-sm animate-fade-in">
            {/* Top Order Information Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-champagne/20 pb-5">
              <div>
                <span className="text-xs text-muted-text uppercase tracking-wider block">Order ID</span>
                <span className="text-xl font-bold font-mono-custom text-burgundy">{trackingInfo.id}</span>
              </div>
              
              <div>
                <span className="text-xs text-muted-text uppercase tracking-wider block mb-1">Current Status</span>
                {currentBadge && (
                  <span className={`inline-block px-3 py-1 rounded text-xs tracking-wider border ${currentBadge.color}`}>
                    {currentBadge.label}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-muted-text uppercase tracking-wider block">Estimated Delivery</span>
                <span className="text-base font-semibold text-dark-text">{trackingInfo.estimatedDelivery}</span>
              </div>
            </div>

            {/* Cancelled Notice Banner if applicable */}
            {trackingInfo.status === "Cancelled" && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
                <strong>Order Cancelled:</strong> This order has been cancelled. If you believe this is an error or need assistance with a refund, please contact customer support.
              </div>
            )}

            {/* Tracking Steps Timeline */}
            <div className="space-y-8 relative pl-2">
              <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-champagne/30" />
              {trackingInfo.steps.map((step: any, idx: number) => {
                const isCurrentActiveStep = step.done && (idx === trackingInfo.steps.length - 1 || !trackingInfo.steps[idx + 1]?.done);

                return (
                  <div key={idx} className="flex gap-6 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        step.done
                          ? "bg-burgundy text-cream ring-4 ring-burgundy/10"
                          : "bg-ivory border border-champagne/45 text-muted-text"
                      }`}
                    >
                      {step.done ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className={`font-semibold text-sm ${step.done ? "text-dark-text font-display text-base" : "text-muted-text"}`}>
                          {step.label}
                        </h3>
                        {isCurrentActiveStep && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-burgundy/10 text-burgundy border border-burgundy/20">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-text mt-1 leading-relaxed">{step.desc}</p>
                      <span className="text-[11px] text-muted-text/60 mt-1 block font-mono-custom">
                        {step.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Parcel Details & Manifest Summary */}
            {trackingInfo.items && (
              <div className="mt-8 pt-6 border-t border-champagne/20">
                <h4 className="text-xs uppercase tracking-widest text-muted-text font-bold mb-3">
                  Verified Parcel Contents & Order Summary
                </h4>
                <div className="bg-ivory/80 rounded border border-champagne/20 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-champagne/15 pb-2.5">
                    <span className="text-xs text-muted-text">Items in Consignment:</span>
                    <span className="text-sm font-semibold text-dark-text">{trackingInfo.items}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-text block">Destination:</span>
                      <span className="font-semibold text-dark-text">{trackingInfo.city || "Pakistan"}</span>
                    </div>
                    <div>
                      <span className="text-muted-text block">Payment Mode:</span>
                      <span className="font-semibold text-dark-text">{trackingInfo.payment || "COD"}</span>
                    </div>
                    <div>
                      <span className="text-muted-text block">Total Order Value:</span>
                      <span className="font-bold text-burgundy font-mono-custom text-sm">
                        Rs. {Number(trackingInfo.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {searched && !trackingInfo && !loading && (
          <div className="text-center py-12 bg-cream rounded-lg text-muted-text border border-cream shadow-sm">
            <p className="text-sm">No order found with ID <strong>{orderId}</strong>.</p>
            <p className="text-xs text-muted-text/70 mt-1">Please check your tracking number and try again (e.g. #ORD-2666).</p>
          </div>
        )}
      </section>
    </div>
  );
}
