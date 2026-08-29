import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useStore, cartTotal } from "../store/store";
import { products, saveStoredProducts, formatPKR, fetchProducts } from "../data/products";

const defaultPaymentMethods = [
  { id: "jazzcash", label: "JazzCash", desc: "Pay with JazzCash mobile wallet" },
  { id: "easypaisa", label: "Easypaisa", desc: "Pay with Easypaisa wallet" },
  { id: "nayapay", label: "NayaPay", desc: "Pay via NayaPay" },
  { id: "sadapay", label: "SadaPay", desc: "Pay via SadaPay" },
  { id: "bank", label: "Bank Transfer", desc: "Direct bank transfer" },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
];

const provinces = ["Sindh", "Punjab", "KPK", "Balochistan", "AJK", "GB", "Islamabad"];

export default function Checkout() {
  const { state, dispatch } = useStore();
  const total = cartTotal(state.cart);
  
  const [paymentMethods, setPaymentMethods] = useState(defaultPaymentMethods);
  const [payment, setPayment] = useState("");

  useEffect(() => {
    const loadActiveGateways = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${apiBase}/config/gateways`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            const activeIds = data.filter((g: any) => g.active).map((g: any) => g.id);
            const filtered = defaultPaymentMethods.filter((pm) => activeIds.includes(pm.id));
            if (filtered.length > 0) {
              setPaymentMethods(filtered);
              setPayment(filtered[0].id);
            } else {
              setPaymentMethods(defaultPaymentMethods);
              setPayment("cod");
            }
            return;
          }
        }
      } catch (err) {}
      setPaymentMethods(defaultPaymentMethods);
      setPayment("cod");
    };
    loadActiveGateways();
  }, []);

  const [step, setStep] = useState<"info" | "payment" | "confirm">("info");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", province: "Sindh", postal: "", notes: ""
  });
  const [ordered, setOrdered] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [walletPhone, setWalletPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const placeOrder = async () => {
    const orderTotal = total < 5000 ? total + 200 : total;
    const itemsSummary = state.cart.map((item) => `${item.name} ${item.size} × ${item.quantity}`).join(", ");
    
    const userStr = localStorage.getItem("soho_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const orderData = {
      customer: form.name,
      phone: form.phone,
      email: form.email,
      items: itemsSummary,
      amount: orderTotal,
      payment: paymentMethods.find((p) => p.id === payment)?.label || "COD",
      city: form.city,
      address: form.address,
      province: form.province,
      cart: state.cart
    };

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order placement failed.");
      }
      setCreatedOrderId(data.orderId);
      
      // Reload products list in background to sync stock levels
      fetchProducts();
      
      dispatch({ type: "CLEAR_CART" });
      setOrdered(true);
    } catch (err: any) {
      setAlertMessage(err.message || "Failed to place order.");
    }
  };

  const handleOrderSubmission = () => {
    if (payment === "cod") {
      placeOrder();
    } else {
      setPaymentStatus("idle");
      setIsOtpStep(false);
      setWalletPhone(form.phone || "");
      setOtp("");
      setShowPaymentModal(true);
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpStep && payment !== "bank") {
      setIsOtpStep(true);
      return;
    }

    setPaymentStatus("processing");
    
    // Simulate payment response delay
    setTimeout(() => {
      setPaymentStatus("success");
      setTimeout(() => {
        setShowPaymentModal(false);
        placeOrder();
      }, 2000);
    }, 2500);
  };

  if (ordered) {
    return (
      <div className="min-h-screen bg-ivory pt-16 flex items-center justify-center px-6">
        <div className="text-center max-w-md bg-white border border-cream p-8 shadow-md rounded-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-dark-text mb-3">Order Confirmed</h1>
          <p className="text-sm text-dark-text font-medium">Thank you, {form.name || "valued customer"}.</p>
          <div className="my-4 p-3 bg-ivory border border-cream rounded-sm">
            <p className="text-xs text-muted-text uppercase tracking-wider">Tracking Number</p>
            <p className="text-lg font-bold font-mono text-burgundy">{createdOrderId}</p>
          </div>
          <p className="text-muted-text text-xs leading-relaxed mb-6">
            Your payment was successful and your order is being processed. A confirmation email containing your receipt and tracking number <strong>{createdOrderId}</strong> has been sent to <strong>{form.email || "your email address"}</strong>.
          </p>
          <p className="text-xs tracking-[0.3em] text-champagne italic font-display mb-8">"Scent Becomes Memory."</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-6 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-espresso transition-colors rounded-sm cursor-pointer">
              Return Home
            </Link>
            <Link to="/collection" className="px-6 py-3 border border-champagne text-champagne text-xs tracking-[0.2em] uppercase hover:bg-champagne hover:text-dark-text transition-all rounded-sm cursor-pointer">
              Shop More
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
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "info" && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl text-dark-text">Delivery Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "name", label: "Full Name", type: "text", placeholder: "Muhammad Ali" },
                    { id: "phone", label: "Phone Number", type: "tel", placeholder: "+92 300 000 0000" },
                    { id: "email", label: "Email Address", type: "email", placeholder: "email@example.com" },
                    { id: "city", label: "City", type: "text", placeholder: "Karachi" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor={field.id}>{field.label}</label>
                      <input
                        id={field.id}
                        type={field.type}
                        value={form[field.id as keyof typeof form]}
                        onChange={(e) => update(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm"
                        required
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="address">Street Address</label>
                  <input id="address" type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="House/Flat No, Street, Area" className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm" required />
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
                    <input id="postal" type="text" value={form.postal} onChange={(e) => update("postal", e.target.value)} placeholder="74000" className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-text tracking-[0.15em] uppercase mb-1.5 block" htmlFor="notes">Order Notes (Optional)</label>
                  <textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Any special instructions..." className="w-full px-4 py-3 bg-cream border border-warm-taupe/40 text-dark-text text-sm placeholder-muted-text/40 focus:outline-none focus:border-champagne rounded-sm resize-none" />
                </div>
                <button
                  onClick={() => setStep("payment")}
                  disabled={!form.name || !form.phone || !form.address || !form.city}
                  className="w-full py-4 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl text-dark-text">Payment Method</h2>
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <label key={pm.id} className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${payment === pm.id ? "border-champagne bg-champagne/5" : "border-warm-taupe/30 hover:border-champagne/50"}`}>
                      <input type="radio" name="payment" value={pm.id} checked={payment === pm.id} onChange={() => setPayment(pm.id)} className="accent-champagne" />
                      <div>
                        <div className="text-sm font-medium text-dark-text">{pm.label}</div>
                        <div className="text-xs text-muted-text">{pm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {payment === "bank" && (
                  <div className="p-4 bg-cream rounded-sm border border-champagne/30 text-sm space-y-1">
                    <p className="font-medium text-dark-text">Bank Transfer Details</p>
                    <p className="text-muted-text">Bank: Meezan Bank</p>
                    <p className="text-muted-text">Account: 0123-4567890-1</p>
                    <p className="text-muted-text">Title: SOHO Fragrance Pvt Ltd</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep("info")} className="px-6 py-3 border border-warm-taupe/40 text-muted-text text-xs tracking-[0.2em] uppercase hover:border-champagne hover:text-dark-text transition-all">
                    Back
                  </button>
                  <button onClick={() => setStep("confirm")} className="flex-1 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors">
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl text-dark-text">Review Your Order</h2>
                <div className="p-4 bg-cream rounded-sm space-y-2 text-sm">
                  <p className="font-medium text-dark-text">Delivering to:</p>
                  <p className="text-muted-text">{form.name} · {form.phone}</p>
                  <p className="text-muted-text">{form.address}, {form.city}, {form.province}</p>
                </div>
                <div className="p-4 bg-cream rounded-sm text-sm">
                  <p className="font-medium text-dark-text mb-1">Payment:</p>
                  <p className="text-muted-text">{paymentMethods.find(p => p.id === payment)?.label}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("payment")} className="px-6 py-3 border border-warm-taupe/40 text-muted-text text-xs tracking-[0.2em] uppercase hover:border-champagne hover:text-dark-text transition-all">
                    Back
                  </button>
                  <button onClick={handleOrderSubmission} className="flex-1 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors cursor-pointer">
                    Place Order · {formatPKR(total < 5000 ? total + 200 : total)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-cream rounded-sm p-6 h-fit sticky top-24">
            <h3 className="font-display text-lg text-dark-text mb-4">Your Order</h3>
            <div className="space-y-3 mb-4">
              {state.cart.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-3 text-sm">
                  <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-sm" />
                  <div className="flex-1">
                    <p className="text-dark-text font-medium text-xs">{item.name}</p>
                    <p className="text-muted-text text-xs">{item.size} × {item.quantity}</p>
                  </div>
                  <span className="font-mono-custom text-xs text-dark-text">{formatPKR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="gold-line mb-4" />
            <div className="space-y-2 text-sm mb-2">
              <div className="flex justify-between"><span className="text-muted-text">Subtotal</span><span className="font-mono-custom">{formatPKR(total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Shipping</span><span className="text-xs text-muted-text">{total >= 5000 ? "Free" : "₨200"}</span></div>
            </div>
            <div className="gold-line my-3" />
            <div className="flex justify-between font-semibold">
              <span className="font-display text-dark-text">Total</span>
              <span className="font-mono-custom text-burgundy">{formatPKR(total < 5000 ? total + 200 : total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Online Payment simulation Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-cream relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-muted-text hover:text-dark-text"
              disabled={paymentStatus === "processing" || paymentStatus === "success"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="text-lg tracking-[0.15em] text-burgundy font-display font-semibold leading-none mb-1">SOHO</div>
              <div className="text-[8px] tracking-[0.35em] text-champagne font-light uppercase">Secured Gateway</div>
            </div>

            {paymentStatus === "idle" && (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="p-3 bg-ivory rounded-sm border border-cream text-center text-xs text-muted-text mb-4">
                  Payable Amount: <strong className="text-dark-text text-sm font-mono-custom">{formatPKR(total < 5000 ? total + 200 : total)}</strong>
                </div>

                {payment !== "bank" ? (
                  <>
                    {!isOtpStep ? (
                      <div>
                        <label className="text-xs text-muted-text tracking-wider uppercase mb-1.5 block">
                          Enter {paymentMethods.find(p => p.id === payment)?.label} Wallet Number
                        </label>
                        <input
                          required
                          type="tel"
                          placeholder="e.g. 03001234567"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-ivory border border-cream text-sm text-dark-text focus:outline-none focus:border-champagne rounded-sm font-mono-custom"
                        />
                        <p className="text-[10px] text-muted-text mt-1.5">A dynamic verification code will be simulated for authorization.</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-muted-text tracking-wider uppercase mb-1.5 block">
                          Enter OTP Code sent to {walletPhone}
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full px-4 py-3 bg-ivory border border-cream text-sm text-dark-text tracking-widest text-center focus:outline-none focus:border-champagne rounded-sm font-mono-custom font-bold text-lg"
                        />
                        <p className="text-[10px] text-muted-text mt-1.5">Simulated code. You can enter any 6 digits to authorize.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-text">Please transfer the amount to the bank account and click "Verify & Complete" to simulate the bank confirmation step.</p>
                    <div className="p-3 bg-ivory border border-cream text-xs space-y-1">
                      <p className="font-semibold text-dark-text">Meezan Bank Ltd.</p>
                      <p className="font-mono">IBAN: PK42MEZN012345678901</p>
                      <p>Title: SOHO Fragrance Pvt Ltd</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-burgundy hover:bg-espresso text-cream text-xs uppercase tracking-[0.25em] font-semibold transition-colors rounded-sm cursor-pointer"
                >
                  {payment === "bank" ? "Verify & Complete" : isOtpStep ? "Verify OTP & Pay" : "Proceed Payment"}
                </button>
              </form>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-burgundy border-t-transparent animate-spin mx-auto" />
                <div>
                  <h3 className="font-semibold text-dark-text">Processing Transaction</h3>
                  <p className="text-xs text-muted-text mt-1">Verifying secure credentials with the bank node...</p>
                </div>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-700">Payment Successful</h3>
                  <p className="text-xs text-muted-text mt-1">Transaction authorized. Finalizing your order...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Centered Error/Notification Popup */}
      {alertMessage && (
        <div className="fixed inset-0 bg-espresso/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-cream p-8 max-w-sm w-full text-center shadow-lg rounded-sm animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-display text-lg text-dark-text mb-2 font-semibold">Notification</h3>
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
