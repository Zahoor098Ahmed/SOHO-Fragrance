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
  wishlist: [{ type: String }]
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


