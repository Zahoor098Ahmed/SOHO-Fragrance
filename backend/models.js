import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  phone: { type: String, default: "" },
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  postalCode: { type: String, default: "" },
  country: { type: String, default: "" },
  scentFamily: { type: String, default: "Amber Woody" },
  scentConcentration: { type: String, default: "Eau de Parfum" },
  scentIntensity: { type: String, default: "Strong" },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  lastOtpSentAt: { type: Date },
  cart: { type: Array, default: [] },
  wishlist: [{ type: String }],
  displayPassword: { type: String, default: "" }
}, { timestamps: true });

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  family: { type: String, required: true },
  bottleColor: { type: String, default: "#000000" },
  bottleCapColor: { type: String, default: "#A99A8C" },
  liquidColor: { type: String, default: "#F5F5F0" },
  bgAccent: { type: String, default: "#A99A8C" },
  price50ml: { type: Number, required: true },
  price100ml: { type: Number, required: true },
  stock50ml: { type: Number, required: true, default: 0 },
  stock100ml: { type: Number, required: true, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  topNotes: [{ type: String }],
  heartNotes: [{ type: String }],
  baseNotes: [{ type: String }],
  gender: { type: String, enum: ["men", "women", "unisex"], default: "unisex" },
  tags: [{ type: String }],
  image: { type: String, required: true },
  deliveryCharge: { type: Number, default: 0 },
  bottlesSold: { type: Number, default: 0 }
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customer: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  items: { type: String, required: true },
  amount: { type: Number, required: true },
  payment: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ["Pending Verification", "Paid", "Failed", "Refunded", "Unpaid"],
    default: "Pending Verification"
  },
  paymentReceipt: { type: String, default: "" },
  transactionRef: { type: String, default: "" },
  verifiedBy: { type: String, default: "" },
  verifiedAt: { type: Date },
  status: { type: String, default: "Pending" },
  date: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  province: { type: String, default: "Sindh" },
  deliveryCharge: { type: Number, default: 0 },
  couponCode: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 },
  courierName: { type: String, default: "" },
  trackingNumber: { type: String, default: "" },
  trackingUrl: { type: String, default: "" },
  cart: { type: Array, default: [] }
}, { timestamps: true });

// Configuration Schema
const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

// Contact Message Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

// Review Schema
const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, default: "Pending" } // Pending, Approved, Spam
}, { timestamps: true });

// SMTP Account Schema
const smtpAccountSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  pass: { type: String, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Inactive" }
}, { timestamps: true });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info" }, // info, success, warning, order
  isRead: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Product = mongoose.model("Product", productSchema);
export const Order = mongoose.model("Order", orderSchema);
export const Config = mongoose.model("Config", configSchema);
export const Contact = mongoose.model("Contact", contactSchema);
export const Review = mongoose.model("Review", reviewSchema);
export const SmtpAccount = mongoose.model("SmtpAccount", smtpAccountSchema);
export const Notification = mongoose.model("Notification", notificationSchema);

// 1. Coupon Schema (Discount & Promo Codes)
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  discountValue: { type: Number, required: true }, // e.g. 10 (%) or 500 (PKR)
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 1000 },
  usedCount: { type: Number, default: 0 },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 2. Audit Log Schema (Super Admin Activity Trail)
const auditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  role: { type: String, default: "Admin" },
  targetResource: { type: String, default: "System" },
  ipAddress: { type: String, default: "127.0.0.1" },
  details: { type: mongoose.Schema.Types.Mixed },
  time: { type: String }
}, { timestamps: true });

// 3. Newsletter Subscriber Schema (Marketing & Customer List)
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ["Active", "Unsubscribed"], default: "Active" },
  source: { type: String, default: "Footer" }
}, { timestamps: true });

// 4. Shipment & Courier Tracking Schema (TCS, Leopards, Trax, PostEx)
const shipmentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  trackingNumber: { type: String, required: true, unique: true, trim: true },
  courierName: { type: String, required: true },
  trackingUrl: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Booked", "In Transit", "Out for Delivery", "Delivered", "Returned"],
    default: "Booked"
  },
  dispatchedAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  notes: { type: String, default: "" }
}, { timestamps: true });

// 5. Announcement & Promotion Banner Schema
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: "/collection" },
  bgColor: { type: String, default: "#1A1008" },
  textColor: { type: String, default: "#E8D8C8" },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 1 }
}, { timestamps: true });

// 6. Comprehensive Website & Store Statistics Schema (Atlas Collection: brandstats)
const brandStatsSchema = new mongoose.Schema({
  statType: { type: String, required: true, unique: true, default: "website_overall_stats" },
  // Exact metrics shown on the website (Home & Storefront)
  totalCustomers: { type: Number, default: 1005 },        // Website: "1,005+ Happy / Valued Customers"
  repeatCustomers: { type: Number, default: 702 },       // Website: "702+ Repeat Patrons / Connoisseurs"
  totalBottlesSold: { type: Number, default: 3015 },     // Website: "3,015+ Bottles Delivered"
  repeatRate: { type: String, default: "70%" },          // Website: "70% repurchase rate"
  artisanalBlends: { type: Number, default: 12 },        // Website: "12 Artisanal Blends"
  satisfactionRate: { type: String, default: "98.8%" },  // Website: "98.8% Satisfaction"
  
  // Website display string badges
  websiteStats: {
    happyCustomersBadge: { type: String, default: "1,005+" },
    repeatPatronsBadge: { type: String, default: "702+" },
    bottlesDeliveredBadge: { type: String, default: "3,015+" },
    repeatRateText: { type: String, default: "70% repurchase rate" },
    artisanalBlendsCount: { type: Number, default: 12 }
  },

  // Underlying Raw Database breakdown
  totalUsers: { type: Number, default: 16 },
  customerUsersCount: { type: Number, default: 14 },
  adminUsersCount: { type: Number, default: 2 },
  uniqueOrderingCustomers: { type: Number, default: 5 },
  liveRepeatCustomersCount: { type: Number, default: 2 },
  repeatOrdersCount: { type: Number, default: 12 },
  repeatRevenue: { type: Number, default: 94900 },
  repeatCustomersList: [{
    email: String,
    name: String,
    ordersCount: Number,
    totalSpent: Number
  }],
  totalOrders: { type: Number, default: 15 },
  totalRevenue: { type: Number, default: 125400 },
  productSalesBreakdown: { type: mongoose.Schema.Types.Mixed },
  lastSynchronized: { type: Date, default: Date.now }
}, { timestamps: true });

export const Coupon = mongoose.model("Coupon", couponSchema);
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export const Subscriber = mongoose.model("Subscriber", subscriberSchema);
export const Shipment = mongoose.model("Shipment", shipmentSchema);
export const Banner = mongoose.model("Banner", bannerSchema);
export const BrandStat = mongoose.model("BrandStat", brandStatsSchema, "brandstats");



