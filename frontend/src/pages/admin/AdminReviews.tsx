import { useState } from "react";

interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  status: "Pending" | "Approved" | "Archived";
}

export default function AdminReviews() {
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved">("All");

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "R-920",
      customerName: "Ali Akber",
      productName: "VELORÉN",
      rating: 5,
      comment: "Absolutely stunning fragrance! The longevity is incredible, lasts 10 hours easily. The packaging is very premium.",
      date: "Aug 15, 2026",
      status: "Approved",
    },
    {
      id: "R-721",
      customerName: "Ayesha Malik",
      productName: "SOVERANE",
      rating: 4,
      comment: "A beautiful fresh spicy profile, great for summer evenings. Projection could be slightly better.",
      date: "Aug 20, 2026",
      status: "Pending",
    },
    {
      id: "R-109",
      customerName: "Zainab Malik",
      productName: "OUD INTELLECT",
      rating: 5,
      comment: "Deep, mysterious wood notes. Absolutely loving it. Pakistan finally has an international-grade fragrance house.",
      date: "Jul 28, 2026",
      status: "Approved",
    },
    {
      id: "R-098",
      customerName: "Bilal Khan",
      productName: "SULTAN",
      rating: 2,
      comment: "A bit too strong and heavy for my liking. Smells nice after 2 hours but initial spray is overpowering.",
      date: "Jul 15, 2026",
      status: "Approved",
    },
  ]);

  const handleStatusChange = (id: string, newStatus: "Approved" | "Archived") => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus === "All") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-dark-text tracking-wide">Customer Reviews</h1>
        <p className="text-xs text-muted-text mt-1">Moderate, approve, and archive customer feedback left on products.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-cream rounded-sm flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["All", "Pending", "Approved"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs tracking-wider uppercase font-semibold border rounded-sm transition-all ${filterStatus === status
                  ? "bg-espresso border-espresso text-cream"
                  : "border-cream text-muted-text hover:border-champagne"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-text font-medium">
          Showing {filteredReviews.length} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((r) => (
          <div key={r.id} className="bg-white p-6 border border-cream rounded-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream/50 pb-3">
              <div>
                <h3 className="font-semibold text-dark-text text-sm font-display">{r.customerName}</h3>
                <p className="text-[10px] text-muted-text uppercase tracking-wider">Product: {r.productName}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg
                      key={idx}
                      className={`w-4 h-4 ${idx < r.rating ? "text-champagne fill-champagne" : "text-cream"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] text-muted-text font-mono">{r.date}</span>
              </div>
            </div>

            <p className="text-sm text-dark-text leading-relaxed font-light italic">"{r.comment}"</p>

            <div className="flex items-center justify-between border-t border-cream/50 pt-3">
              <div>
                <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${r.status === "Approved" ? "bg-green-100 text-green-700" :
                    r.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                  }`}>
                  {r.status}
                </span>
              </div>
              <div className="flex gap-2">
                {r.status === "Pending" && (
                  <button
                    onClick={() => handleStatusChange(r.id, "Approved")}
                    className="px-3 py-1 bg-burgundy hover:bg-dark-burgundy text-cream text-[10px] tracking-wider uppercase font-semibold transition-colors rounded-sm"
                  >
                    Approve
                  </button>
                )}
                {r.status !== "Archived" && (
                  <button
                    onClick={() => handleStatusChange(r.id, "Archived")}
                    className="px-3 py-1 border border-cream hover:border-red-200 text-muted-text hover:text-red-700 text-[10px] tracking-wider uppercase font-semibold transition-all rounded-sm"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
