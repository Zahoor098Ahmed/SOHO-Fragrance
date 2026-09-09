import { useState, useEffect, useRef } from "react";
import { formatPKR } from "../../data/products";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const statusOptions = [
  "Pending Verification",
  "Confirmed",
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Refunded"
];

interface OrderType {
  id: string;
  customer: string;
  phone: string;
  email?: string;
  items: string;
  amount: number;
  payment: string;
  paymentStatus?: string;
  paymentReceipt?: string;
  transactionRef?: string;
  status: string;
  date: string;
  city: string;
  address?: string;
  province?: string;
  deliveryCharge?: number;
  verifiedBy?: string;
  verifiedAt?: string;
}

const statusColor: Record<string, string> = {
  "Pending Verification": "text-amber-800 bg-amber-50 border border-amber-300 font-semibold",
  Delivered: "text-green-700 bg-green-50",
  Shipped: "text-blue-700 bg-blue-50",
  Processing: "text-yellow-700 bg-yellow-50",
  Packed: "text-indigo-800 bg-indigo-50 border border-indigo-200 font-semibold",
  Confirmed: "text-purple-700 bg-purple-50",
  Pending: "text-gray-600 bg-gray-50",
  "Out for Delivery": "text-orange-700 bg-orange-50",
  Cancelled: "text-red-700 bg-red-50",
  Refunded: "text-pink-700 bg-pink-50",
};

// Authentic GS1/ISO Standard Code-128 SVG Barcode component (scannable by any barcode reader)
function OrderBarcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        const cleanVal = value.trim();
        JsBarcode(svgRef.current, cleanVal, {
          format: "CODE128",
          lineColor: "#000000",
          width: 2,
          height: 46,
          displayValue: true,
          font: "monospace",
          fontSize: 12,
          fontOptions: "bold",
          textMargin: 3,
          margin: 2,
          background: "#ffffff"
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} className="max-w-[240px] h-auto" />
    </div>
  );
}

// 100% Client-Side High-Res Scannable QR Code Component
function OrderQRCode({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })
      .then((data) => setQrDataUrl(data))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [url]);

  if (!qrDataUrl) {
    return (
      <div className="w-24 h-24 bg-gray-100 border-2 border-black flex items-center justify-center text-[10px] font-bold">
        Generating QR...
      </div>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="Scan for Live Order Tracking"
      className="w-24 h-24 border-2 border-black p-0.5 bg-white object-contain shadow-xs"
    />
  );
}

export default function AdminOrders() {
  const [localOrders, setLocalOrders] = useState<OrderType[]>([]);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const [selectedCourier, setSelectedCourier] = useState("TCS Express");
  const [selected, setSelected] = useState<OrderType | null>(null);
  const [printOrder, setPrintOrder] = useState<OrderType | null>(null);
  const [tempStatus, setTempStatus] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  const backendAssetBase = apiBase.replace("/api", "");

  const loadOrders = async () => {
    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const res = await fetch(`${apiBase}/orders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setLocalOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpen = (order: OrderType) => {
    setSelected(order);
    setTempStatus(order.status);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setIsUpdating(true);

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const res = await fetch(`${apiBase}/orders/${encodeURIComponent(selected.id)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: tempStatus })
      });
      if (res.ok) {
        setLocalOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: tempStatus } : o)));
        if (tempStatus === "Confirmed") {
          setSuccessToast(`Order ${selected.id} status updated to Confirmed! Customer email triggered.`);
          setTimeout(() => setSuccessToast(""), 4000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setSelected(null);
    }
  };

  const handleQuickConfirm = async () => {
    if (!selected) return;
    setIsUpdating(true);

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const res = await fetch(`${apiBase}/orders/${encodeURIComponent(selected.id)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Confirmed", paymentStatus: "Paid" })
      });
      if (res.ok) {
        setLocalOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: "Confirmed", paymentStatus: "Paid" } : o)));
        setSelected((prev) => prev ? { ...prev, status: "Confirmed", paymentStatus: "Paid" } : null);
        setSuccessToast(`✓ Order ${selected.id} verified! Payment marked as Paid & Confirmation Email sent.`);
        setTimeout(() => setSuccessToast(""), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickReject = async () => {
    if (!selected) return;
    if (!window.confirm(`Are you sure you want to cancel order ${selected.id}?`)) return;
    setIsUpdating(true);

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const res = await fetch(`${apiBase}/orders/${encodeURIComponent(selected.id)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Cancelled", paymentStatus: "Failed" })
      });
      if (res.ok) {
        setLocalOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: "Cancelled", paymentStatus: "Failed" } : o)));
        setSelected((prev) => prev ? { ...prev, status: "Cancelled", paymentStatus: "Failed" } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintAndSavePdf = async () => {
    if (!printOrder) return;
    const cleanOrderId = (printOrder.id || "Order").replace(/[^a-zA-Z0-9_-]/g, "");
    setIsDownloadingPdf(true);

    try {
      const slipElement = document.getElementById("printable-shipping-slip");
      if (slipElement) {
        // High-resolution 3.0x scale (300 DPI print-ready quality, crisp vector-grade rendering)
        const canvas = await html2canvas(slipElement, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1000,
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        const pageWidth = 210;
        const margin = 8;
        const printWidth = pageWidth - margin * 2;
        const printHeight = (canvas.height * printWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight, undefined, "FAST");
        // Save directly with exact order number as requested: e.g. ORD-2666.pdf
        pdf.save(`${cleanOrderId}.pdf`);
      }
    } catch (err) {
      console.error("Direct PDF generation error:", err);
    }

    // Simultaneously trigger browser native print dialog (vector Save as PDF & physical printing)
    setTimeout(() => {
      const origTitle = document.title;
      document.title = `${cleanOrderId} - SOHO Perfume`;
      window.print();
      document.title = origTitle;
      setIsDownloadingPdf(false);
    }, 400);
  };

  const pendingVerificationCount = localOrders.filter(o => o.status === "Pending Verification").length;
  const filtered = filter === "All" ? localOrders : localOrders.filter((o) => o.status === filter);

  // Pagination (10 orders per page)
  const totalOrders = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * ordersPerPage;
  const endIndex = Math.min(startIndex + ordersPerPage, totalOrders);
  const paginatedOrders = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-5">
      {/* Print CSS to isolate the shipping slip */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-shipping-slip, #printable-shipping-slip * {
            visibility: visible !important;
          }
          #printable-shipping-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 194mm !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            z-index: 999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-text">Orders Management</h1>
          <p className="text-sm text-muted-text mt-0.5">{localOrders.length} total customer orders</p>
        </div>

        {/* Verification alert pill if orders awaiting review */}
        {pendingVerificationCount > 0 && (
          <button
            onClick={() => handleFilterChange("Pending Verification")}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs font-medium cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span><strong>{pendingVerificationCount}</strong> Bank Transfer {pendingVerificationCount === 1 ? "Order" : "Orders"} Pending Verification</span>
          </button>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-sm text-xs flex items-center justify-between animate-fade-in">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast("")} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Status filters */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {["All", ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-sm transition-all cursor-pointer ${
              filter === s ? "bg-burgundy text-cream font-medium" : "border border-cream text-muted-text hover:border-champagne"
            }`}
          >
            {s}
            {s === "Pending Verification" && pendingVerificationCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-dark-text rounded-full text-[10px] font-bold">
                {pendingVerificationCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-sm border border-cream overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory border-b border-cream">
                {["Order ID", "Customer Details", "Items", "Amount", "Payment", "Proof", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-text font-normal tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-muted-text text-sm">
                    No orders found matching the filter "{filter}".
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-t border-cream hover:bg-ivory/40 transition-colors">
                    <td className="px-4 py-3 font-mono-custom text-xs font-semibold text-dark-text">{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-dark-text font-medium text-xs">{order.customer}</p>
                      <p className="text-[11px] text-muted-text">{order.phone}</p>
                      <p className="text-[10px] text-muted-text/80 truncate max-w-[160px]">{order.email}</p>
                      <p className="text-[10px] text-muted-text truncate max-w-[160px] font-mono">{order.city}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-text max-w-xs truncate">{order.items}</td>
                    <td className="px-4 py-3 font-mono-custom text-xs font-bold text-dark-text">{formatPKR(order.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-text">
                      <span>{order.payment}</span>
                      {order.transactionRef && (
                        <p className="font-mono text-[10px] text-champagne truncate max-w-[120px]" title={order.transactionRef}>
                          TID: {order.transactionRef}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.paymentReceipt ? (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(`${backendAssetBase}${order.paymentReceipt}`)}
                          className="inline-flex items-center gap-1 text-[11px] text-champagne hover:text-burgundy underline cursor-pointer"
                        >
                          <span>📎 Slip</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-text/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider ${statusColor[order.status] || "text-gray-600 bg-gray-50"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-text">{order.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpen(order)}
                          className="text-xs px-2.5 py-1 bg-ivory border border-cream hover:border-champagne text-dark-text hover:text-burgundy transition-all rounded-sm cursor-pointer"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => setPrintOrder(order)}
                          className="text-xs px-2.5 py-1 bg-champagne/10 border border-champagne/40 hover:bg-champagne/20 text-dark-text transition-all rounded-sm cursor-pointer flex items-center gap-1"
                          title="Print or Download Shipping Slip"
                        >
                          <span>🖨️</span>
                          <span className="hidden sm:inline text-[11px]">Slip / PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10 Orders Pagination Bar */}
        {totalOrders > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-ivory/60 border-t border-cream text-xs text-muted-text">
            <div>
              Showing <span className="font-semibold text-dark-text">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-dark-text">{endIndex}</span> of{" "}
              <span className="font-semibold text-dark-text">{totalOrders}</span> orders
              {totalPages > 1 && (
                <span className="ml-1 text-muted-text font-mono">(Page {safePage} of {totalPages})</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1.5 rounded-sm border border-cream bg-white text-dark-text hover:border-champagne hover:text-burgundy disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    totalPages <= 7 ||
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= safePage - 1 && pageNum <= safePage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-sm text-xs font-semibold transition-colors cursor-pointer ${
                          safePage === pageNum
                            ? "bg-burgundy text-cream shadow-xs"
                            : "bg-white border border-cream text-dark-text hover:border-champagne"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                    return <span key={pageNum} className="px-0.5 text-muted-text">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 rounded-sm border border-cream bg-white text-dark-text hover:border-champagne hover:text-burgundy disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail & Payment Verification Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm max-w-lg w-full p-6 shadow-2xl border border-cream max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-cream pb-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-dark-text">Order {selected.id}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${statusColor[selected.status] || "text-gray-600 bg-gray-50"}`}>
                  {selected.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintOrder(selected)}
                  className="px-3 py-1.5 bg-ivory border border-champagne text-dark-text text-xs rounded hover:bg-champagne/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Dispatch Label</span>
                </button>
                <button onClick={() => setSelected(null)} className="text-muted-text hover:text-dark-text cursor-pointer p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Approval Banner for Bank Transfers Pending Verification */}
            {selected.status === "Pending Verification" && (
              <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                <div className="flex items-start gap-3">
                  <div className="text-amber-700 text-lg">💡</div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-amber-900">Payment Verification Required</p>
                    <p className="text-amber-800/90 mt-0.5">
                      Verify that funds have reached your official Bank / Wallet. Clicking <strong>Approve & Confirm</strong> will set status to Confirmed, Payment to Paid, and automatically send an official confirmation email to <strong>{selected.email || selected.customer}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={handleQuickConfirm}
                    disabled={isUpdating}
                    className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-medium text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>✓ Verify & Confirm Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickReject}
                    disabled={isUpdating}
                    className="px-3 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs rounded transition-colors cursor-pointer"
                  >
                    Reject Payment
                  </button>
                </div>
              </div>
            )}

            {/* Payment Receipt Display */}
            {selected.paymentReceipt && (
              <div className="mb-5 p-4 bg-ivory border border-cream rounded-sm">
                <p className="text-xs text-muted-text uppercase tracking-wider mb-2 font-medium">Customer Payment Proof / Slip</p>
                <div className="flex items-center gap-4">
                  <img
                    src={`${backendAssetBase}${selected.paymentReceipt}`}
                    alt="Payment Slip"
                    className="w-20 h-24 object-cover border border-cream rounded-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImage(`${backendAssetBase}${selected.paymentReceipt}`)}
                  />
                  <div className="space-y-1 text-xs">
                    <p className="text-dark-text font-medium">Transaction Screenshot Attached</p>
                    {selected.transactionRef && (
                      <p className="text-muted-text">
                        Transaction Ref / TID: <strong className="font-mono text-dark-text">{selected.transactionRef}</strong>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxImage(`${backendAssetBase}${selected.paymentReceipt}`)}
                      className="text-champagne hover:text-burgundy underline text-[11px] font-medium block pt-1 cursor-pointer"
                    >
                      🔍 Click to Zoom / View Full Slip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Details Grid */}
            <div className="space-y-2.5 text-xs mb-5 p-3 bg-cream/50 rounded-sm">
              <div className="flex justify-between"><span className="text-muted-text">Customer</span><span className="text-dark-text font-semibold">{selected.customer}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Email</span><span className="text-dark-text font-mono">{selected.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Phone</span><span className="text-dark-text font-mono font-bold">{selected.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Delivery Address</span><span className="text-dark-text text-right max-w-xs">{selected.address ? `${selected.address}, ` : ""}{selected.city}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Items</span><span className="text-dark-text text-right max-w-xs font-medium">{selected.items}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Payment Method</span><span className="text-dark-text font-medium">{selected.payment}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-text">Delivery Charge</span>
                <span className="text-dark-text font-mono font-medium">
                  {selected.deliveryCharge && selected.deliveryCharge > 0 ? formatPKR(selected.deliveryCharge) : "Free / Included"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-text">Total Amount</span><span className="font-mono-custom text-burgundy font-bold text-sm">{formatPKR(selected.amount)}</span></div>
            </div>

            {/* Manual Status Override */}
            <div className="border-t border-cream pt-4">
              <label className="text-xs text-muted-text tracking-wider uppercase mb-1.5 block">Update Status Manually</label>
              <div className="flex gap-2">
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm"
                >
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-5 py-2 bg-burgundy text-cream text-xs tracking-wider uppercase hover:bg-dark-burgundy transition-colors rounded-sm cursor-pointer disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daraz-Style Courier Shipping Label & Invoice Print Modal */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded max-w-2xl w-full p-6 shadow-2xl border border-gray-300 max-h-[95vh] overflow-y-auto">
            {/* Modal Controls (Hidden in Print) */}
            <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖨️</span>
                <div>
                  <h3 className="font-serif font-bold text-dark-text text-sm">Official Courier Consignment Slip</h3>
                  <span className="text-[11px] text-gray-500 font-mono">Consignment ID: {printOrder.id}</span>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Dynamic Courier Selector */}
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded border border-gray-300 text-xs">
                  <span className="font-semibold text-gray-700">Courier:</span>
                  <select
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    className="bg-transparent font-bold text-black text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="TCS Express">TCS Express</option>
                    <option value="Leopards Courier">Leopards Courier</option>
                    <option value="Trax Logistics">Trax Logistics</option>
                    <option value="M&P Express">M&P Express</option>
                    <option value="Call Courier">Call Courier</option>
                    <option value="PostEx Courier">PostEx Courier</option>
                  </select>
                </div>

                {/* SINGLE UNIFIED BUTTON: Print & Save as PDF */}
                <button
                  onClick={handlePrintAndSavePdf}
                  disabled={isDownloadingPdf}
                  className="px-5 py-2 bg-burgundy text-cream text-xs tracking-wider uppercase font-semibold hover:bg-espresso transition-colors rounded cursor-pointer shadow flex items-center gap-2 disabled:opacity-50"
                  title={`Print directly or Save ${printOrder.id.replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`}
                >
                  <span>🖨️</span>
                  <span>{isDownloadingPdf ? "⏳ Generating..." : "Print / Save as PDF"}</span>
                </button>

                <button
                  onClick={() => setPrintOrder(null)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP CONTAINER (Corporate Airway Bill Format) */}
            <div id="printable-shipping-slip" className="bg-white text-black p-6 border-2 border-black rounded-none text-xs space-y-3 font-sans max-w-[760px] mx-auto">
              {/* Header: SOHO Perfume & Carrier Box */}
              <div className="border-b-2 border-black pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black tracking-wider uppercase font-serif text-black leading-none">
                        SOHO Fragrance
                      </span>
                      <span className="border border-black text-[9px] font-mono font-bold px-1.5 py-0.2 uppercase tracking-wider bg-gray-100">
                        Official Store
                      </span>
                    </div>
                    <div className="text-[10px] font-mono font-bold tracking-widest text-gray-700 uppercase">
                      Luxury Fragrance Logistics & Airway Bill
                    </div>
                    <div className="text-[10px] font-mono text-black font-semibold">
                      Store: www.sohofragrance.com · UAN: +92 300 1234567 · NTN: 8942105-3
                    </div>
                  </div>

                  {/* Carrier Partner Box */}
                  <div className="text-right">
                    <div className="border-2 border-black px-3 py-1 bg-gray-100 inline-block text-center">
                      <span className="text-[9px] font-mono uppercase tracking-widest block font-bold text-gray-600">Carrier Partner</span>
                      <span className="text-sm font-mono font-black uppercase text-black">{selectedCourier}</span>
                    </div>
                  </div>
                </div>

                {/* Barcode & Booking Reference Strip */}
                <div className="mt-2.5 pt-2 border-t border-dashed border-gray-400 flex items-center justify-between">
                  <div className="text-xs font-mono space-y-0.5">
                    <div>BOOKING REF: <strong className="text-sm tracking-wider">{printOrder.id}</strong></div>
                    <div className="text-[10px] text-gray-600">
                      BOOKING DATE: <strong>{printOrder.date}</strong> · SERVICE: <strong>OVERNIGHT COD</strong>
                    </div>
                  </div>
                  <div>
                    <OrderBarcode value={printOrder.id} />
                  </div>
                </div>
              </div>

              {/* Delivery Details: Recipient (To) and Merchant (From) */}
              <div className="grid grid-cols-2 divide-x-2 divide-black border-b-2 border-black">
                {/* Consignee (Customer Destination) */}
                <div className="p-3 space-y-1 bg-white pr-4">
                  <div className="border-b border-black pb-1 mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                      CONSIGNEE (DELIVER TO):
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">Destination</span>
                  </div>
                  <p className="text-base font-black text-black leading-tight">{printOrder.customer}</p>
                  <p className="font-mono font-bold text-sm text-black">TEL: {printOrder.phone}</p>
                  <p className="text-xs font-mono text-gray-700">{printOrder.email}</p>
                  <div className="mt-2 pt-1 border-t border-gray-300">
                    <p className="text-xs font-semibold text-black leading-snug">
                      {printOrder.address}
                    </p>
                    <div className="mt-2 p-1.5 bg-gray-100 border border-black inline-block text-xs font-black uppercase tracking-wider font-mono">
                      DESTINATION: {printOrder.city}, {printOrder.province || "PAKISTAN"}
                    </div>
                  </div>
                </div>

                {/* Shipper (Origin & Return Address) */}
                <div className="p-3 space-y-1 bg-white pl-4">
                  <div className="border-b border-black pb-1 mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                      SHIPPER (ORIGIN / RETURN):
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">Karachi Hub</span>
                  </div>
                  <p className="text-sm font-black text-black">SOHO Fragrance (PVT) LTD.</p>
                  <p className="text-xs text-gray-800">Dispatch Atelier: Suite 402, Clifton Luxury Towers, Karachi</p>
                  <p className="text-xs font-mono font-bold text-black">Web: www.sohofragrance.com</p>
                  <p className="text-xs font-mono text-black">Support: +92 300 1234567</p>
                  <p className="text-xs font-mono text-gray-700">Email: care@sohofragrance.com</p>
                  <p className="text-[10px] text-gray-600 mt-2 italic">
                    Return Note: If undelivered, return immediately to Karachi Dispatch Fulfillment Center.
                  </p>
                </div>
              </div>

              {/* Payment Terms & High-Visibility COD Box */}
              <div className="border-b-2 border-black p-3 bg-gray-50">
                {printOrder.payment.toLowerCase().includes("cod") || printOrder.payment.toLowerCase().includes("cash") ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600 block">
                        PAYMENT TERMS / COLLECTION MODE
                      </span>
                      <span className="text-base font-mono font-black text-black">CASH ON DELIVERY (COD)</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        Courier must collect exact cash amount before handing over parcel.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700 block">
                        TOTAL CASH TO COLLECT (PKR)
                      </span>
                      <div className="text-2xl font-black font-mono text-black border-2 border-black bg-white px-4 py-1 inline-block mt-0.5 shadow-xs">
                        {formatPKR(printOrder.amount)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600 block">
                        PAYMENT TERMS / COLLECTION MODE
                      </span>
                      <span className="text-base font-mono font-black text-black">PREPAID / BANK TRANSFER</span>
                      {printOrder.transactionRef && (
                        <span className="text-xs font-mono block text-gray-700 mt-0.5">
                          TID / Ref: <strong>{printOrder.transactionRef}</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700 block">
                        CASH COLLECTION
                      </span>
                      <div className="text-lg font-black font-mono text-black border-2 border-black bg-white px-3 py-1 inline-block mt-0.5">
                        DO NOT COLLECT CASH (PAID)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Manifest Table */}
              <div className="border-b-2 border-black">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black font-mono text-[11px]">
                      <th className="border-r border-black p-2 text-left font-bold w-12">SR #</th>
                      <th className="border-r border-black p-2 text-left font-bold">ITEM DESCRIPTION & SPECIFICATION</th>
                      <th className="border-r border-black p-2 text-center font-bold w-20">PIECES</th>
                      <th className="border-r border-black p-2 text-center font-bold w-24">WEIGHT</th>
                      <th className="p-2 text-right font-bold w-32">TOTAL (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black font-mono">
                      <td className="border-r border-black p-2 text-center">01</td>
                      <td className="border-r border-black p-2 font-sans font-medium">{printOrder.items}</td>
                      <td className="border-r border-black p-2 text-center font-bold">1 Pc</td>
                      <td className="border-r border-black p-2 text-center">0.50 KG</td>
                      <td className="p-2 text-right font-bold">{formatPKR(printOrder.amount)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="font-mono bg-gray-50 font-bold">
                      <td colSpan={4} className="border-r border-black p-2 text-right uppercase tracking-wider text-xs">
                        Total Consignment Value:
                      </td>
                      <td className="p-2 text-right font-black text-sm">
                        {formatPKR(printOrder.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Security, Instructions & Scannable QR */}
              <div className="grid grid-cols-4 gap-4 border-b-2 border-black p-3 items-center">
                <div className="col-span-3 space-y-2">
                  <div className="border border-black p-2 bg-gray-100 text-[10px] font-mono font-bold leading-relaxed text-black">
                    <span className="underline">FRAGILE CONSIGNMENT:</span> CONTAINS LUXURY GLASS PERFUME BOTTLES. HANDLE WITH EXTREME CARE. DO NOT DROP, CRUSH OR SHAKE.
                  </div>
                  <div className="text-[10px] font-mono text-gray-700 leading-tight space-y-0.5">
                    <p>· <strong>Rider Instruction:</strong> Contact consignee prior to delivery. Open-box inspection strictly not allowed prior to COD payment.</p>
                    <p>· <strong>Customer Support:</strong> For queries, contact <strong>+92 300 1234567</strong> or <strong>care@sohofragrance.com</strong>.</p>
                  </div>
                </div>

                {/* 2D Scannable QR Code */}
                <div className="flex flex-col items-center justify-center text-center">
                  <OrderQRCode url={`${window.location.origin}/track-order?id=${encodeURIComponent(printOrder.id)}`} />
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider mt-1 text-black">
                    Digital POD Scan
                  </span>
                </div>
              </div>

              {/* Proof of Delivery (POD) Signatures */}
              <div className="grid grid-cols-3 gap-4 p-3 pt-3 text-[10px] font-mono text-gray-800">
                <div className="border-t border-dashed border-black pt-1 text-center">
                  Dispatcher Signature & Stamp
                </div>
                <div className="border-t border-dashed border-black pt-1 text-center">
                  {selectedCourier} Courier Signature
                </div>
                <div className="border-t border-dashed border-black pt-1 text-center">
                  Consignee Signature, Date & CNIC
                </div>
              </div>

              {/* Corporate Footer */}
              <div className="pt-2 border-t border-black flex items-center justify-between text-[9px] font-mono text-gray-600 px-1 pb-1">
                <span>SOHO Fragrance OFFICIAL DELIVERY MANIFEST · AUTHENTICITY GUARANTEED</span>
                <span>OFFICIAL STORE: WWW.SOHOFRAGRANCE.COM · HELPLINE: 0300-1234567</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Full-View Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-white p-2 rounded shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-burgundy text-cream rounded-full flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:bg-espresso"
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt="Full Receipt"
              className="max-h-[85vh] max-w-full object-contain rounded"
            />
            <div className="text-center pt-2">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-champagne hover:underline"
              >
                Open in new browser tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
