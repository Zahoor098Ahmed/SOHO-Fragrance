import { useState, useEffect } from "react";

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

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "12months">("30days");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem("soho_user");
  const token = userStr ? JSON.parse(userStr).token : "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/analytics?range=${timeRange}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Calculate dynamic max value for bar scaling
  const chartValues = data?.chartData.map((d) => d.value) || [];
  const maxVal = chartValues.length > 0 ? Math.max(...chartValues, 10) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">Analytics</h1>
          <p className="text-xs text-muted-text mt-1">Review SOHO sales performance, average order value, and conversion rates.</p>
        </div>
        <div className="flex gap-2">
          {(["7days", "30days", "12months"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs tracking-wider uppercase font-semibold border rounded-sm transition-all cursor-pointer ${
                timeRange === range
                  ? "bg-espresso border-espresso text-cream"
                  : "border-cream text-muted-text hover:border-champagne"
              }`}
            >
              {range === "7days" ? "7 Days" : range === "30days" ? "30 Days" : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="text-center py-20 bg-white border border-cream rounded-sm text-sm text-muted-text">
          Compiling dynamic sales metrics...
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
                isPositive: data.stats.revenuePositive
              },
              {
                label: "Orders Placed",
                value: data.stats.orders,
                change: `${data.stats.ordersChange} vs last period`,
                isPositive: data.stats.ordersPositive
              },
              {
                label: "Average Order Value",
                value: `Rs. ${data.stats.aov.toLocaleString()}`,
                change: `${data.stats.aovChange} vs last period`,
                isPositive: data.stats.aovPositive
              },
              {
                label: "Conversion Rate",
                value: data.stats.conversionRate,
                change: `${data.stats.conversionChange} vs last period`,
                isPositive: data.stats.conversionPositive
              },
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-5 border border-cream rounded-sm space-y-2 shadow-xs">
                <span className="text-xs text-muted-text uppercase tracking-wider font-semibold">{card.label}</span>
                <div className="font-display text-2xl font-bold text-dark-text">{card.value}</div>
                <div className={`text-[10px] font-semibold ${card.isPositive ? "text-green-600" : "text-red-500"}`}>
                  {card.change}
                </div>
              </div>
            ))}
          </div>

          {/* Visual Chart */}
          <div className="bg-white p-6 border border-cream rounded-sm space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-cream/50 pb-4">
              <h2 className="font-semibold text-dark-text tracking-wide">Sales Performance Trend</h2>
              <span className="text-xs text-muted-text">Measured in thousands (PKR)</span>
            </div>

            {/* CSS Chart */}
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-4 px-2 overflow-x-auto">
              {data.chartData.map((bar, idx) => (
                <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full relative flex justify-center">
                    <div
                      style={{ height: `${(bar.value / maxVal) * 180}px` }}
                      className="w-full bg-burgundy/80 group-hover:bg-burgundy transition-all duration-300 rounded-t-sm relative"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-espresso text-cream text-[9px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap z-10">
                        Rs. {bar.value}k
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-text font-mono font-medium truncate w-full text-center">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-side Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Products */}
            <div className="bg-white p-6 border border-cream rounded-sm space-y-4 shadow-xs">
              <h3 className="font-semibold text-dark-text tracking-wide border-b border-cream/50 pb-3">Best Performing Fragrances</h3>
              <div className="space-y-3">
                {data.bestFragrances.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-cream last:border-0 last:pb-0">
                    <div>
                      <div className="font-semibold font-display text-dark-text">{p.name}</div>
                      <div className="text-[10px] text-muted-text font-mono">{p.sales} units sold</div>
                    </div>
                    <div className="font-semibold text-burgundy">Rs. {p.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Demographics */}
            <div className="bg-white p-6 border border-cream rounded-sm space-y-4 shadow-xs">
              <h3 className="font-semibold text-dark-text tracking-wide border-b border-cream/50 pb-3">Audience Demographics</h3>
              <div className="space-y-4">
                {data.demographics.map((d, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-dark-text">
                      <span>{d.label}</span>
                      <span className="font-mono">{d.percent}%</span>
                    </div>
                    <div className="w-full bg-cream h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${d.percent}%` }} className={`h-full ${d.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
