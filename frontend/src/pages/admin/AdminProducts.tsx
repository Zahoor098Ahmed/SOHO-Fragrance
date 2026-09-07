import { useState } from "react";
import { products, saveStoredProducts, formatPKR } from "../../data/products";
import type { Product } from "../../data/products";
import { useBrandStats } from "../../context/BrandStatsContext";

// A few preset premium perfume images from Unsplash for easy selection, or they can input their own URL
const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1638295916768-459f6cf440bc?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1598634222670-87c5f558119c?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1566977776052-6e61e35bf9be?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1676951334972-2e65e67f4cbe?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1613521076081-2820f9746a2d?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1608721279136-cd41b752fa41?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1571206508927-2ef3026ada5d?w=600&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1600086586698-368d69f00d6e?w=600&h=800&fit=crop&auto=format",
];

export default function AdminProducts() {
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);
  const [search, setSearch] = useState("");
  const { getBottlesSoldForProduct } = useBrandStats();

  // Modal state: null means closed, active product means editing/adding
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    id: "",
    slug: "",
    name: "",
    family: "",
    description: "",
    price50ml: 4500,
    price100ml: 7500,
    stock50ml: 50,
    stock100ml: 50,
    image: PRESET_IMAGES[0],
    gender: "unisex",
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    longevity: "8–10 hours",
    sillage: "Strong",
    bottleColor: "#3B0D18",
    bottleCapColor: "#D6B98C",
    liquidColor: "#8B4513",
    bgAccent: "#3B0D18",
    tags: [],
    rating: 4.8,
    reviews: 12,
    isBestSeller: false,
    isNewArrival: false,
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id: String(localProducts.length + 1).padStart(2, "0"),
      slug: "",
      name: "",
      family: "",
      description: "",
      price50ml: 4500,
      price100ml: 7500,
      stock50ml: 50,
      stock100ml: 50,
      image: PRESET_IMAGES[0],
      gender: "unisex",
      topNotes: ["Bergamot", "Lemon"],
      heartNotes: ["Rose", "Jasmine"],
      baseNotes: ["Amber", "Musk"],
      longevity: "8–10 hours",
      sillage: "Strong",
      bottleColor: "#3B0D18",
      bottleCapColor: "#D6B98C",
      liquidColor: "#8B4513",
      bgAccent: "#3B0D18",
      tags: ["Amber"],
      rating: 4.8,
      reviews: 12,
      isBestSeller: false,
      isNewArrival: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setIsEditing(true);
    setFormData({ ...product });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList: Product[] = [];

    // Auto-generate slug from name if blank
    const slug = formData.slug || formData.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "perfume";

    const finalProduct: Product = {
      ...(formData as Product),
      slug,
      price50ml: Number(formData.price50ml) || 0,
      price100ml: Number(formData.price100ml) || 0,
      stock50ml: Number(formData.stock50ml) || 0,
      stock100ml: Number(formData.stock100ml) || 0,
    };

    if (isEditing) {
      updatedList = localProducts.map((p) => (p.id === finalProduct.id ? finalProduct : p));
    } else {
      updatedList = [...localProducts, finalProduct];
    }

    saveStoredProducts(updatedList);
    setLocalProducts(updatedList);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const updatedList = localProducts.filter((p) => p.id !== id);
      saveStoredProducts(updatedList);
      setLocalProducts(updatedList);
    }
  };

  const filtered = localProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.family.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Products</h1>
          <p className="text-sm text-muted-text mt-0.5">Manage all SOHO fragrances</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-burgundy text-cream text-xs tracking-[0.2em] uppercase hover:bg-dark-burgundy transition-colors rounded-sm cursor-pointer"
        >
          + Add Product
        </button>
      </div>

      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2 bg-white border border-cream text-sm text-dark-text placeholder-muted-text/50 focus:outline-none focus:border-champagne rounded-sm"
        />
      </div>

      <div className="bg-white rounded-sm border border-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory">
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider">Product</th>
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider hidden md:table-cell">Family</th>
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider">50ml</th>
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider">100ml</th>
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider hidden lg:table-cell">Stock</th>
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider">Bottles Sold</th>
                <th className="text-left px-5 py-3 text-xs text-muted-text font-normal tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs text-muted-text font-normal tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const bottlesSold = getBottlesSoldForProduct(p.id, p.name);
                return (
                  <tr key={p.id} className="border-t border-cream hover:bg-ivory/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-12 object-cover rounded-sm flex-shrink-0" />
                        <div>
                          <p className="font-display font-semibold text-dark-text text-sm">{p.name}</p>
                          <p className="text-[10px] text-muted-text tracking-wider">By SOHO</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-text text-xs">{p.family}</td>
                    <td className="px-5 py-3 font-mono-custom text-dark-text text-xs">{formatPKR(p.price50ml)}</td>
                    <td className="px-5 py-3 font-mono-custom text-dark-text text-xs">{formatPKR(p.price100ml)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-xs text-muted-text">{p.stock50ml} / {p.stock100ml}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-espresso text-champagne text-[11px] font-mono font-semibold border border-champagne/30">
                        <span>🔥</span>
                        <span>{bottlesSold} sold</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.isBestSeller && <span className="px-1.5 py-0.5 bg-champagne/20 text-dark-text text-[9px] rounded-sm">Best Seller</span>}
                        {p.isNewArrival && <span className="px-1.5 py-0.5 bg-burgundy/10 text-burgundy text-[9px] rounded-sm">New</span>}
                      </div>
                    </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="text-xs text-champagne hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-dark-text/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto shadow-xl border border-cream">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-cream">
              <h2 className="font-display text-xl text-dark-text">
                {isEditing ? `Edit ${formData.name}` : "Add New Fragrance"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-text hover:text-dark-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Family (e.g. Amber Woody)</label>
                  <input
                    required
                    type="text"
                    value={formData.family}
                    onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Price 50ml (PKR)</label>
                  <input
                    required
                    type="number"
                    value={formData.price50ml}
                    onChange={(e) => setFormData({ ...formData, price50ml: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Price 100ml (PKR)</label>
                  <input
                    required
                    type="number"
                    value={formData.price100ml}
                    onChange={(e) => setFormData({ ...formData, price100ml: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Stock 50ml</label>
                  <input
                    required
                    type="number"
                    value={formData.stock50ml}
                    onChange={(e) => setFormData({ ...formData, stock50ml: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Stock 100ml</label>
                  <input
                    required
                    type="number"
                    value={formData.stock100ml}
                    onChange={(e) => setFormData({ ...formData, stock100ml: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Gender Target</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text bg-white focus:outline-none focus:border-champagne rounded-sm"
                >
                  <option value="unisex">Unisex</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Product Image</label>

                {/* File Upload Option */}
                <div className="mb-3">
                  <span className="text-[11px] text-muted-text block mb-1">Upload Local Image File:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            setFormData({ ...formData, image: reader.result });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-muted-text file:mr-4 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-cream file:text-xs file:font-semibold file:bg-ivory file:text-dark-text hover:file:bg-cream file:cursor-pointer"
                  />
                </div>

                {/* URL Option */}
                <div className="mb-3">
                  <span className="text-[11px] text-muted-text block mb-1">Or Paste Image URL:</span>
                  <input
                    required
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                  />
                </div>

                {/* Preset Option */}
                <p className="text-[10px] text-muted-text mb-1">Or click to select a premium preset image:</p>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {PRESET_IMAGES.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt="Preset preview"
                      onClick={() => setFormData({ ...formData, image: imgUrl })}
                      className={`w-10 h-12 object-cover rounded-sm cursor-pointer border-2 transition-all ${formData.image === imgUrl ? "border-burgundy scale-105" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-text tracking-wider uppercase mb-1 block">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm resize-none"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="accent-burgundy"
                  />
                  Best Seller
                </label>
                <label className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="accent-burgundy"
                  />
                  New Arrival
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-cream">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-burgundy text-cream text-xs tracking-[0.2em] uppercase hover:bg-dark-burgundy transition-colors rounded-sm cursor-pointer"
                >
                  {isEditing ? "Save Changes" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-cream text-muted-text text-xs hover:bg-ivory transition-colors rounded-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
