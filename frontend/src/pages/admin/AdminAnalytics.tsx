import React, { useState, useEffect, useCallback } from "react";
import { useBrandStats } from "../../context/BrandStatsContext";

interface AnalyticsData {
  stats: {
    revenue: number;
    revenueChange: string;
    revenuePositive: boolean;
    orders: number;
    ordersChange: string;
    ordersPositive: boolean;
    aov: number;
    aovChange: string;
    aovPositive: boolean;
    conversionRate: string;
    conversionChange: string;
    conversionPositive: boolean;
  };
  chartData: { label: string; value: number }[];
  bestFragrances: { name: string; sales: number; revenue: number }[];
  demographics: { label: string; percent: number; color: string }[];
}

const ALL_CATALOG_PERFUMES = [
  { id: "01", name: "VELORÉN", defaultOffset: 380 },
  { id: "12", name: "SOVÉRANE", defaultOffset: 350 },
  { id: "02", name: "NOIRVÉA", defaultOffset: 340 },
  { id: "07", name: "ÉLVARO NOIR", defaultOffset: 290 },
  { id: "03", name: "AURÉVON", defaultOffset: 270 },
  { id: "04", name: "OMBRÉLIS", defaultOffset: 260 },
  { id: "06", name: "RAVÉLIEN", defaultOffset: 240 },
  { id: "10", name: "VÉNDRIS", defaultOffset: 220 },
  { id: "05", name: "SÉLVARO", defaultOffset: 200 },
  { id: "08", name: "CALVÉRÉ", defaultOffset: 170 },
  { id: "11", name: "ALVÉRION", defaultOffset: 150 },
  { id: "09", name: "ORVÉSSA", defaultOffset: 130 },
];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "12months">("30days");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Brand Stats Context (User-facing social proof & editable metrics)
  const {
    stats: brandStats,
    refreshStats: refreshBrandStats,
    updateStats: updateBrandStats,
  } = useBrandStats();

  // Edit Brand Stats Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    baseCustomers: 1000,
    baseRepeatCustomers: 700,
    baseBottlesSold: 3000,
    productOffsets: {} as Record<string, number>,
  });
  const [savingBrandStats, setSavingBrandStats] = useState(false);
  const [brandStatsAlert, setBrandStatsAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const userStr = localStorage.getItem("soho_user");
  const token = userStr ? JSON.parse(userStr).token : "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const fetchAnalytics = useCallback(
    async (showFullLoader = true) => {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const res = await fetch(`${apiBase}/admin/analytics?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLastUpdated(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [timeRange, token, apiBase]
  );

  // Initial load on timeRange change
  useEffect(() => {
    fetchAnalytics(true);
    refreshBrandStats();

    // Auto-sync every 30 seconds so newly placed customer orders reflect automatically
    const interval = setInterval(() => {
      fetchAnalytics(false);
      refreshBrandStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshBrandStats]);

  const handleOpenEditModal = () => {
    const offsets: Record<string, number> = {};
    ALL_CATALOG_PERFUMES.forEach((p) => {
      offsets[p.id] =
        brandStats.productOffsets?.[p.id] ??
        brandStats.productOffsets?.[p.name] ??
        p.defaultOffset;
    });

    setEditForm({
      baseCustomers: brandStats.baseCustomers ?? 1000,
      baseRepeatCustomers: brandStats.baseRepeatCustomers ?? 700,
      baseBottlesSold: brandStats.baseBottlesSold ?? 3000,
      productOffsets: offsets,
    });
    setBrandStatsAlert(null);
    setEditModalOpen(true);
  };

  const handleOffsetChange = (id: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setEditForm((prev) => {
      const updated = { ...prev.productOffsets, [id]: num };
      // Dynamically calculate new total base bottles sold
      const sumBottles = Object.values(updated).reduce((sum, v) => sum + v, 0);
      return {
        ...prev,
        productOffsets: updated,
        baseBottlesSold: sumBottles > 0 ? sumBottles : prev.baseBottlesSold,
      };
    });
  };

  const handleSaveBrandStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBrandStats(true);
    setBrandStatsAlert(null);

    const res = await updateBrandStats(editForm);
    setSavingBrandStats(false);

    if (res.success) {
      setBrandStatsAlert({
        type: "success",
        message: res.message || "Brand statistics successfully updated and live!",
      });
      setTimeout(() => {
        setEditModalOpen(false);
        setBrandStatsAlert(null);
      }, 1200);
    } else {
      setBrandStatsAlert({
        type: "error",
        message: res.error || "Failed to update brand statistics.",
      });
    }
  };

  // Calculate dynamic max value for bar scaling
  const chartValues = data?.chartData.map((d) => d.value) || [];
  const maxVal = chartValues.length > 0 ? Math.max(...chartValues, 10) : 100;

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">
              Analytics & Performance
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-muted-text mt-1">
            Real-time sales metrics, revenue growth, customer stats, and fragrance performance aggregated from live orders.
            {lastUpdated && (
              <span className="ml-1 text-[11px] text-espresso/70 font-mono">
                • Updated {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchAnalytics(false);
              refreshBrandStats();
            }}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dark-text border border-cream hover:border-champagne rounded-sm bg-white cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh analytics from latest orders"
          >
            <svg
              className={`w-3.5 h-3.5 text-burgundy ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline font-medium">Refresh</span>
          </button>

          {/* Time Range Selector */}
          <div className="flex gap-1.5 bg-cream/40 p-1 rounded-sm border border-cream">
            {(["7days", "30days", "12months"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs tracking-wider uppercase font-semibold rounded-xs transition-all cursor-pointer ${
                  timeRange === range
                    ? "bg-espresso text-cream shadow-xs"
                    : "text-muted-text hover:text-dark-text"
                }`}
              >
                {range === "7days" ? "7 Days" : range === "30days" ? "30 Days" : "12 Months"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Social Proof & Milestones Overview (Customer-Facing Stats) */}
      <div className="bg-gradient-to-r from-espresso via-[#2e171b] to-espresso text-cream p-5 sm:p-6 rounded-sm border border-champagne/30 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cream/15 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-champagne font-semibold">
                Brand Social Proof & Milestones
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-champagne/15 text-champagne border border-champagne/30">
                Storefront Active
              </span>
            </div>
            <p className="text-xs text-cream/70 mt-1">
              Displayed across the customer website (Hero, Cards, Detail). Automatically adds every new customer and order to your baseline.
            </p>
          </div>

          <button
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-champagne text-dark-text text-xs tracking-wider uppercase font-semibold rounded-sm hover:bg-cream transition-all cursor-pointer self-start md:self-auto shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-dark-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>Edit Brand Stats</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/5 border border-cream/10 p-3.5 rounded-sm">
            <span className="text-[10px] text-cream/60 uppercase tracking-widest block font-medium">
              Total Customers
            </span>
            <div className="text-2xl font-display font-bold text-champagne mt-0.5">
              {brandStats.totalCustomers.toLocaleString()}+
            </div>
            <span className="text-[10px] text-cream/50 font-mono">
              Base: {brandStats.baseCustomers} + Live: {brandStats.liveCustomers}
            </span>
          </div>

          <div className="bg-white/5 border border-cream/10 p-3.5 rounded-sm">
            <span className="text-[10px] text-cream/60 uppercase tracking-widest block font-medium">
              Repeat Customers
            </span>
            <div className="text-2xl font-display font-bold text-champagne mt-0.5">
              {brandStats.repeatCustomers.toLocaleString()}+
            </div>
            <span className="text-[10px] text-cream/50 font-mono">
              Base: {brandStats.baseRepeatCustomers} + Live: {brandStats.liveRepeatCustomers}
            </span>
          </div>

          <div className="bg-white/5 border border-cream/10 p-3.5 rounded-sm">
            <span className="text-[10px] text-cream/60 uppercase tracking-widest block font-medium">
              Bottles Delivered
            </span>
            <div className="text-2xl font-display font-bold text-champagne mt-0.5">
              {brandStats.totalBottlesSold.toLocaleString()}+
            </div>
            <span className="text-[10px] text-cream/50 font-mono">
              Base: {brandStats.baseBottlesSold} + Live: {brandStats.liveBottlesSold}
            </span>
          </div>

          <div className="bg-white/5 border border-cream/10 p-3.5 rounded-sm">
            <span className="text-[10px] text-cream/60 uppercase tracking-widest block font-medium">
              Repurchase Rate
            </span>
            <div className="text-2xl font-display font-bold text-emerald-400 mt-0.5">
              {brandStats.repeatRate}
            </div>
            <span className="text-[10px] text-cream/50 font-mono">
              Across 12 Blends
            </span>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="text-center py-20 bg-white border border-cream rounded-sm text-sm text-muted-text flex flex-col items-center justify-center gap-3">
          <svg className="w-6 h-6 text-burgundy animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Compiling dynamic real-time sales metrics...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Revenue",
                value: `Rs. ${data.stats.revenue.toLocaleString()}`,
                change: `${data.stats.revenueChange} vs last period`,
                isPositive: data.stats.revenuePositive,
              },
              {
                label: "Orders Placed",
                value: data.stats.orders,
                change: `${data.stats.ordersChange} vs last period`,
                isPositive: data.stats.ordersPositive,
              },
              {
                label: "Average Order Value",
                value: `Rs. ${data.stats.aov.toLocaleString()}`,
                change: `${data.stats.aovChange} vs last period`,
                isPositive: data.stats.aovPositive,
              },
              {
                label: "Conversion Rate",
                value: data.stats.conversionRate,
                change: `${data.stats.conversionChange} vs last period`,
                isPositive: data.stats.conversionPositive,
              },
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-5 border border-cream rounded-sm space-y-2 shadow-xs">
                <span className="text-xs text-muted-text uppercase tracking-wider font-semibold">{card.label}</span>
                <div className="font-display text-2xl font-bold text-dark-text">{card.value}</div>
                <div className={`text-[11px] font-semibold flex items-center gap-1 ${card.isPositive ? "text-emerald-600" : "text-rose-500"}`}>
                  <span>{card.isPositive ? "↑" : "↓"}</span>
                  <span>{card.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Chart */}
          <div className="bg-white p-6 border border-cream rounded-sm space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-cream/50 pb-4">
              <div>
                <h2 className="font-semibold text-dark-text tracking-wide">Sales Performance Trend</h2>
                <p className="text-xs text-muted-text mt-0.5">
                  Revenue grouped by {timeRange === "7days" ? "day" : timeRange === "30days" ? "week" : "month"}
                </p>
              </div>
              <span className="text-xs font-mono text-muted-text bg-cream/30 px-2 py-1 rounded-sm border border-cream">
                Scale: Thousands (PKR)
              </span>
            </div>

            {/* CSS Chart */}
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-4 px-2 overflow-x-auto">
              {data.chartData.map((bar, idx) => {
                const barHeight = bar.value > 0 ? Math.max(8, (bar.value / maxVal) * 180) : 4;
                return (
                  <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full relative flex justify-center">
                      <div
                        style={{ height: `${barHeight}px` }}
                        className={`w-full transition-all duration-300 rounded-t-sm relative cursor-pointer ${
                          bar.value > 0
                            ? "bg-burgundy/85 group-hover:bg-burgundy group-hover:shadow-sm"
                            : "bg-cream/70 group-hover:bg-cream"
                        }`}
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-espresso text-cream text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap z-20 shadow-md pointer-events-none">
                          Rs. {bar.value.toLocaleString()}k
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-text font-mono font-medium truncate w-full text-center">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side-by-side Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white p-6 border border-cream rounded-sm space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-cream/50 pb-3">
                <h3 className="font-semibold text-dark-text tracking-wide">Best Performing Fragrances</h3>
                <span className="text-[11px] text-muted-text">By units sold in this period</span>
              </div>
              <div className="space-y-3">
                {data.bestFragrances.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-text">
                    No fragrance sales recorded in this period.
                  </div>
                ) : (
                  data.bestFragrances.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-2 border-b border-cream last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cream/80 text-[10px] font-mono font-bold text-espresso flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold font-display text-dark-text">{p.name}</div>
                          <div className="text-[11px] text-muted-text font-mono">
                            {p.sales} {p.sales === 1 ? "unit" : "units"} sold
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-burgundy font-mono">
                        Rs. {p.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gender Demographics */}
            <div className="bg-white p-6 border border-cream rounded-sm space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-cream/50 pb-3">
                <h3 className="font-semibold text-dark-text tracking-wide">Audience Demographics</h3>
                <span className="text-[11px] text-muted-text">Based on order product types</span>
              </div>
              <div className="space-y-4">
                {data.demographics.map((d, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-dark-text">
                      <span>{d.label}</span>
                      <span className="font-mono">{d.percent}%</span>
                    </div>
                    <div className="w-full bg-cream h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${d.percent}%` }}
                        className={`h-full ${d.color} transition-all duration-500`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Brand Statistics Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-sm border border-cream shadow-xl w-full max-w-3xl my-8 overflow-hidden">
            <div className="bg-espresso text-cream p-5 flex items-center justify-between border-b border-cream/10">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-wide text-champagne">
                  Edit Brand Milestone & Social Proof Stats
                </h2>
                <p className="text-xs text-cream/70 mt-0.5">
                  Customize the baseline customer and bottle sale counts. Newly placed orders and customers are added on top automatically.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-cream/60 hover:text-cream text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrandStats} className="p-6 space-y-6">
              {brandStatsAlert && (
                <div
                  className={`p-3 text-xs rounded-sm border ${
                    brandStatsAlert.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {brandStatsAlert.message}
                </div>
              )}

              {/* Core 3 Baseline Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1">
                    Base Customers
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.baseCustomers}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        baseCustomers: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-cream rounded-sm font-mono focus:border-champagne outline-none"
                    required
                  />
                  <span className="text-[10px] text-muted-text mt-1 block">
                    Current Live: +{brandStats.liveCustomers} (Total: {editForm.baseCustomers + brandStats.liveCustomers})
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1">
                    Base Repeat Customers
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.baseRepeatCustomers}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        baseRepeatCustomers: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-cream rounded-sm font-mono focus:border-champagne outline-none"
                    required
                  />
                  <span className="text-[10px] text-muted-text mt-1 block">
                    Current Live: +{brandStats.liveRepeatCustomers} (Total: {editForm.baseRepeatCustomers + brandStats.liveRepeatCustomers})
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-text mb-1">
                    Base Total Bottles Sold
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.baseBottlesSold}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        baseBottlesSold: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-cream rounded-sm font-mono focus:border-champagne outline-none"
                    required
                  />
                  <span className="text-[10px] text-muted-text mt-1 block">
                    Current Live: +{brandStats.liveBottlesSold} (Total: {editForm.baseBottlesSold + brandStats.liveBottlesSold})
                  </span>
                </div>
              </div>

              {/* Fragrance Distribution Breakdown across the 12 Blends */}
              <div className="border-t border-cream pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-dark-text tracking-wide uppercase">
                      Bottles Sold Distributed Across 12 Fragrances (Base 3,000+)
                    </h3>
                    <p className="text-[11px] text-muted-text">
                      Controls the "🔥 X Bottles Sold" displayed on each fragrance's card and details page.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-burgundy bg-cream/40 px-2 py-1 rounded-sm">
                    Sum:{" "}
                    {Object.values(editForm.productOffsets).reduce((sum, v) => sum + v, 0)}{" "}
                    Bottles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {ALL_CATALOG_PERFUMES.map((p) => {
                    const offsetVal = editForm.productOffsets[p.id] ?? p.defaultOffset;
                    const liveSold =
                      brandStats.productSalesById?.[p.id] !== undefined
                        ? brandStats.productSalesById[p.id] - (brandStats.productOffsets?.[p.id] ?? p.defaultOffset)
                        : 0;

                    return (
                      <div
                        key={p.id}
                        className="p-2.5 bg-cream/20 border border-cream rounded-sm flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="text-xs font-semibold font-display text-dark-text block">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-muted-text font-mono">
                            Live: +{Math.max(0, liveSold)} (Total: {offsetVal + Math.max(0, liveSold)})
                          </span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={offsetVal}
                          onChange={(e) => handleOffsetChange(p.id, e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-cream rounded-sm font-mono text-right focus:border-champagne outline-none bg-white font-semibold"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs border border-cream rounded-sm text-muted-text hover:text-dark-text cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBrandStats}
                  className="px-6 py-2 bg-espresso text-cream text-xs uppercase font-semibold tracking-wider rounded-sm hover:bg-dark-text cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingBrandStats ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Brand Statistics</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
