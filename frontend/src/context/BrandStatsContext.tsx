import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface BrandStats {
  baseCustomers: number;
  baseRepeatCustomers: number;
  baseBottlesSold: number;
  liveCustomers: number;
  liveRepeatCustomers: number;
  liveBottlesSold: number;
  totalCustomers: number;
  repeatCustomers: number;
  totalBottlesSold: number;
  repeatRate: string;
  productSales: Record<string, number>;
  productSalesById: Record<string, number>;
  productOffsets: Record<string, number>;
}

const DEFAULT_PRODUCT_SALES_OFFSETS: Record<string, number> = {
  "01": 380, // VELORÉN
  "12": 350, // SOVÉRANE
  "02": 340, // NOIRVÉA
  "07": 290, // ÉLVARO NOIR
  "03": 270, // AURÉVON
  "04": 260, // OMBRÉLIS
  "06": 240, // RAVÉLIEN
  "10": 220, // VÉNDRIS
  "05": 200, // SÉLVARO
  "08": 170, // CALVÉRÉ
  "11": 150, // ALVÉRION
  "09": 130, // ORVÉSSA
};

const DEFAULT_BRAND_STATS: BrandStats = {
  baseCustomers: 1000,
  baseRepeatCustomers: 700,
  baseBottlesSold: 3000,
  liveCustomers: 0,
  liveRepeatCustomers: 0,
  liveBottlesSold: 0,
  totalCustomers: 1000,
  repeatCustomers: 700,
  totalBottlesSold: 3000,
  repeatRate: "70%",
  productSales: {
    "VELORÉN": 380,
    "SOVÉRANE": 350,
    "NOIRVÉA": 340,
    "ÉLVARO NOIR": 290,
    "AURÉVON": 270,
    "OMBRÉLIS": 260,
    "RAVÉLIEN": 240,
    "VÉNDRIS": 220,
    "SÉLVARO": 200,
    "CALVÉRÉ": 170,
    "ALVÉRION": 150,
    "ORVÉSSA": 130,
  },
  productSalesById: DEFAULT_PRODUCT_SALES_OFFSETS,
  productOffsets: DEFAULT_PRODUCT_SALES_OFFSETS,
};

interface BrandStatsContextType {
  stats: BrandStats;
  loading: boolean;
  refreshStats: () => Promise<void>;
  updateStats: (payload: {
    baseCustomers?: number;
    baseRepeatCustomers?: number;
    baseBottlesSold?: number;
    productOffsets?: Record<string, number>;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  getBottlesSoldForProduct: (productId: string, productName?: string) => number;
}

const BrandStatsContext = createContext<BrandStatsContextType | null>(null);

export function BrandStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<BrandStats>(DEFAULT_BRAND_STATS);
  const [loading, setLoading] = useState<boolean>(true);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/brand-stats`);
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch (err) {
      console.error("Failed to load brand stats:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    refreshStats();
    // Auto-refresh every 30 seconds to capture new orders / customers live
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const updateStats = async (payload: {
    baseCustomers?: number;
    baseRepeatCustomers?: number;
    baseBottlesSold?: number;
    productOffsets?: Record<string, number>;
  }) => {
    const userStr = localStorage.getItem("soho_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    try {
      const res = await fetch(`${apiBase}/admin/brand-stats`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to update brand statistics." };
      }

      await refreshStats();
      return { success: true, message: data.message || "Brand statistics updated successfully." };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error while saving brand stats." };
    }
  };

  const getBottlesSoldForProduct = (productId: string, productName?: string): number => {
    if (stats.productSalesById && stats.productSalesById[productId]) {
      return stats.productSalesById[productId];
    }
    if (productName && stats.productSales && stats.productSales[productName]) {
      return stats.productSales[productName];
    }
    return DEFAULT_PRODUCT_SALES_OFFSETS[productId] || 250;
  };

  return (
    <BrandStatsContext.Provider
      value={{
        stats,
        loading,
        refreshStats,
        updateStats,
        getBottlesSoldForProduct,
      }}
    >
      {children}
    </BrandStatsContext.Provider>
  );
}

export function useBrandStats() {
  const ctx = useContext(BrandStatsContext);
  if (!ctx) {
    throw new Error("useBrandStats must be used within BrandStatsProvider");
  }
  return ctx;
}
