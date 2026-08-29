import { useState } from "react";
import { Link } from "react-router";

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const searchId = orderId.toUpperCase().trim();

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
    }
  };

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
        <div className="bg-cream p-8 rounded-lg mb-8 border border-cream">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs uppercase tracking-wider text-muted-text mb-2 font-semibold" htmlFor="order-id">Order ID or Tracking Number</label>
              <input
                required
                id="order-id"
                type="text"
                placeholder="e.g. ORD-1045"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-3 bg-ivory border border-champagne/20 focus:border-champagne outline-none transition-colors text-sm text-dark-text rounded-sm font-mono-custom"
              />
            </div>
            <button type="submit" className="w-full md:w-auto px-8 py-3.5 bg-burgundy hover:bg-espresso text-cream text-xs uppercase tracking-[0.2em] font-semibold transition-colors rounded-sm cursor-pointer">
              Track Status
            </button>
          </form>
        </div>

        {searched && trackingInfo && (
          <div className="bg-cream p-8 rounded-lg border border-cream">
            <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-champagne/20 pb-4">
              <div>
                <span className="text-xs text-muted-text uppercase tracking-wider block">Order ID</span>
                <span className="text-lg font-bold font-mono-custom text-burgundy">{trackingInfo.id}</span>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="text-xs text-muted-text uppercase tracking-wider block">Estimated Delivery</span>
                <span className="text-lg font-semibold text-dark-text">{trackingInfo.estimatedDelivery}</span>
              </div>
            </div>

            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-champagne/20" />
              {trackingInfo.steps.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-6 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-burgundy text-cream" : "bg-ivory border border-champagne/45 text-muted-text"}`}>
                    {step.done ? "✓" : idx + 1}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${step.done ? "text-dark-text" : "text-muted-text"}`}>{step.label}</h3>
                    <p className="text-sm text-muted-text mt-1">{step.desc}</p>
                    <span className="text-xs text-muted-text/60 mt-1 block font-mono-custom">{step.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && !trackingInfo && (
          <div className="text-center py-12 bg-cream rounded-lg text-muted-text border border-cream">
            No order found. Please verify your Order ID and try again.
          </div>
        )}
      </section>
    </div>
  );
}
