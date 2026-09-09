import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useStore, cartTotal } from "../store/store";
import { formatPKR, fetchProducts } from "../data/products";
import { useBrandStats } from "../context/BrandStatsContext";

interface PaymentAccounts {
  bank: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchName: string;
    branchCode: string;
    instructions: string;
  };
  jazzcash: {
    accountTitle: string;
    accountNumber: string;
    tillId?: string;
    instructions: string;
  };
  easypaisa: {
    accountTitle: string;
    accountNumber: string;
    tillId?: string;
    instructions: string;
  };
  nayapay: {
    accountTitle: string;
    accountNumber: string;
    nayapayId?: string;
    instructions: string;
  };
  sadapay: {
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    instructions: string;
  };
  raast: {
    accountTitle: string;
    accountNumber: string;
    linkedBank?: string;
    instructions: string;
  };
}

const defaultPaymentAccounts: PaymentAccounts = {
  bank: {
    bankName: "Meezan Bank Ltd.",
    accountTitle: "SOHO Fragrance Pvt Ltd",
    accountNumber: "0102-0106123456",
    iban: "PK42MEZN0001020106123456",
    branchName: "Zamzama Branch, Karachi",
    branchCode: "0102",
    instructions: "Please transfer the exact order amount via online banking / ATM transfer and upload the payment receipt below."
  },
  jazzcash: {
    accountTitle: "SOHO Fragrance Pvt Ltd",
    accountNumber: "0300-1234567",
    tillId: "998877",
    instructions: "Send money via JazzCash App or dial *786# to this mobile account. Upload transaction receipt below."
  },
  easypaisa: {
    accountTitle: "SOHO Fragrance Pvt Ltd",
    accountNumber: "0345-1234567",
    tillId: "887766",
    instructions: "Send money via Easypaisa App or dial *786# to this mobile account. Upload transaction receipt below."
  },
  nayapay: {
    accountTitle: "",
    accountNumber: "",
    nayapayId: "",
    instructions: "Transfer via NayaPay app to our registered mobile account or NayaPay ID and upload transaction receipt."
  },
  sadapay: {
    accountTitle: "SOHO Fragrance Pvt Ltd",
    accountNumber: "0300-1234567",
    iban: "PK55SADA0000001234567890",
    instructions: "Transfer via SadaPay app or send to our SadaBiz IBAN and upload payment confirmation."
  },
  raast: {
    accountTitle: "SOHO Fragrance Pvt Ltd",
    accountNumber: "0300-1234567",
    linkedBank: "Meezan Bank Ltd.",
    instructions: "Instant zero-fee transfer via Raast ID. Attach payment receipt below."
  }
};

const defaultPaymentMethods = [
  { id: "bank", label: "Bank Transfer", desc: "Transfer directly to verified official bank account" },
  { id: "easypaisa", label: "JazzCash / Easypaisa", desc: "Instant mobile wallet transfer" },
  { id: "nayapay", label: "NayaPay", desc: "Instant NayaPay digital wallet transfer" },
  { id: "cod", label: "Cash on Delivery", desc: "Pay cash upon receiving your order" },
];

const provinces = ["Sindh", "Punjab", "KPK", "Balochistan", "AJK", "GB", "Islamabad"];

export default function Checkout() {
  const { state, dispatch } = useStore();
  const { refreshStats } = useBrandStats();
  const total = cartTotal(state.cart);

  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  useEffect(() => {
    fetchProducts().then(prods => {
      if (Array.isArray(prods)) setCatalogProducts(prods);
    });
  }, []);

  const getProductDeliveryCharge = (item: any) => {
    const found = catalogProducts.find(p => p.id === item.productId || p.slug === item.slug);
    if (found && found.deliveryCharge !== undefined) return Number(found.deliveryCharge) || 0;
    return Number(item.deliveryCharge) || 0;
  };

  // Delivery charges: sum of custom product delivery charges if configured, or standard shipping rule
  const customDeliveryCharge = state.cart.reduce((sum, item) => sum + (getProductDeliveryCharge(item) * item.quantity), 0);
  const hasCustomDelivery = state.cart.some(item => getProductDeliveryCharge(item) > 0);
  const standardShipping = total >= 5000 ? 0 : 200;
  const effectiveDeliveryCharge = hasCustomDelivery ? customDeliveryCharge : standardShipping;

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, total + effectiveDeliveryCharge - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCodeInput.trim(), orderAmount: total })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponError("");
      } else {
        setCouponError(data.message || "Invalid coupon code.");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
  };

  const [paymentMethods, setPaymentMethods] = useState(defaultPaymentMethods);
  const [payment, setPayment] = useState("bank");
  const [accounts, setAccounts] = useState<PaymentAccounts>(defaultPaymentAccounts);
  const [mobileWalletSub, setMobileWalletSub] = useState<"jazzcash" | "easypaisa">("jazzcash");
  const [digitalWalletSub, setDigitalWalletSub] = useState<"nayapay" | "sadapay">("nayapay");

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

    const loadConfigData = async () => {
      // 1. Load active gateways
      try {
        const res = await fetch(`${apiBase}/config/gateways`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            const activeIds = data.filter((g: any) => g.active).map((g: any) => g.id);
            const filtered = defaultPaymentMethods.filter((pm) => 
              activeIds.includes(pm.id) || 
              (pm.id === "easypaisa" && (activeIds.includes("easypaisa") || activeIds.includes("jazzcash"))) ||
              (pm.id === "nayapay" && (activeIds.includes("nayapay") || activeIds.includes("sadapay")))
            );
            if (filtered.length > 0) {
              setPaymentMethods(filtered);
              setPayment(filtered[0].id);
            } else {
              setPaymentMethods(defaultPaymentMethods);
              setPayment("bank");
            }
          }
        }
      } catch (err) {}

      // 2. Load dynamic official payment accounts
      try {
        const aRes = await fetch(`${apiBase}/config/payment_accounts`);
        if (aRes.ok) {
          const aData = await aRes.json();
          if (aData && typeof aData === "object" && aData.bank) {
            let nayapayIdVal = aData.nayapay?.nayapayId || "";
            try {
              const npRes = await fetch(`${apiBase}/config/nayapay_id`);
              if (npRes.ok) {
                const npVal = await npRes.json();
                if (typeof npVal === "string" && npVal.trim() !== "") {
                  nayapayIdVal = npVal.trim();
                }
              }
            } catch (e) {}

            setAccounts(prev => ({
              bank: { ...prev.bank, ...aData.bank },
              jazzcash: { ...prev.jazzcash, ...aData.jazzcash },
              easypaisa: { ...prev.easypaisa, ...aData.easypaisa },
              nayapay: { ...prev.nayapay, ...aData.nayapay, nayapayId: nayapayIdVal },
              sadapay: { ...prev.sadapay, ...aData.sadapay },
              raast: { ...prev.raast, ...aData.raast },
            }));
            // Update bank desc
            setPaymentMethods(prev => prev.map(pm => pm.id === "bank" ? { ...pm, desc: `Transfer directly to ${aData.bank.bankName || "our official bank"} account` } : pm));
          }
        }
      } catch (err) {
        console.error("Error fetching payment accounts on checkout:", err);
      }
    };

    loadConfigData();
  }, []);

  const [step, setStep] = useState<"info" | "payment" | "confirm">("info");
  const [form, setForm] = useState({
    name: state.user?.name || "",
    phone: "",
    email: state.user?.email || "",
    address: "",
    city: "",
    province: "Sindh",
    postal: "",
    notes: ""
  });

  useEffect(() => {
    if (state.user) {
      setForm((f) => ({
        ...f,
        name: f.name || state.user?.name || "",
        email: f.email || state.user?.email || "",
      }));
    }
  }, [state.user]);

  const [ordered, setOrdered] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [placedOrderStatus, setPlacedOrderStatus] = useState("Pending");

  // Payment proof states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage("File size exceeds 5MB limit. Please choose a smaller image.");
        return;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setAlertMessage("Security check: Only JPG, PNG, or WebP screenshot images are allowed.");
        return;
      }
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      setAlertMessage("Customer Full Name is mandatory to proceed.");
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
      setAlertMessage("A valid Phone Number (minimum 10-11 digits) is mandatory for courier delivery.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@") || !form.email.includes(".")) {
      setAlertMessage("A valid Email Address is mandatory to receive your order invoice and tracking details.");
      return;
    }
    if (!form.city.trim() || form.city.trim().length < 2) {
      setAlertMessage("Destination City is mandatory for delivery.");
      return;
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      setAlertMessage("Complete Street Address (House No, Street, Area) is mandatory.");
      return;
    }
    setStep("payment");
  };

  const handleOrderSubmission = async () => {
    // Validate mandatory customer details
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim() || !form.city.trim()) {
      setAlertMessage("Customer Full Name, Phone Number, Email, City, and Street Address are mandatory to place an order.");
      setStep("info");
      return;
    }

    const isManualPayment = payment !== "cod";

    // Validate if receipt or TID is provided for manual payments
    if (isManualPayment && !receiptFile && !transactionRef.trim()) {
      setAlertMessage("Please upload your payment transfer receipt screenshot or enter your Transaction Reference ID (TID) to proceed.");
      return;
    }

    setIsSubmittingOrder(true);
    let uploadedReceiptUrl = "";

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      // 1. Upload receipt if selected
      if (receiptFile) {
        const formData = new FormData();
        formData.append("receipt", receiptFile);

        const uploadHeaders: Record<string, string> = {};
        if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;

        const uploadRes = await fetch(`${apiBase}/orders/upload-receipt`, {
          method: "POST",
          headers: uploadHeaders,
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload payment receipt.");
        }
        uploadedReceiptUrl = uploadData.receiptUrl;
      }

      // 2. Place Order
      const orderTotal = grandTotal;
      const itemsSummary = state.cart.map((item) => `${item.name} ${item.size} × ${item.quantity}`).join(", ");

      const orderData = {
        userId: (state.user as any)?.id,
        customer: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        items: itemsSummary,
        amount: orderTotal,
        deliveryCharge: effectiveDeliveryCharge,
        couponCode: appliedCoupon?.code || "",
        discountAmount: discountAmount || 0,
        payment: paymentMethods.find((p) => p.id === payment)?.label || "Bank Transfer",
        city: form.city.trim(),
        address: form.address.trim(),
        province: form.province,
        cart: state.cart,
        paymentReceipt: uploadedReceiptUrl,
        transactionRef: transactionRef.trim(),
      };

      const orderHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) orderHeaders["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: orderHeaders,
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order placement failed.");
      }

      setCreatedOrderId(data.orderId);
      setPlacedOrderStatus(data.status || (isManualPayment ? "Pending Verification" : "Pending"));

      // Cache placed order into localStorage so user always sees it instantly in Account order history
      try {
        const savedOrdersRaw = localStorage.getItem("soho_user_orders");
        const existingOrders = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
        const newOrderObj = data.order || {
          id: data.orderId,
          date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          amount: orderTotal,
          status: data.status || (isManualPayment ? "Pending Verification" : "Pending"),
          items: itemsSummary,
          payment: paymentMethods.find((p) => p.id === payment)?.label || "Bank Transfer",
          city: form.city.trim(),
        };
        const updatedOrders = [newOrderObj, ...existingOrders.filter((o: any) => o.id !== newOrderObj.id)];
        localStorage.setItem("soho_user_orders", JSON.stringify(updatedOrders));
      } catch (cacheErr) {
        console.error("Failed to cache placed order in localStorage:", cacheErr);
      }

      // Reload products list in background to sync stock levels
      fetchProducts();
      refreshStats();

      dispatch({ type: "CLEAR_CART" });
      setOrdered(true);
    } catch (err: any) {
      setAlertMessage(err.message || "Failed to place order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Order Confirmed / Pending Verification Screen
  if (ordered) {
    const isVerificationPending = placedOrderStatus === "Pending Verification";

    return (
      <div className="min-h-screen bg-ivory pt-16 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-lg bg-white border border-cream p-8 shadow-xl rounded-sm">
          {isVerificationPending ? (
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6 text-green-700">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          <h1 className="font-display text-3xl text-dark-text mb-2">
            {isVerificationPending ? "Payment Proof Received" : "Order Confirmed"}
          </h1>
          
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 tracking-wider uppercase bg-champagne/10 text-burgundy border border-champagne/30">
            {isVerificationPending ? "⏳ Payment Verification Pending" : "✓ Cash On Delivery Logged"}
          </div>

          <p className="text-sm text-dark-text font-medium">Thank you, {form.name || "valued customer"}.</p>

          <div className="my-5 p-4 bg-ivory border border-cream rounded-sm text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-text uppercase tracking-wider">Tracking Number</span>
              <span className="font-bold font-mono text-base text-burgundy">{createdOrderId}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-text">Selected Payment</span>
              <span className="font-medium text-dark-text">{paymentMethods.find((p) => p.id === payment)?.label}</span>
            </div>
            {transactionRef && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-text">Submitted TID</span>
                <span className="font-mono text-dark-text">{transactionRef}</span>
              </div>
            )}
          </div>

          <p className="text-muted-text text-xs leading-relaxed mb-6">
            {isVerificationPending ? (
              <>
                Your payment screenshot has been uploaded to our finance system. Our accounts team will review and verify your transaction against our bank statement.
                <br /><br />
                Once approved, you will receive an official <strong>Order Confirmation Email</strong> at <strong>{form.email || "your email address"}</strong> with your invoice and packaging tracking.
              </>
            ) : (
              <>
                Your order is confirmed and will be dispatched to <strong>{form.address}, {form.city}</strong>. Please have exact cash ready at the time of delivery.
              </>
            )}
          </p>

          <p className="text-xs tracking-[0.3em] text-champagne italic font-display mb-8">"Scent Becomes Memory."</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/track-order?id=${encodeURIComponent(createdOrderId)}`}
              className="px-6 py-3 bg-burgundy text-cream text-xs tracking-[0.25em] uppercase font-semibold hover:bg-espresso transition-colors rounded-sm cursor-pointer"
            >
              Track Order Status
            </Link>
            <Link
              to="/"
              className="px-6 py-3 border border-champagne text-champagne text-xs tracking-[0.2em] uppercase hover:bg-champagne hover:text-dark-text transition-all rounded-sm cursor-pointer"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link to="/cart" className="text-xs text-muted-text hover:text-champagne transition-colors tracking-wider">
          ← Back to Cart
        </Link>
        <h1 className="font-display text-4xl text-dark-text mt-4 mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-10 text-xs tracking-[0.15em] uppercase">
          {(["info", "payment", "confirm"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-4">
              {i > 0 && <div className="w-8 h-px bg-warm-taupe/40" />}
              <div className={`flex items-center gap-2 ${step === s ? "text-dark-text" : s < step ? "text-champagne" : "text-muted-text/40"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? "bg-burgundy text-cream" : s < step ? "bg-champagne text-dark-text" : "bg-cream text-muted-text"}`}>
                  {i + 1}
                </div>
                <span className="hidden sm:block">{s === "info" ? "Delivery Info" : s === "payment" ? "Payment" : "Confirm"}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form Content */}
          <div className="lg:col-span-2">
            {/* STEP 1: Delivery Information */}
            {step === "info" && (
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div className="flex items-center justify-between border-b border-champagne/20 pb-2">
                  <h2 className="font-display text-2xl text-dark-text">Delivery Information</h2>
                  <span className="text-[11px] text-muted-text">
                    Fields marked with <span className="text-red-600 font-bold">*</span> are mandatory
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="name">
                      Full Name <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="phone">
                      Phone Number <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm font-mono-custom"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="email">
                      Email Address <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="city">
                      City <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      placeholder="e.g. Karachi, Lahore, Islamabad"
                      className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="address">
                    Complete Street Address (House No, Street, Area) <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="House/Flat No, Street, Sector / Area"
                    className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="province">Province</label>
                    <select id="province" value={form.province} onChange={(e) => update("province", e.target.value)} className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm focus:outline-none focus:border-champagne rounded-sm">
                      {provinces.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="postal">Postal Code</label>
                    <input id="postal" type="text" value={form.postal} onChange={(e) => update("postal", e.target.value)} placeholder="74000" className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm font-mono-custom" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="notes">Order Notes (Optional)</label>
                  <textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Any special instructions for courier rider..." className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm resize-none" />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors cursor-pointer"
                >
                  Continue to Payment →
                </button>
              </form>
            )}

            {/* STEP 2: Payment Selection & Bank Receipt Upload */}
            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl text-dark-text">Select Payment Method</h2>
                
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <label
                      key={pm.id}
                      className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                        payment === pm.id ? "border-champagne bg-champagne/5" : "border-warm-taupe/30 hover:border-champagne/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={payment === pm.id}
                        onChange={() => setPayment(pm.id)}
                        className="accent-champagne"
                      />
                      <div>
                        <div className="text-sm font-medium text-dark-text">{pm.label}</div>
                        <div className="text-xs text-muted-text">{pm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* DYNAMIC RECEIVING ACCOUNT CARDS BASED ON SELECTED METHOD */}
                {payment !== "cod" && (
                  <div className="space-y-4 animate-fade-in">
                    {/* 1. BANK DIRECT TRANSFER */}
                    {payment === "bank" && (
                      <div className="p-5 bg-cream rounded-sm border border-champagne/40 space-y-3">
                        <div className="flex justify-between items-center border-b border-champagne/30 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">🏦</span>
                            <span className="font-display font-semibold text-dark-text text-base">Official Bank Account</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider bg-burgundy/10 text-burgundy px-2 py-0.5 rounded font-medium">
                            Verified Merchant
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-text uppercase tracking-wider text-[10px]">Bank Name</p>
                            <p className="font-semibold text-dark-text text-sm">{accounts.bank.bankName || "Meezan Bank Ltd."}</p>
                          </div>
                          <div>
                            <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                            <p className="font-semibold text-dark-text text-sm">{accounts.bank.accountTitle || "SOHO Fragrance Pvt Ltd"}</p>
                          </div>
                          <div>
                            <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Number</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono-custom font-bold text-dark-text text-sm">
                                {accounts.bank.accountNumber || "0102-0106123456"}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard((accounts.bank.accountNumber || "01020106123456").replace(/[\s-]/g, ""), "acc")}
                                className="text-[10px] text-champagne hover:text-burgundy underline uppercase cursor-pointer font-semibold"
                              >
                                {copiedKey === "acc" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-text uppercase tracking-wider text-[10px]">IBAN</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono-custom font-bold text-dark-text text-xs break-all">
                                {accounts.bank.iban || "PK42MEZN0001020106123456"}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard((accounts.bank.iban || "PK42MEZN0001020106123456").replace(/[\s-]/g, ""), "iban")}
                                className="text-[10px] text-champagne hover:text-burgundy underline uppercase cursor-pointer font-semibold"
                              >
                                {copiedKey === "iban" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {(accounts.bank.branchName || accounts.bank.branchCode) && (
                          <div className="pt-2 border-t border-champagne/20 text-xs text-muted-text">
                            <span>
                              Branch: <strong className="text-dark-text">{accounts.bank.branchName || "Main"}</strong>
                              {accounts.bank.branchCode ? ` (Branch Code: ${accounts.bank.branchCode})` : ""}
                            </span>
                          </div>
                        )}

                        {accounts.bank.instructions && (
                          <div className="pt-2 border-t border-champagne/20 text-[11px] text-muted-text italic">
                            "{accounts.bank.instructions}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. JAZZCASH / EASYPAISA MOBILE WALLET */}
                    {(payment === "easypaisa" || payment === "jazzcash") && (
                      <div className="space-y-3">
                        {/* Sub-toggle between JazzCash and Easypaisa */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMobileWalletSub("jazzcash")}
                            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-sm border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              mobileWalletSub === "jazzcash"
                                ? "bg-orange-50 border-orange-400 text-orange-800 shadow-sm"
                                : "bg-white border-cream text-muted-text hover:text-dark-text"
                            }`}
                          >
                            <span>📱</span>
                            <span>JazzCash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMobileWalletSub("easypaisa")}
                            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-sm border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              mobileWalletSub === "easypaisa"
                                ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm"
                                : "bg-white border-cream text-muted-text hover:text-dark-text"
                            }`}
                          >
                            <span>📲</span>
                            <span>Easypaisa</span>
                          </button>
                        </div>

                        {mobileWalletSub === "jazzcash" ? (
                          <div className="p-5 bg-amber-50/50 rounded-sm border border-orange-200/80 space-y-3 shadow-inner animate-fade-in">
                            <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">📱</span>
                                <span className="font-display font-semibold text-dark-text text-base">JazzCash Mobile Account</span>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider bg-orange-100 text-orange-900 font-bold px-2 py-0.5 rounded">
                                Verified
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                                <p className="font-semibold text-dark-text text-sm">{accounts.jazzcash.accountTitle || "SOHO Fragrance Pvt Ltd"}</p>
                              </div>
                              <div>
                                <p className="text-muted-text uppercase tracking-wider text-[10px]">JazzCash Mobile Number</p>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-custom font-bold text-orange-900 text-sm">
                                    {accounts.jazzcash.accountNumber || "0300-1234567"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard((accounts.jazzcash.accountNumber || "03001234567").replace(/[\s-]/g, ""), "jc")}
                                    className="text-[10px] text-orange-700 hover:text-orange-900 underline uppercase cursor-pointer font-semibold"
                                  >
                                    {copiedKey === "jc" ? "Copied!" : "Copy"}
                                  </button>
                                </div>
                              </div>
                              {accounts.jazzcash.tillId && (
                                <div className="sm:col-span-2">
                                  <p className="text-muted-text uppercase tracking-wider text-[10px]">Till ID / Merchant Code</p>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono-custom font-bold text-dark-text text-xs">{accounts.jazzcash.tillId}</span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(accounts.jazzcash.tillId || "", "jctill")}
                                      className="text-[10px] text-orange-700 hover:text-orange-900 underline uppercase cursor-pointer font-semibold"
                                    >
                                      {copiedKey === "jctill" ? "Copied!" : "Copy"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {accounts.jazzcash.instructions && (
                              <div className="pt-2 border-t border-orange-200/40 text-[11px] text-muted-text italic">
                                "{accounts.jazzcash.instructions}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-5 bg-emerald-50/40 rounded-sm border border-emerald-200/80 space-y-3 shadow-inner animate-fade-in">
                            <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">📲</span>
                                <span className="font-display font-semibold text-dark-text text-base">Easypaisa Mobile Account</span>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                                Verified
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                                <p className="font-semibold text-dark-text text-sm">{accounts.easypaisa.accountTitle || "SOHO Fragrance Pvt Ltd"}</p>
                              </div>
                              <div>
                                <p className="text-muted-text uppercase tracking-wider text-[10px]">Easypaisa Mobile Number</p>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-custom font-bold text-emerald-900 text-sm">
                                    {accounts.easypaisa.accountNumber || "0345-1234567"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard((accounts.easypaisa.accountNumber || "03451234567").replace(/[\s-]/g, ""), "ep")}
                                    className="text-[10px] text-emerald-700 hover:text-emerald-900 underline uppercase cursor-pointer font-semibold"
                                  >
                                    {copiedKey === "ep" ? "Copied!" : "Copy"}
                                  </button>
                                </div>
                              </div>
                              {accounts.easypaisa.tillId && (
                                <div className="sm:col-span-2">
                                  <p className="text-muted-text uppercase tracking-wider text-[10px]">Till ID / Merchant Code</p>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono-custom font-bold text-dark-text text-xs">{accounts.easypaisa.tillId}</span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(accounts.easypaisa.tillId || "", "eptill")}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-900 underline uppercase cursor-pointer font-semibold"
                                    >
                                      {copiedKey === "eptill" ? "Copied!" : "Copy"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {accounts.easypaisa.instructions && (
                              <div className="pt-2 border-t border-emerald-200/40 text-[11px] text-muted-text italic">
                                "{accounts.easypaisa.instructions}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. NAYAPAY DIGITAL WALLET (PURE NAYAPAY ONLY) */}
                    {payment === "nayapay" && (
                      <div className="p-5 bg-orange-50/40 rounded-sm border border-orange-200/80 space-y-3 shadow-inner animate-fade-in">
                        <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                              <circle cx="16" cy="15" r="1.5" />
                            </svg>
                            <span className="font-display font-semibold text-dark-text text-base">Official NayaPay Account</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider bg-orange-100 text-orange-900 font-bold px-2 py-0.5 rounded">
                            Verified Merchant
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                            <p className="font-semibold text-dark-text text-sm">{accounts.nayapay.accountTitle || "—"}</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-text uppercase tracking-wider text-[10px]">Registered Mobile Number</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono-custom font-bold text-dark-text text-sm">
                                {accounts.nayapay.accountNumber || "—"}
                              </span>
                              {accounts.nayapay.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(accounts.nayapay.accountNumber.replace(/[\s-]/g, ""), "np_num")}
                                  className="text-[10px] text-orange-700 hover:text-orange-900 underline uppercase cursor-pointer font-semibold"
                                >
                                  {copiedKey === "np_num" ? "Copied!" : "Copy"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Only show NayaPay ID if super admin wrote it */}
                          {accounts.nayapay.nayapayId && accounts.nayapay.nayapayId.trim() !== "" && (
                            <div className="sm:col-span-2">
                              <p className="text-muted-text uppercase tracking-wider text-[10px]">NayaPay ID</p>
                              <div className="flex items-center gap-2">
                                <span className="font-mono-custom font-bold text-orange-800 text-sm">
                                  {accounts.nayapay.nayapayId.startsWith("@") ? accounts.nayapay.nayapayId : `@${accounts.nayapay.nayapayId}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(accounts.nayapay.nayapayId ? accounts.nayapay.nayapayId.replace(/^@/, "") : "", "np_id")}
                                  className="text-[10px] text-orange-700 hover:text-orange-900 underline uppercase cursor-pointer font-semibold"
                                >
                                  {copiedKey === "np_id" ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {accounts.nayapay.instructions && (
                          <div className="pt-2 border-t border-orange-200/40 text-[11px] text-muted-text italic">
                            "{accounts.nayapay.instructions}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Receipt Screenshot Upload Zone */}
                    <div className="p-5 bg-white rounded-sm border border-champagne/40 space-y-4">
                      <div>
                        <h3 className="font-display text-sm font-semibold text-dark-text mb-1">
                          Upload Payment Proof / Screenshot
                        </h3>
                        <p className="text-xs text-muted-text">
                          Transfer <strong className="text-burgundy">{formatPKR(total < 5000 ? total + 200 : total)}</strong> to the account above, and attach the screenshot below.
                        </p>
                      </div>

                      {!receiptPreview ? (
                        <label className="border-2 border-dashed border-warm-taupe/40 hover:border-champagne rounded-sm p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-ivory/50">
                          <svg className="w-8 h-8 text-muted-text mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium text-dark-text tracking-wider uppercase">Click or Drag & Drop Payment Slip</span>
                          <span className="text-[10px] text-muted-text mt-1">PNG, JPG, or WebP (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleReceiptChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="relative border border-cream rounded-sm p-3 bg-ivory flex items-center gap-4">
                          <img
                            src={receiptPreview}
                            alt="Receipt Preview"
                            className="w-16 h-20 object-cover rounded-sm border border-cream shadow-sm"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-dark-text">{receiptFile?.name}</p>
                            <p className="text-[10px] text-muted-text mt-0.5">
                              {(receiptFile ? receiptFile.size / 1024 : 0).toFixed(1)} KB · Ready to submit
                            </p>
                            <span className="inline-block mt-2 text-[10px] text-green-700 font-medium">✓ Screenshot Attached</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeReceipt}
                            className="p-2 text-muted-text hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove Receipt"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Optional TID / Reference input */}
                      <div>
                        <label className="text-xs text-muted-text tracking-wider uppercase mb-1.5 block">
                          Transaction Reference Number / TID (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MZN-982143 or JazzCash TID"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          className="w-full px-4 py-3 bg-ivory border border-cream text-sm text-dark-text font-mono-custom placeholder-muted-text/50 focus:outline-none focus:border-champagne rounded-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep("info")} className="px-6 py-3 border border-warm-taupe/40 text-muted-text text-xs tracking-[0.2em] uppercase hover:border-champagne hover:text-dark-text transition-all cursor-pointer">
                    Back
                  </button>
                  <button onClick={() => setStep("confirm")} className="flex-1 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors cursor-pointer">
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Order Review & Placement */}
            {step === "confirm" && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl text-dark-text">Review Your Order</h2>
                
                <div className="p-4 bg-cream rounded-sm space-y-2 text-sm">
                  <p className="font-medium text-dark-text">Delivering to:</p>
                  <p className="text-muted-text">{form.name} · {form.phone}</p>
                  <p className="text-muted-text">{form.address}, {form.city}, {form.province}</p>
                </div>

                <div className="p-4 bg-cream rounded-sm text-sm space-y-2">
                  <p className="font-medium text-dark-text">Payment Details:</p>
                  <p className="text-muted-text">{paymentMethods.find(p => p.id === payment)?.label}</p>
                  
                  {payment !== "cod" && (
                    <div className="pt-2 border-t border-champagne/20 flex items-center justify-between text-xs">
                      <span>Receipt Attached: <strong>{receiptFile ? "Yes (Screenshot attached)" : "Not attached"}</strong></span>
                      {transactionRef && <span>TID: <strong className="font-mono">{transactionRef}</strong></span>}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("payment")} className="px-6 py-3 border border-warm-taupe/40 text-muted-text text-xs tracking-[0.2em] uppercase hover:border-champagne hover:text-dark-text transition-all cursor-pointer">
                    Back
                  </button>
                  <button
                    onClick={handleOrderSubmission}
                    disabled={isSubmittingOrder}
                    className="flex-1 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-cream border-t-transparent animate-spin rounded-full" />
                        <span>Verifying & Placing...</span>
                      </>
                    ) : (
                      <span>Place Order · {formatPKR(grandTotal)}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Summary Sidebar */}
          <div className="bg-cream rounded-sm p-6 h-fit sticky top-24 border border-champagne/30">
            <h3 className="font-display text-lg text-dark-text mb-4">Your Order</h3>
            <div className="space-y-3 mb-4">
              {state.cart.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-3 text-sm">
                  <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-sm border border-cream" />
                  <div className="flex-1">
                    <p className="text-dark-text font-medium text-xs">{item.name}</p>
                    <p className="text-muted-text text-xs">{item.size} × {item.quantity}</p>
                    {item.deliveryCharge && item.deliveryCharge > 0 ? (
                      <p className="text-[10px] text-burgundy">Delivery: {formatPKR(item.deliveryCharge * item.quantity)}</p>
                    ) : null}
                  </div>
                  <span className="font-mono-custom text-xs text-dark-text">{formatPKR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            {/* Promo Code / Coupon Section */}
            <div className="py-3 border-y border-cream my-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-sm">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <span>🏷️</span>
                      <span>{appliedCoupon.code}</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-sm">
                        {appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}% OFF` : `Rs. ${appliedCoupon.discountValue} OFF`}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-0.5">You saved {formatPKR(discountAmount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo / Coupon Code"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value);
                        setCouponError("");
                      }}
                      className="flex-1 bg-ivory border border-cream px-3 py-2 text-xs uppercase tracking-wider rounded-sm focus:outline-none focus:border-champagne"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCodeInput.trim()}
                      className="px-4 py-2 bg-espresso hover:bg-burgundy text-cream text-xs uppercase tracking-wider font-semibold rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                  )}
                </form>
              )}
            </div>

            <div className="space-y-2 text-sm mb-2">
              <div className="flex justify-between"><span className="text-muted-text">Subtotal</span><span className="font-mono-custom">{formatPKR(total)}</span></div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-mono-custom">-{formatPKR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-text">Delivery Charges</span>
                <span className="font-mono-custom text-xs text-dark-text font-medium">
                  {effectiveDeliveryCharge === 0 ? "Free" : formatPKR(effectiveDeliveryCharge)}
                </span>
              </div>
            </div>
            <div className="gold-line my-3" />
            <div className="flex justify-between font-semibold">
              <span className="font-display text-dark-text">Total</span>
              <span className="font-mono-custom text-burgundy">{formatPKR(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notification Popup */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-cream p-8 max-w-sm w-full text-center shadow-2xl rounded-sm animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-display text-lg text-dark-text mb-2 font-semibold">Payment Notice</h3>
            <p className="text-xs text-muted-text leading-relaxed mb-6">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage("")}
              className="w-full py-2.5 bg-burgundy hover:bg-espresso text-cream text-xs tracking-wider uppercase font-semibold transition-colors rounded-sm cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
