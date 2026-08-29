import { useState, useEffect } from "react";
import { products as initialProducts, saveStoredProducts } from "../../data/products";

export default function AdminInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "critical">("all");

  const loadProducts = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) { }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStockChange = async (id: string, size: "50ml" | "100ml", value: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    const updatedObj = {
      ...target,
      [size === "50ml" ? "stock50ml" : "stock100ml"]: Math.max(0, value)
    };

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/products/${target._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedObj)
      });
      if (res.ok) {
        const saved = await res.json();
        setProducts((prev) => prev.map((p) => p.id === id ? saved : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusOverride = async (id: string, newStatus: "in_stock" | "low_stock" | "out_of_stock") => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    let s50 = target.stock50ml;
    let s100 = target.stock100ml;
    if (newStatus === "out_of_stock") {
      s50 = 0; s100 = 0;
    } else if (newStatus === "low_stock") {
      s50 = 8; s100 = 4;
    } else {
      s50 = 50; s100 = 50;
    }

    const updatedObj = { ...target, stock50ml: s50, stock100ml: s100 };

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/products/${target._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedObj)
      });
      if (res.ok) {
        const saved = await res.json();
        setProducts((prev) => prev.map((p) => p.id === id ? saved : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.family.toLowerCase().includes(searchTerm.toLowerCase());

    const isLow50 = p.stock50ml < 15 && p.stock50ml >= 5;
    const isLow100 = p.stock100ml < 10 && p.stock100ml >= 3;
    const isCritical50 = p.stock50ml < 5;
    const isCritical100 = p.stock100ml < 3;

    if (stockFilter === "low") {
      return matchesSearch && (isLow50 || isLow100);
    }
    if (stockFilter === "critical") {
      return matchesSearch && (isCritical50 || isCritical100);
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">Inventory Management</h1>
        <p className="text-xs text-muted-text mt-1">Track and update stock levels for 50ml and 100ml perfume volumes.</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border border-cream rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search by perfume name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-cream rounded-sm focus:border-champagne outline-none transition-colors"
          />
          <svg className="w-4 h-4 text-muted-text absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {(["all", "low", "critical"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStockFilter(filter)}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs tracking-wider uppercase font-semibold border rounded-sm transition-all ${stockFilter === filter
                  ? "bg-espresso border-espresso text-cream"
                  : "border-cream text-muted-text hover:border-champagne"
                }`}
            >
              {filter} Stock
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border border-cream rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-ivory border-b border-cream text-xs text-muted-text uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Fragrance</th>
                <th className="px-6 py-4 font-semibold text-center">50ml Stock</th>
                <th className="px-6 py-4 font-semibold text-center">100ml Stock</th>
                <th className="px-6 py-4 font-semibold">Price (50ml/100ml)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream text-dark-text">
              {filteredProducts.map((p) => {
                const totalStock = p.stock50ml + p.stock100ml;
                const isCritical = p.stock50ml < 5 || p.stock100ml < 3;
                const isLow = p.stock50ml < 15 || p.stock100ml < 10;
                const isZero = p.stock50ml === 0 && p.stock100ml === 0;

                return (
                  <tr key={p.id} className="hover:bg-ivory/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold font-display text-dark-text">{p.name}</div>
                      <div className="text-[10px] text-muted-text uppercase tracking-wider">{p.family}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStockChange(p.id, "50ml", p.stock50ml - 1)}
                          className="w-6 h-6 border border-cream hover:border-champagne text-muted-text hover:text-dark-text flex items-center justify-center rounded-sm cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={p.stock50ml}
                          onChange={(e) => handleStockChange(p.id, "50ml", parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-xs border border-cream py-1 rounded-sm focus:border-champagne outline-none"
                        />
                        <button
                          onClick={() => handleStockChange(p.id, "50ml", p.stock50ml + 1)}
                          className="w-6 h-6 border border-cream hover:border-champagne text-muted-text hover:text-dark-text flex items-center justify-center rounded-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStockChange(p.id, "100ml", p.stock100ml - 1)}
                          className="w-6 h-6 border border-cream hover:border-champagne text-muted-text hover:text-dark-text flex items-center justify-center rounded-sm cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={p.stock100ml}
                          onChange={(e) => handleStockChange(p.id, "100ml", parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-xs border border-cream py-1 rounded-sm focus:border-champagne outline-none"
                        />
                        <button
                          onClick={() => handleStockChange(p.id, "100ml", p.stock100ml + 1)}
                          className="w-6 h-6 border border-cream hover:border-champagne text-muted-text hover:text-dark-text flex items-center justify-center rounded-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      Rs. {p.price50ml.toLocaleString()} / Rs. {p.price100ml.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={
                          isZero || isCritical
                            ? "out_of_stock"
                            : isLow
                              ? "low_stock"
                              : "in_stock"
                        }
                        onChange={(e) => handleStatusOverride(p.id, e.target.value as any)}
                        className={`text-xs font-semibold px-2 py-1.5 rounded-sm outline-none border cursor-pointer ${isZero || isCritical
                            ? "text-red-700 border-red-200 bg-red-50"
                            : isLow
                              ? "text-yellow-700 border-yellow-200 bg-yellow-50"
                              : "text-green-700 border-green-200 bg-green-50"
                          }`}
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
