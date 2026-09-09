import { useState, useEffect, useRef } from "react";

export type PaymentMethodKey = "bank" | "jazzcash" | "easypaisa" | "nayapay" | "sadapay" | "raast";

export interface BankAccountConfig {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchName: string;
  branchCode: string;
  instructions: string;
}

export interface MobileWalletConfig {
  accountTitle: string;
  accountNumber: string;
  tillId?: string;
  nayapayId?: string;
  iban?: string;
  linkedBank?: string;
  instructions: string;
}

export interface PaymentAccountsConfig {
  bank: BankAccountConfig;
  jazzcash: MobileWalletConfig;
  easypaisa: MobileWalletConfig;
  nayapay: MobileWalletConfig;
  sadapay: MobileWalletConfig;
  raast: MobileWalletConfig;
}

// Professional Vector SVG Icons for Payment Methods (replacing emojis)
export function BankVectorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 3L2 8h20L12 3z" />
    </svg>
  );
}

export function JazzCashVectorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="M12 18h.01" strokeWidth={2.5} />
      <path d="M9 7h6M9 10h4" />
      <circle cx="15.5" cy="11.5" r="2.5" fill="currentColor" fillOpacity={0.2} />
    </svg>
  );
}

export function EasypaisaVectorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="M12 18h.01" strokeWidth={2.5} />
      <path d="M8.5 7.5h7" />
      <path d="M9 11.5l2 2 4.5-4.5" strokeWidth={2} />
    </svg>
  );
}

export function NayaPayVectorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" strokeWidth={1.5} />
      <rect x="5" y="14" width="3.5" height="2.5" rx="0.5" fill="currentColor" fillOpacity={0.25} />
      <circle cx="17.5" cy="15" r="1.5" />
    </svg>
  );
}

export function RaastVectorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" fill="currentColor" fillOpacity={0.08} />
      <polygon points="13 7 9 13 13 13 11 18 16 12 12 12 13 7" fill="currentColor" fillOpacity={0.2} />
    </svg>
  );
}

const defaultPaymentAccounts: PaymentAccountsConfig = {
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

const defaultGateways = [
  { id: "cod", name: "Cash on Delivery (COD)", active: false, region: "Pakistan Nationwide", fee: "Rs. 0" },
  { id: "bank", name: "Bank Direct Transfer", active: true, region: "Pakistan Local Accounts", fee: "Rs. 0" },
  { id: "jazzcash", name: "JazzCash Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
  { id: "easypaisa", name: "Easypaisa Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
  { id: "nayapay", name: "NayaPay Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
];

export interface PaymentOptionMeta {
  value: PaymentMethodKey;
  label: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  iconBg: string;
  iconColor: string;
}

const paymentMethodOptions: PaymentOptionMeta[] = [
  {
    value: "bank",
    label: "Bank Direct Transfer",
    subtitle: "Meezan, HBL, Alfalah, Standard Chartered & All Pakistani Banks",
    badge: "IBAN Transfer",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    iconBg: "bg-emerald-50 border-emerald-200/80",
    iconColor: "text-emerald-800"
  },
  {
    value: "jazzcash",
    label: "JazzCash Mobile Wallet",
    subtitle: "Registered Mobile Number & Merchant Till ID",
    badge: "Mobile Account",
    badgeBg: "bg-red-50 text-red-800 border-red-200/60",
    iconBg: "bg-red-50 border-red-200/80",
    iconColor: "text-red-700"
  },
  {
    value: "easypaisa",
    label: "Easypaisa Mobile Wallet",
    subtitle: "Registered Mobile Number & Merchant Till Code",
    badge: "Branchless",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    iconBg: "bg-emerald-50 border-emerald-200/80",
    iconColor: "text-emerald-700"
  },
  {
    value: "nayapay",
    label: "NayaPay Digital Wallet",
    subtitle: "Registered Mobile Number & Optional NayaPay ID (@tag)",
    badge: "Digital Wallet",
    badgeBg: "bg-orange-50 text-orange-900 border-orange-200/60",
    iconBg: "bg-orange-50 border-orange-200/80",
    iconColor: "text-orange-700"
  },
  {
    value: "raast",
    label: "Raast Instant Payment (SBP)",
    subtitle: "State Bank of Pakistan Instant Zero-Fee Transfer",
    badge: "SBP Instant",
    badgeBg: "bg-blue-50 text-blue-900 border-blue-200/60",
    iconBg: "bg-blue-50 border-blue-200/80",
    iconColor: "text-blue-700"
  }
];

export function renderMethodIcon(method: PaymentMethodKey, className = "w-5 h-5") {
  switch (method) {
    case "bank":
      return <BankVectorIcon className={className} />;
    case "jazzcash":
      return <JazzCashVectorIcon className={className} />;
    case "easypaisa":
      return <EasypaisaVectorIcon className={className} />;
    case "nayapay":
      return <NayaPayVectorIcon className={className} />;
    case "raast":
      return <RaastVectorIcon className={className} />;
    default:
      return <BankVectorIcon className={className} />;
  }
}

export default function SuperAdminPayments() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>("bank");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [gateways, setGateways] = useState<typeof defaultGateways>(defaultGateways);
  const [accounts, setAccounts] = useState<PaymentAccountsConfig>(defaultPaymentAccounts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load active gateways
      const gRes = await fetch(`${apiBase}/config/gateways`);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData && Array.isArray(gData)) {
          setGateways(gData);
        }
      }

      // 2. Load payment accounts config
      let nayapayIdOverride = "";
      try {
        const npRes = await fetch(`${apiBase}/config/nayapay_id`);
        if (npRes.ok) {
          const npData = await npRes.json();
          if (typeof npData === "string" && npData.trim() !== "") {
            nayapayIdOverride = npData.trim();
          }
        }
      } catch (e) {}

      const aRes = await fetch(`${apiBase}/config/payment_accounts`);
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData && typeof aData === "object" && aData.bank) {
          const finalNayapayId = nayapayIdOverride || aData.nayapay?.nayapayId || "";
          setAccounts({
            bank: { ...defaultPaymentAccounts.bank, ...aData.bank },
            jazzcash: { ...defaultPaymentAccounts.jazzcash, ...aData.jazzcash },
            easypaisa: { ...defaultPaymentAccounts.easypaisa, ...aData.easypaisa },
            nayapay: { ...defaultPaymentAccounts.nayapay, ...aData.nayapay, nayapayId: finalNayapayId },
            sadapay: { ...defaultPaymentAccounts.sadapay, ...aData.sadapay },
            raast: { ...defaultPaymentAccounts.raast, ...aData.raast },
          });
        }
      } else if (nayapayIdOverride) {
        setAccounts(prev => ({
          ...prev,
          nayapay: { ...prev.nayapay, nayapayId: nayapayIdOverride }
        }));
      }
    } catch (err) {
      console.error("Error loading payment accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBankChange = (field: keyof BankAccountConfig, val: string) => {
    setAccounts(prev => ({
      ...prev,
      bank: {
        ...prev.bank,
        [field]: val
      }
    }));
  };

  const handleWalletChange = (method: PaymentMethodKey, field: keyof MobileWalletConfig, val: string) => {
    setAccounts(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: val
      }
    }));
  };

  const saveAllAccounts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const res = await fetch(`${apiBase}/config/payment_accounts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: accounts })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save payment accounts");
      }

      // Explicitly persist nayapay_id in Config collection
      if (accounts.nayapay?.nayapayId !== undefined) {
        await fetch(`${apiBase}/config/nayapay_id`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ value: accounts.nayapay.nayapayId.trim() })
        });
      }

      const activeOption = paymentMethodOptions.find(o => o.value === selectedMethod);
      setMessage({
        type: "success",
        text: `✓ ${activeOption?.label.split(" (")[0] || "Payment account"} details saved to database successfully! Customer checkout will now display these updated details.`
      });
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "An error occurred while saving payment details."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetMethod = () => {
    const activeOption = paymentMethodOptions.find(o => o.value === selectedMethod);
    if (window.confirm(`Are you sure you want to reset ${activeOption?.label} details to default?`)) {
      setAccounts(prev => ({
        ...prev,
        [selectedMethod]: defaultPaymentAccounts[selectedMethod]
      }));
    }
  };

  const toggleGateway = async (idx: number) => {
    const updated = gateways.map((g, i) => (i === idx ? { ...g, active: !g.active } : g));
    setGateways(updated);

    try {
      const userStr = localStorage.getItem("soho_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      await fetch(`${apiBase}/config/gateways`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: updated })
      });
    } catch (err) {
      console.error("Error saving gateways", err);
    }
  };

  const activeOption = paymentMethodOptions.find(o => o.value === selectedMethod) || paymentMethodOptions[0];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-semibold text-dark-text">Payment Gateways & Receiving Accounts</h1>
          <span className="text-[10px] uppercase tracking-wider bg-burgundy/10 text-burgundy font-bold px-2.5 py-0.5 rounded">
            Super Admin
          </span>
        </div>
        <p className="text-sm text-muted-text mt-0.5">
          Activate payment gateways and manage receiving account details (Bank, JazzCash, Easypaisa, NayaPay, SadaPay, Raast).
        </p>
      </div>

      {/* Notification banner */}
      {message && (
        <div
          className={`p-4 rounded-sm border flex items-start justify-between gap-3 text-sm animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs text-muted-text hover:text-dark-text cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: SINGLE FORM WITH DROPDOWN SELECTOR & LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form with Dropdown */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-cream rounded-sm shadow-sm overflow-hidden">
            {/* Form Top Section: Pure Clean Custom Luxury Dropdown Selection */}
            <div className="p-5 border-b border-cream bg-ivory/40 space-y-2.5">
              <label className="block text-xs font-semibold text-dark-text uppercase tracking-wider">
                Select Payment Method to Edit & Configure:
              </label>
              
              {/* THE LUXURY CUSTOM DROPDOWN (with Vector SVG Icons, NO cartoon emojis) */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  id="paymentMethodCustomDropdown"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between p-3.5 bg-white border border-champagne/80 hover:border-burgundy rounded-sm shadow-sm transition-all text-left cursor-pointer group focus:outline-none focus:ring-1 focus:ring-burgundy"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border shadow-xs ${activeOption.iconBg} ${activeOption.iconColor}`}>
                      {renderMethodIcon(selectedMethod, "w-5 h-5")}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-dark-text text-sm sm:text-base">
                          {activeOption.label}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-xs tracking-wider border ${activeOption.badgeBg}`}>
                          {activeOption.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-text truncate mt-0.5">
                        {activeOption.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[11px] text-muted-text font-medium hidden sm:inline group-hover:text-dark-text">Select</span>
                    <div className={`p-1.5 rounded text-dark-text transition-transform duration-200 ${dropdownOpen ? "rotate-180 bg-champagne/20" : "bg-cream/60"}`}>
                      <svg className="w-4 h-4 text-muted-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Dropdown Options Menu */}
                {dropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-champagne/80 rounded-sm shadow-xl overflow-hidden animate-fade-in divide-y divide-cream/60">
                    <div className="px-4 py-2 bg-ivory/60 text-[10px] font-semibold uppercase tracking-wider text-muted-text flex items-center justify-between">
                      <span>Select Payment Account</span>
                      <span>5 Options</span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {paymentMethodOptions.map((opt) => {
                        const isSelected = selectedMethod === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSelectedMethod(opt.value);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer ${
                              isSelected ? "bg-ivory border-l-4 border-burgundy" : "hover:bg-cream/30"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border shadow-xs ${opt.iconBg} ${opt.iconColor}`}>
                                {renderMethodIcon(opt.value, "w-4.5 h-4.5")}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${isSelected ? "font-bold text-burgundy" : "font-medium text-dark-text"}`}>
                                    {opt.label}
                                  </span>
                                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-xs tracking-wider border ${opt.badgeBg}`}>
                                    {opt.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-text truncate mt-0.5">
                                  {opt.subtitle}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="shrink-0 text-burgundy pl-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-[11px] text-muted-text pt-0.5">
                Select an option above to edit its account name, number, and instructions. Whatever you save is shown to buyers choosing this method on checkout.
              </p>
            </div>

            {/* Form Inputs tailored to the selected dropdown option */}
            <form onSubmit={saveAllAccounts} className="p-6 space-y-5">
              {/* 1. BANK TRANSFER FORM */}
              {selectedMethod === "bank" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Bank Name <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.bank.bankName}
                        onChange={(e) => handleBankChange("bankName", e.target.value)}
                        placeholder="e.g. Meezan Bank Ltd. / HBL / Bank Alfalah"
                        className="w-full text-sm px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                      <p className="text-[10px] text-muted-text mt-1">Official bank name</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Account Title (Beneficiary) <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.bank.accountTitle}
                        onChange={(e) => handleBankChange("accountTitle", e.target.value)}
                        placeholder="e.g. SOHO Fragrance Pvt Ltd"
                        className="w-full text-sm font-medium px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                      <p className="text-[10px] text-muted-text mt-1">Beneficiary name registered with bank</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Account Number <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.bank.accountNumber}
                        onChange={(e) => handleBankChange("accountNumber", e.target.value)}
                        placeholder="e.g. 0102-0106123456"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                      <p className="text-[10px] text-muted-text mt-1">Standard bank account number</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        IBAN (24 Characters) <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.bank.iban}
                        onChange={(e) => handleBankChange("iban", e.target.value.toUpperCase())}
                        placeholder="e.g. PK42MEZN0001020106123456"
                        className="w-full text-xs font-mono uppercase px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                      <p className="text-[10px] text-muted-text mt-1">International Bank Account Number</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Branch Name / City
                      </label>
                      <input
                        type="text"
                        value={accounts.bank.branchName}
                        onChange={(e) => handleBankChange("branchName", e.target.value)}
                        placeholder="e.g. Zamzama Branch, Karachi"
                        className="w-full text-sm px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Branch Code
                      </label>
                      <input
                        type="text"
                        value={accounts.bank.branchCode}
                        onChange={(e) => handleBankChange("branchCode", e.target.value)}
                        placeholder="e.g. 0102"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                      Bank Transfer Customer Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={accounts.bank.instructions}
                      onChange={(e) => handleBankChange("instructions", e.target.value)}
                      placeholder="Instructions shown to buyers when selecting Bank Transfer..."
                      className="w-full text-xs px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 2. JAZZCASH FORM */}
              {selectedMethod === "jazzcash" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        JazzCash Account Title <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.jazzcash.accountTitle}
                        onChange={(e) => handleWalletChange("jazzcash", "accountTitle", e.target.value)}
                        placeholder="e.g. SOHO Fragrance Pvt Ltd"
                        className="w-full text-sm font-medium px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                      <p className="text-[10px] text-muted-text mt-1">Name displayed on JazzCash receiver prompt</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        JazzCash Mobile / Account Number <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.jazzcash.accountNumber}
                        onChange={(e) => handleWalletChange("jazzcash", "accountNumber", e.target.value)}
                        placeholder="e.g. 0300-1234567"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                      <p className="text-[10px] text-muted-text mt-1">Registered JazzCash mobile number</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Merchant Till ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={accounts.jazzcash.tillId || ""}
                        onChange={(e) => handleWalletChange("jazzcash", "tillId", e.target.value)}
                        placeholder="e.g. 998877 (leave blank if personal mobile account)"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                      JazzCash Instructions for Customer
                    </label>
                    <textarea
                      rows={2}
                      value={accounts.jazzcash.instructions}
                      onChange={(e) => handleWalletChange("jazzcash", "instructions", e.target.value)}
                      placeholder="e.g. Send money via JazzCash App or dial *786#..."
                      className="w-full text-xs px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 3. EASYPAISA FORM */}
              {selectedMethod === "easypaisa" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Easypaisa Account Title <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.easypaisa.accountTitle}
                        onChange={(e) => handleWalletChange("easypaisa", "accountTitle", e.target.value)}
                        placeholder="e.g. SOHO Fragrance Pvt Ltd"
                        className="w-full text-sm font-medium px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Easypaisa Mobile / Account Number <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.easypaisa.accountNumber}
                        onChange={(e) => handleWalletChange("easypaisa", "accountNumber", e.target.value)}
                        placeholder="e.g. 0345-1234567"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Easypaisa Till ID / Merchant Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={accounts.easypaisa.tillId || ""}
                        onChange={(e) => handleWalletChange("easypaisa", "tillId", e.target.value)}
                        placeholder="e.g. 887766 (optional)"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                      Easypaisa Instructions for Customer
                    </label>
                    <textarea
                      rows={2}
                      value={accounts.easypaisa.instructions}
                      onChange={(e) => handleWalletChange("easypaisa", "instructions", e.target.value)}
                      placeholder="e.g. Send payment via Easypaisa App or dial *786#..."
                      className="w-full text-xs px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 4. NAYAPAY FORM */}
              {selectedMethod === "nayapay" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        NayaPay Account Title <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.nayapay.accountTitle}
                        onChange={(e) => handleWalletChange("nayapay", "accountTitle", e.target.value)}
                        placeholder="e.g. SOHO Fragrance Pvt Ltd"
                        className="w-full text-sm font-medium px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        NayaPay Mobile Number <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.nayapay.accountNumber}
                        onChange={(e) => handleWalletChange("nayapay", "accountNumber", e.target.value)}
                        placeholder="e.g. 0300-1234567"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-dark-text uppercase tracking-wider">
                          NayaPay ID / @Tag (Optional)
                        </label>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          accounts.nayapay.nayapayId && accounts.nayapay.nayapayId.trim() !== ""
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {accounts.nayapay.nayapayId && accounts.nayapay.nayapayId.trim() !== "" ? "Active on Checkout" : "Hidden on Checkout"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="px-3.5 py-2.5 bg-ivory border border-r-0 border-cream text-muted-text text-sm rounded-l-sm font-mono">@</span>
                        <input
                          type="text"
                          value={accounts.nayapay.nayapayId || ""}
                          onChange={(e) => handleWalletChange("nayapay", "nayapayId", e.target.value.replace(/^@/, "").trim())}
                          placeholder="Enter NayaPay ID (leave blank to hide ID from customer checkout)"
                          className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-r-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                        />
                      </div>
                      <p className="text-[10px] text-muted-text mt-1">
                        Agar aap NayaPay ID likhein ge to customer ko checkout pe NayaPay ID show hogi. Agar khali (blank) choren ge to checkout pe NayaPay ID box show nahi hoga.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                      NayaPay Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={accounts.nayapay.instructions}
                      onChange={(e) => handleWalletChange("nayapay", "instructions", e.target.value)}
                      placeholder="Instructions for NayaPay transfer..."
                      className="w-full text-xs px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 5. SADAPAY FORM */}
              {selectedMethod === "sadapay" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        SadaPay Account Title <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.sadapay.accountTitle}
                        onChange={(e) => handleWalletChange("sadapay", "accountTitle", e.target.value)}
                        placeholder="e.g. SOHO Fragrance Pvt Ltd"
                        className="w-full text-sm font-medium px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        SadaPay Mobile Number <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.sadapay.accountNumber}
                        onChange={(e) => handleWalletChange("sadapay", "accountNumber", e.target.value)}
                        placeholder="e.g. 0300-1234567"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        SadaBiz IBAN
                      </label>
                      <input
                        type="text"
                        value={accounts.sadapay.iban || ""}
                        onChange={(e) => handleWalletChange("sadapay", "iban", e.target.value.toUpperCase())}
                        placeholder="e.g. PK55SADA0000001234567890"
                        className="w-full text-xs font-mono uppercase px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                      SadaPay Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={accounts.sadapay.instructions}
                      onChange={(e) => handleWalletChange("sadapay", "instructions", e.target.value)}
                      placeholder="Instructions for SadaPay transfer..."
                      className="w-full text-xs px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 6. RAAST FORM */}
              {selectedMethod === "raast" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Raast Registered Title <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.raast.accountTitle}
                        onChange={(e) => handleWalletChange("raast", "accountTitle", e.target.value)}
                        placeholder="e.g. SOHO Fragrance Pvt Ltd"
                        className="w-full text-sm font-medium px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Raast ID (Mobile / IBAN) <span className="text-burgundy">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accounts.raast.accountNumber}
                        onChange={(e) => handleWalletChange("raast", "accountNumber", e.target.value)}
                        placeholder="e.g. 0300-1234567"
                        className="w-full text-sm font-mono px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                        Linked Bank Name
                      </label>
                      <input
                        type="text"
                        value={accounts.raast.linkedBank || ""}
                        onChange={(e) => handleWalletChange("raast", "linkedBank", e.target.value)}
                        placeholder="e.g. Meezan Bank Ltd. / HBL"
                        className="w-full text-sm px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-text uppercase tracking-wider mb-1.5">
                      Raast Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={accounts.raast.instructions}
                      onChange={(e) => handleWalletChange("raast", "instructions", e.target.value)}
                      placeholder="Instructions for Raast transfers..."
                      className="w-full text-xs px-3.5 py-2.5 border border-cream rounded-sm focus:outline-none focus:border-champagne bg-white text-dark-text resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Form Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-cream">
                <button
                  type="button"
                  onClick={handleResetMethod}
                  className="px-4 py-2 border border-cream hover:bg-ivory text-xs text-muted-text hover:text-dark-text transition-all rounded-sm font-medium cursor-pointer"
                >
                  Reset to Default
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="px-6 py-2.5 bg-burgundy hover:bg-burgundy/90 text-ivory text-xs font-semibold uppercase tracking-wider transition-all rounded-sm shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Save {activeOption.label.split(" (")[0].split(" ")[0]} Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Customer Preview of the Selected Dropdown Method */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-cream rounded-sm shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-cream pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-semibold text-dark-text font-display text-sm">
                  Customer Checkout Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-text uppercase">
                {selectedMethod.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-muted-text">
              This is the exact receiving card buyers see on Checkout when this method is selected. It updates in real time.
            </p>

            {/* PREVIEW: BANK */}
            {selectedMethod === "bank" && (
              <div className="p-5 bg-cream rounded-sm border border-champagne/50 space-y-3 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-champagne/30 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xs bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200/50">
                      <BankVectorIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-dark-text text-sm">Official Bank Account</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-burgundy/10 text-burgundy px-2 py-0.5 rounded font-medium">
                    Verified Merchant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Bank Name</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.bank.bankName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.bank.accountTitle || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Number</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-dark-text text-xs">
                        {accounts.bank.accountNumber || "—"}
                      </span>
                      <span className="text-[9px] text-champagne uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-champagne/30">
                        Copy
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">IBAN</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-dark-text text-[11px] break-all">
                        {accounts.bank.iban || "—"}
                      </span>
                      <span className="text-[9px] text-champagne uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-champagne/30">
                        Copy
                      </span>
                    </div>
                  </div>
                </div>

                {(accounts.bank.branchName || accounts.bank.branchCode) && (
                  <div className="pt-2 border-t border-champagne/20 text-[11px] text-muted-text">
                    <span>Branch: <strong className="text-dark-text">{accounts.bank.branchName || "Main"}</strong> {accounts.bank.branchCode ? `(Code: ${accounts.bank.branchCode})` : ""}</span>
                  </div>
                )}

                {accounts.bank.instructions && (
                  <div className="pt-2 border-t border-champagne/20 text-[11px] text-muted-text italic">
                    "{accounts.bank.instructions}"
                  </div>
                )}
              </div>
            )}

            {/* PREVIEW: JAZZCASH */}
            {selectedMethod === "jazzcash" && (
              <div className="p-5 bg-amber-50/50 rounded-sm border border-orange-200/70 space-y-3 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xs bg-red-100 text-red-800 flex items-center justify-center border border-red-200/50">
                      <JazzCashVectorIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-dark-text text-sm">Official JazzCash Account</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold">
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.jazzcash.accountTitle || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">JazzCash Mobile Number</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-dark-text text-sm text-orange-800">
                        {accounts.jazzcash.accountNumber || "—"}
                      </span>
                      <span className="text-[9px] text-orange-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-orange-200">
                        Copy
                      </span>
                    </div>
                  </div>
                  {accounts.jazzcash.tillId && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-text uppercase tracking-wider text-[10px]">Merchant Till ID</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-custom font-bold text-dark-text text-xs">{accounts.jazzcash.tillId}</span>
                        <span className="text-[9px] text-orange-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-orange-200">
                          Copy
                        </span>
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
            )}

            {/* PREVIEW: EASYPAISA */}
            {selectedMethod === "easypaisa" && (
              <div className="p-5 bg-emerald-50/40 rounded-sm border border-emerald-200/70 space-y-3 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xs bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200/50">
                      <EasypaisaVectorIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-dark-text text-sm">Official Easypaisa Account</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.easypaisa.accountTitle || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Easypaisa Mobile Number</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-dark-text text-sm text-emerald-800">
                        {accounts.easypaisa.accountNumber || "—"}
                      </span>
                      <span className="text-[9px] text-emerald-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        Copy
                      </span>
                    </div>
                  </div>
                  {accounts.easypaisa.tillId && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-text uppercase tracking-wider text-[10px]">Merchant Till ID</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-custom font-bold text-dark-text text-xs">{accounts.easypaisa.tillId}</span>
                        <span className="text-[9px] text-emerald-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                          Copy
                        </span>
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

            {/* PREVIEW: NAYAPAY */}
            {selectedMethod === "nayapay" && (
              <div className="p-5 bg-orange-50/40 rounded-sm border border-orange-200/70 space-y-3 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xs bg-orange-100 text-orange-900 flex items-center justify-center border border-orange-200/50">
                      <NayaPayVectorIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-dark-text text-sm">Official NayaPay Account</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-orange-100 text-orange-900 px-2 py-0.5 rounded font-bold">
                    NayaPay
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.nayapay.accountTitle || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Registered Mobile Number</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-dark-text text-xs">
                        {accounts.nayapay.accountNumber || "—"}
                      </span>
                      <span className="text-[9px] text-orange-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-orange-200">
                        Copy
                      </span>
                    </div>
                  </div>

                  {/* Strictly only show NayaPay ID if provided */}
                  {accounts.nayapay.nayapayId && accounts.nayapay.nayapayId.trim() !== "" ? (
                    <div className="sm:col-span-2">
                      <p className="text-muted-text uppercase tracking-wider text-[10px]">NayaPay ID</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-custom font-bold text-orange-800 text-sm">
                          {accounts.nayapay.nayapayId.startsWith("@") ? accounts.nayapay.nayapayId : `@${accounts.nayapay.nayapayId}`}
                        </span>
                        <span className="text-[9px] text-orange-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-orange-200">
                          Copy
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="sm:col-span-2 bg-orange-100/50 p-2.5 rounded-xs border border-orange-200/50 text-[11px] text-muted-text">
                      <span className="font-semibold text-orange-900">NayaPay ID is blank (optional):</span> On checkout, buyers will only see your Registered Mobile Number.
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

            {/* PREVIEW: SADAPAY */}
            {selectedMethod === "sadapay" && (
              <div className="p-5 bg-purple-50/40 rounded-sm border border-purple-200/70 space-y-3 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-purple-200/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xs bg-purple-100 text-purple-800 flex items-center justify-center border border-purple-200/50">
                      <NayaPayVectorIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-dark-text text-sm">Official SadaPay Account</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                    SadaBiz
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.sadapay.accountTitle || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">SadaPay Mobile Number</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-purple-900 text-sm">
                        {accounts.sadapay.accountNumber || "—"}
                      </span>
                      <span className="text-[9px] text-purple-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-purple-200">
                        Copy
                      </span>
                    </div>
                  </div>
                  {accounts.sadapay.iban && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-text uppercase tracking-wider text-[10px]">SadaBiz IBAN</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-custom font-bold text-dark-text text-xs break-all">{accounts.sadapay.iban}</span>
                        <span className="text-[9px] text-purple-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-purple-200">
                          Copy
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {accounts.sadapay.instructions && (
                  <div className="pt-2 border-t border-purple-200/40 text-[11px] text-muted-text italic">
                    "{accounts.sadapay.instructions}"
                  </div>
                )}
              </div>
            )}

            {/* PREVIEW: RAAST */}
            {selectedMethod === "raast" && (
              <div className="p-5 bg-blue-50/40 rounded-sm border border-blue-200/70 space-y-3 shadow-inner animate-fade-in">
                <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xs bg-blue-100 text-blue-800 flex items-center justify-center border border-blue-200/50">
                      <RaastVectorIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-semibold text-dark-text text-sm">Official Raast Instant Pay</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    SBP Raast
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Account Title</p>
                    <p className="font-semibold text-dark-text text-xs">{accounts.raast.accountTitle || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-text uppercase tracking-wider text-[10px]">Raast ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-custom font-bold text-dark-text text-sm text-blue-900">
                        {accounts.raast.accountNumber || "—"}
                      </span>
                      <span className="text-[9px] text-blue-700 uppercase font-medium bg-white px-1.5 py-0.5 rounded border border-blue-200">
                        Copy
                      </span>
                    </div>
                  </div>
                  {accounts.raast.linkedBank && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-text uppercase tracking-wider text-[10px]">Linked Bank</p>
                      <p className="font-semibold text-dark-text text-xs">{accounts.raast.linkedBank}</p>
                    </div>
                  )}
                </div>

                {accounts.raast.instructions && (
                  <div className="pt-2 border-t border-blue-200/40 text-[11px] text-muted-text italic">
                    "{accounts.raast.instructions}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: ORIGINAL SYSTEM PAYMENT METHODS TABLE (Enable / Disable gateways exactly as before) */}
      <div className="bg-white border border-cream rounded-sm overflow-hidden shadow-sm">
        <div className="p-5 border-b border-cream">
          <h2 className="font-semibold text-dark-text font-display text-lg">System Payment Methods</h2>
          <p className="text-xs text-muted-text mt-0.5">Activate or deactivate checkout payment gateways.</p>
        </div>

        <div className="divide-y divide-cream">
          {gateways.map((g, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-dark-text text-sm">{g.name}</h3>
                <p className="text-xs text-muted-text">Supported Region: {g.region}</p>
                <p className="text-xs text-muted-text/70 mt-1">Transaction Fees: {g.fee}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${g.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {g.active ? "Enabled" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGateway(idx)}
                  className="px-4 py-2 border border-cream hover:bg-ivory text-xs text-burgundy transition-all rounded-sm font-semibold cursor-pointer"
                >
                  {g.active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
