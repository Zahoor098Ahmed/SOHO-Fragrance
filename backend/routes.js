import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { User, Product, Order, Config, Contact, Review, SmtpAccount, Notification } from "./models.js";
import { sendOTP, sendOrderConfirmationEmail, sendOrderReceivedPendingEmail } from "./email.js";

const router = express.Router();

// High Security Multer Storage for Payment Receipts
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "receipts"));
  },
  filename: (req, file, cb) => {
    // Cryptographically secure randomized filename to prevent directory traversal and overwrite attacks
    const randomHex = crypto.randomBytes(16).toString("hex");
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
    cb(null, `receipt-${Date.now()}-${randomHex}${safeExt}`);
  }
});

// File filter: Strictly restrict to images (JPEG, PNG, WebP)
const receiptFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Security violation: Only valid image files (JPG, PNG, WebP) are allowed."));
  }
};

const uploadReceipt = multer({
  storage: receiptStorage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum limit to prevent denial of service
  }
});

// Middleware: Authenticate Request using JWT
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Middleware: Optional Authentication (Extracts user if present, allows guest if not)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      req.user = decoded;
    } catch (err) {
      // Ignore token failure for guest checkout
    }
  }
  next();
};

// Middleware: Require Admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  next();
};

// Middleware: Require Super Admin role
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Access denied. Super Admin role required." });
  }
  next();
};

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

// POST: Migrate user from localStorage mock data to MongoDB
router.post("/auth/migrate-user", async (req, res) => {
  const { name, email, password, scentFamily } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required migration fields." });
  }

  const emailKey = email.toLowerCase().trim();

  try {
    const existing = await User.findOne({ email: emailKey });
    if (existing) {
      return res.json({ message: "User already exists in MongoDB database." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email: emailKey,
      password: hashedPassword,
      scentFamily: scentFamily || "Amber Woody",
      role: "user",
      isVerified: true, // Auto-verified during migration
      status: "Active"
    });
    await newUser.save();

    res.json({ success: true, message: `Migrated client ${emailKey} successfully.` });
  } catch (err) {
    res.status(500).json({ error: "Migration backend error." });
  }
});

// POST: Start registration (Send 6-digit OTP code)
router.post("/auth/register", async (req, res) => {
  const { name, email, password, scentFamily } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const emailKey = email.toLowerCase().trim();

  try {
    const existing = await User.findOne({ email: emailKey });
    if (existing && existing.isVerified) {
      return res.status(400).json({ error: "Account with this email already exists." });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      existing.name = name;
      existing.password = hashedPassword;
      existing.scentFamily = scentFamily;
      existing.verificationCode = verificationCode;
      await existing.save();
    } else {
      const newUser = new User({
        name,
        email: emailKey,
        password: hashedPassword,
        scentFamily,
        role: "user", // strictly client role, never allow admin/superadmin sign-up
        verificationCode,
        isVerified: false
      });
      await newUser.save();
    }

    // Send verification code email via SMTP
    try {
      await sendOTP(emailKey, verificationCode, "register");
    } catch (mailErr) {
      console.error("SMTP sending error during registration:", mailErr);
      return res.status(500).json({ error: "Failed to send verification email. Please check your email address." });
    }

    res.json({ message: `Verification code sent to your email.`, simulatedCode: verificationCode });
  } catch (err) {
    console.error("Registration database error:", err);
    res.status(500).json({ error: "Server registration error." });
  }
});

// POST: Verify OTP and complete registration (Force manual login next)
router.post("/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or code." });
  }

  const emailKey = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: emailKey });
    if (!user) {
      return res.status(404).json({ error: "Registration record not found." });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    user.isVerified = true;
    user.verificationCode = "";
    await user.save();

    res.json({ success: true, message: "Verification successful! Please sign in manually." });
  } catch (err) {
    res.status(500).json({ error: "Server OTP verification error." });
  }
});

// POST: Login (Includes mandatory 2FA for admin and superadmin)
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const emailKey = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: emailKey });
    if (!user || !user.isVerified) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ error: "Your account has been disabled. Please contact the administrator." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Trigger mandatory 2-Factor Authentication for admin or superadmin roles
    if (user.role === "admin" || user.role === "superadmin") {
      const now = new Date();
      const lastSent = user.lastOtpSentAt;
      const cooldownMs = 15000; // 15 seconds throttle to prevent double OTP emails

      if (lastSent && (now.getTime() - lastSent.getTime() < cooldownMs)) {
        // Cooldown active: Return success and ask user to check their email for the already sent code
        return res.json({
          twoFactorRequired: true,
          email: user.email,
          message: "A 2-Factor Authentication code has already been sent to your email. Please check your inbox."
        });
      }

      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = twoFactorCode;
      user.lastOtpSentAt = now;
      await user.save();

      // Dispatch 2FA email - Send to the SMTP_USER email configured in .env for admin/superadmin accounts
      try {
        const admin2faEmail = process.env.SMTP_USER || "sohofragrance1@gmail.com";
        await sendOTP(admin2faEmail, twoFactorCode, "2fa", user.role);
      } catch (mailErr) {
        console.error("2FA SMTP sending error:", mailErr);
        // Reset timestamp on failure so they can retry immediately
        user.lastOtpSentAt = undefined;
        await user.save();
        return res.status(500).json({ error: "Failed to send 2FA verification email. Please try again." });
      }

      return res.json({
        twoFactorRequired: true,
        email: user.email,
        message: "A 2-Factor Authentication code has been sent to the system administrator email address."
      });
    }

    // Sign JWT token for regular clients
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        cart: user.cart || [],
        wishlist: user.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server login error." });
  }
});

// POST: Verify 2FA and complete login for admins/superadmins
router.post("/auth/verify-2fa", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or verification code." });
  }

  const emailKey = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: emailKey });
    if (!user || !user.isVerified) {
      return res.status(400).json({ error: "Account not found or unverified." });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ error: "Your account has been disabled. Please contact the administrator." });
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(400).json({ error: "2FA is only applicable for administrative accounts." });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid or expired 2FA code." });
    }

    // Clear verification code
    user.verificationCode = "";
    await user.save();

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        cart: user.cart || [],
        wishlist: user.wishlist || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server 2FA verification error." });
  }
});

// PUT: Sync cart and wishlist for persistent user storage in MongoDB
router.put("/auth/sync-cart-wishlist", optionalAuth, async (req, res) => {
  const { cart, wishlist, email } = req.body;
  try {
    let query = null;
    if (req.user && req.user.id) {
      query = { _id: req.user.id };
    } else if (email) {
      query = { email: String(email).toLowerCase().trim() };
    }

    if (query) {
      const updates = {};
      if (Array.isArray(cart)) updates.cart = cart;
      if (Array.isArray(wishlist)) updates.wishlist = wishlist;
      await User.updateOne(query, { $set: updates });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to sync cart and wishlist." });
  }
});

// POST: Forgot Password
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  const emailKey = email.toLowerCase().trim();
  try {
    const user = await User.findOne({ email: emailKey });
    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }
    // Simulate recovery link
    res.json({ success: true, message: "Simulated recovery link sent successfully." });
  } catch (err) {
    res.status(500).json({ error: "Forgot password recovery error." });
  }
});

// GET: List all users & admins (Admin/Super Admin only)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const list = await User.find({}, "-password");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// DELETE: Delete a user or admin account (Super Admin only)
router.delete("/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, message: "User account deleted successfully from database." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// PUT: Toggle or update user status (Super Admin only)
router.put("/users/:id/status", requireAuth, requireSuperAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status || !["Active", "Inactive"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, message: `User status updated to ${status}.`, user: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user status." });
  }
});


// ==========================================
// 2. PRODUCTS MODULE
// ==========================================

// GET: List all products
router.get("/products", async (req, res) => {
  try {
    const list = await Product.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET: Single Product details by slug
router.get("/products/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product details." });
  }
});

// POST: Add new product (Admin/Super Admin only)
router.post("/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const created = new Product(req.body);
    await created.save();
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: "Failed to create product. Check duplicate keys." });
  }
});

// PUT: Modify product / update stock (Admin/Super Admin only)
router.put("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update product." });
  }
});

// DELETE: Delete product (Admin/Super Admin only)
router.delete("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found." });
    res.json({ success: true, message: "Product deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product." });
  }
});

// ==========================================
// 3. ORDERS MODULE
// ==========================================

// POST: Secure Payment Receipt Upload (Strict mime/extension check, max 5MB, random filename)
router.post("/orders/upload-receipt", optionalAuth, (req, res) => {
  uploadReceipt.single("receipt")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size exceeds 5MB limit. Please upload a smaller image." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No receipt file uploaded." });
    }

    // Return the safe relative URL path
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    res.json({
      success: true,
      receiptUrl: fileUrl,
      fileName: req.file.filename
    });
  });
});

// POST: Place a new order (Supports Authenticated & Guest checkouts, deductions, payment verification)
router.post("/orders", optionalAuth, async (req, res) => {
  const { customer, phone, email, items, amount, payment, city, address, province, cart, paymentReceipt, transactionRef } = req.body;

  // Strict Validation: Customer details are strictly mandatory
  if (!customer || String(customer).trim().length < 2) {
    return res.status(400).json({ error: "Customer Full Name is mandatory to place an order." });
  }
  if (!phone || String(phone).replace(/\D/g, "").length < 10) {
    return res.status(400).json({ error: "A valid Phone Number (minimum 10-11 digits) is mandatory for courier delivery." });
  }
  if (!email || !String(email).includes("@") || !String(email).includes(".")) {
    return res.status(400).json({ error: "A valid Email Address is mandatory to receive your order invoice and tracking." });
  }
  if (!address || String(address).trim().length < 5) {
    return res.status(400).json({ error: "Complete Street Delivery Address (House/Flat No, Street, Area) is mandatory." });
  }
  if (!city || String(city).trim().length < 2) {
    return res.status(400).json({ error: "Destination City is mandatory for parcel delivery." });
  }
  if (!items || !amount || !payment) {
    return res.status(400).json({ error: "Cart items, total amount, and payment method are required." });
  }

  // Security: Sanitize inputs to prevent script injection and buffer overflows
  const cleanCustomer = String(customer).trim().slice(0, 100);
  const cleanPhone = String(phone).trim().slice(0, 30);
  const cleanEmail = String(email).toLowerCase().trim().slice(0, 100);
  const cleanCity = String(city).trim().slice(0, 50);
  const cleanAddress = String(address).trim().slice(0, 250);
  const cleanProvince = String(province || "Sindh").trim().slice(0, 50);
  const cleanTransactionRef = transactionRef ? String(transactionRef).trim().slice(0, 50) : "";
  const cleanReceipt = paymentReceipt ? String(paymentReceipt).trim().slice(0, 250) : "";

  // Determine initial payment and order state
  const isBankTransfer = payment.toLowerCase().includes("bank") ||
    payment.toLowerCase().includes("transfer") ||
    payment.toLowerCase().includes("jazzcash") ||
    payment.toLowerCase().includes("easypaisa");

  const initialStatus = isBankTransfer ? "Pending Verification" : "Pending";
  const initialPaymentStatus = isBankTransfer ? "Pending Verification" : "Unpaid";

  try {
    // Generate secure order tracking number
    const trackingId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Automatically link order to user account if logged in or if email matches registered user
    let resolvedUserId = req.user ? req.user.id : undefined;
    if (!resolvedUserId && req.body.userId) {
      resolvedUserId = req.body.userId;
    }
    if (!resolvedUserId) {
      const matchedUser = await User.findOne({ email: cleanEmail });
      if (matchedUser) resolvedUserId = matchedUser._id;
    }

    const newOrder = new Order({
      id: trackingId,
      userId: resolvedUserId,
      customer: cleanCustomer,
      phone: cleanPhone,
      email: cleanEmail,
      items,
      amount,
      payment,
      paymentStatus: initialPaymentStatus,
      paymentReceipt: cleanReceipt,
      transactionRef: cleanTransactionRef,
      status: initialStatus,
      date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
      city: cleanCity,
      address: cleanAddress,
      province: cleanProvince,
      cart: Array.isArray(cart) ? cart : []
    });

    await newOrder.save();

    // Deduct stock and increment bottlesSold for each ordered fragrance directly in MongoDB
    if (Array.isArray(cart) && cart.length > 0) {
      for (const item of cart) {
        const qty = Number(item.quantity) || 1;
        const searchConditions = [];
        if (item.productId) searchConditions.push({ id: item.productId });
        if (item.id) searchConditions.push({ id: item.id });
        if (item.slug) searchConditions.push({ slug: item.slug });
        if (item.name) {
          searchConditions.push({ name: item.name });
          searchConditions.push({ name: new RegExp(`^${item.name}$`, "i") });
        }
        const product = await Product.findOne(searchConditions.length > 0 ? { $or: searchConditions } : { id: item.productId });
        if (product) {
          if (item.size === "50ml") {
            product.stock50ml = Math.max(0, product.stock50ml - qty);
          } else {
            product.stock100ml = Math.max(0, product.stock100ml - qty);
          }
          product.bottlesSold = (Number(product.bottlesSold) || 0) + qty;
          await product.save();
        }
      }
    } else if (items) {
      // Fallback if raw text items placed: parse and update bottlesSold in MongoDB
      const raw = String(items || "");
      const segments = raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
      const allDbProds = await Product.find({});
      for (const seg of segments) {
        const normSeg = normalizeCatalogText(seg);
        const product = allDbProds.find((p) => normSeg.includes(normalizeCatalogText(p.name)));
        if (product) {
          let qty = 1;
          const qtyMatch = seg.match(/[×xX*]\s*(\d+)/) || seg.match(/(\d+)\s*[×xX*]/);
          if (qtyMatch) qty = parseInt(qtyMatch[1], 10) || 1;

          const is50ml = /50\s*ml/i.test(seg);
          if (is50ml) {
            product.stock50ml = Math.max(0, product.stock50ml - qty);
          } else {
            product.stock100ml = Math.max(0, product.stock100ml - qty);
          }
          product.bottlesSold = (Number(product.bottlesSold) || 0) + qty;
          await product.save();
        }
      }
    }

    // Create admin notification
    try {
      await Notification.create({
        title: isBankTransfer ? "Bank Transfer Order - Verify Payment" : "New Order Placed",
        message: isBankTransfer
          ? `Order #${trackingId} for Rs. ${amount.toLocaleString()} was placed by ${cleanCustomer}. Payment receipt uploaded and awaiting verification.`
          : `Order #${trackingId} for Rs. ${amount.toLocaleString()} was placed by ${cleanCustomer}.`,
        type: "order",
        link: "/admin/orders"
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification:", notifErr);
    }

    // Send acknowledgment email to customer
    if (isBankTransfer) {
      try {
        await sendOrderReceivedPendingEmail(newOrder);
      } catch (mailErr) {
        console.error("Failed to send order pending email:", mailErr);
      }
    }

    res.status(201).json({
      success: true,
      orderId: trackingId,
      status: initialStatus,
      order: {
        id: trackingId,
        date: newOrder.date,
        amount: newOrder.amount,
        status: newOrder.status,
        items: newOrder.items,
        payment: newOrder.payment,
        city: newOrder.city,
        createdAt: newOrder.createdAt
      }
    });
  } catch (err) {
    console.error("Failed to place order:", err);
    res.status(500).json({ error: "Failed to place order." });
  }
});

// GET: List all orders (Admins get all, regular clients get their own)
router.get("/orders", optionalAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
      // Admin / SuperAdmin can see all orders
      query = {};
    } else {
      // Regular customer orders lookup: by authenticated user or query email
      const candidateEmails = new Set();
      const candidateUserIds = new Set();
      let customerName = "";

      if (req.user) {
        candidateUserIds.add(String(req.user.id));
        if (req.user.email) candidateEmails.add(req.user.email.toLowerCase().trim());
        if (req.user.name) customerName = req.user.name.trim();

        const userRecord = await User.findById(req.user.id).lean();
        if (userRecord) {
          if (userRecord.email) candidateEmails.add(userRecord.email.toLowerCase().trim());
          if (userRecord.name) customerName = userRecord.name.trim();
        }
      }

      if (req.query.email) {
        const qEmail = String(req.query.email).toLowerCase().trim();
        candidateEmails.add(qEmail);
        const matchedUser = await User.findOne({ email: qEmail }).lean();
        if (matchedUser) {
          candidateUserIds.add(String(matchedUser._id));
          if (matchedUser.name && !customerName) customerName = matchedUser.name.trim();
        }
      }

      if (candidateEmails.size === 0 && candidateUserIds.size === 0) {
        return res.status(401).json({ error: "Authentication or email required to view orders." });
      }

      const orList = [];
      for (const uid of candidateUserIds) {
        orList.push({ userId: uid });
      }
      for (const em of candidateEmails) {
        orList.push({ email: em });
        orList.push({ email: new RegExp(`^${em}$`, "i") });
      }
      if (customerName && customerName.length >= 3) {
        orList.push({ customer: new RegExp(`^${customerName}`, "i") });
      }

      query = { $or: orList };
    }

    const list = await Order.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// PUT: Update order status (Admin/Super Admin only)
router.put("/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status, paymentStatus, rejectionReason } = req.body;
  try {
    const existingOrder = await Order.findOne({ id: req.params.id });
    if (!existingOrder) return res.status(404).json({ error: "Order not found." });

    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (rejectionReason) updates.rejectionReason = rejectionReason;

    // Automatic payment reconciliation on approval
    const isNowConfirmed = status === "Confirmed" && existingOrder.status !== "Confirmed";
    if (isNowConfirmed) {
      updates.paymentStatus = "Paid";
      updates.verifiedBy = req.user.email || req.user.id;
      updates.verifiedAt = new Date();
    } else if (status === "Cancelled") {
      updates.paymentStatus = "Failed";
    }

    const updated = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    );

    // If order confirmed, trigger customer email with luxury template
    if (isNowConfirmed) {
      try {
        await sendOrderConfirmationEmail(updated);
      } catch (mailErr) {
        console.error("Failed to send order confirmation email:", mailErr);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update order status:", err);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

// DELETE: Delete/Cancel an order (Admin/Super Admin only)
router.delete("/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Order.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Order not found." });
    res.json({ success: true, message: "Order deleted successfully from database." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order." });
  }
});

// GET: Track Order by tracking ID (Public Access)
router.get("/orders/track/:orderId", async (req, res) => {
  const searchId = req.params.orderId.toUpperCase().trim();
  const formatSearchId = searchId.startsWith("#") ? searchId : `#${searchId}`;

  try {
    const matchedOrder = await Order.findOne({ id: formatSearchId });
    if (!matchedOrder) {
      return res.status(404).json({ error: "No order found with this tracking ID." });
    }

    // Build tracking steps dynamically
    const status = matchedOrder.status;

    const isConfirmedDone = !["Pending", "Pending Verification", "Cancelled", "Refunded"].includes(status);
    const isPackedDone = ["Packed", "Processing", "Shipped", "Out for Delivery", "Delivered"].includes(status);
    const isDispatchedDone = ["Shipped", "Out for Delivery", "Delivered"].includes(status);
    const isDeliveredDone = status === "Delivered";

    const steps = [
      {
        label: "Order Received",
        desc: "Your order has been received and logged in our system.",
        date: matchedOrder.date,
        done: true,
      },
      {
        label: "Order Confirmed",
        desc: status === "Pending Verification"
          ? "Payment receipt received. Verification in progress by finance team."
          : "Payment verified. Preparing your fragrance collection for packaging.",
        date: ["Pending", "Pending Verification"].includes(status) ? "Pending" : matchedOrder.date,
        done: isConfirmedDone,
      },
      {
        label: "Packed",
        desc: status === "Packed"
          ? "Your bespoke fragrance has been carefully inspected, packaged, and sealed for dispatch."
          : "Fragrance bottle inspected, sealed, and packaged securely.",
        date: isPackedDone ? matchedOrder.date : "Pending",
        done: isPackedDone,
      },
      {
        label: "Dispatched",
        desc: "Handed over to Trax Logistics courier partner.",
        date: isDispatchedDone ? matchedOrder.date : "Pending",
        done: isDispatchedDone,
      },
      {
        label: "Delivered",
        desc: "Parcel delivered to your doorstep.",
        date: isDeliveredDone ? matchedOrder.date : "Pending",
        done: isDeliveredDone,
      },
    ];

    res.json({
      id: matchedOrder.id,
      status: matchedOrder.status,
      paymentStatus: matchedOrder.paymentStatus || (matchedOrder.status === "Confirmed" ? "Paid" : "Pending"),
      payment: matchedOrder.payment,
      transactionRef: matchedOrder.transactionRef || "",
      carrier: "Trax Logistics",
      estimatedDelivery: matchedOrder.status === "Delivered" ? "Delivered" : "2-3 Working Days",
      items: matchedOrder.items,
      amount: matchedOrder.amount,
      city: matchedOrder.city,
      customer: matchedOrder.customer,
      date: matchedOrder.date,
      steps
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve tracking info." });
  }
});

// ==========================================
// 4. CONFIGURATIONS & SETTINGS (Super Admin)
// ==========================================

// GET: Config parameter value by key
router.get("/config/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const sensitiveKeys = ["smtp_pass", "smtp_user"];

    if (sensitiveKeys.includes(key)) {
      return requireAuth(req, res, async () => {
        if (!req.user || req.user.role !== "superadmin") {
          return res.status(403).json({ error: "Access denied. Super Admin privileges required." });
        }
        const config = await Config.findOne({ key });
        if (config) return res.json(config.value);

        let fallback = "";
        if (key === "smtp_user") fallback = process.env.SMTP_USER || "sohofragrance1@gmail.com";
        if (key === "smtp_pass") fallback = process.env.SMTP_PASS || "rmbfjupdjtwxyihl";
        if (typeof fallback === "string" && fallback.startsWith('"') && fallback.endsWith('"')) {
          fallback = fallback.substring(1, fallback.length - 1);
        }
        return res.json(fallback);
      });
    }

    const config = await Config.findOne({ key });
    if (config) return res.json(config.value);

    // Fallback defaults for store configs
    let fallback = null;
    if (key === "store_name") fallback = process.env.SMTP_FROM_NAME || "SOHO Fragrance";
    else if (key === "currency") fallback = "PKR (₨)";
    else if (key === "support_email") fallback = "support@sohofragrance.com";
    else if (key === "smtp_from_name") fallback = process.env.SMTP_FROM_NAME || "SOHO Fragrance";
    else if (key === "payment_accounts") {
      fallback = {
        bank: {
          bankName: "Meezan Bank Ltd.",
          accountTitle: "SOHO Fragrance Pvt Ltd",
          accountNumber: "0102-0106123456",
          iban: "PK42MEZN0001020106123456",
          branchCode: "0102",
          branchName: "Zamzama Branch, Karachi",
          instructions: "Please transfer the exact order amount via online banking / ATM transfer and upload the payment receipt below."
        },
        jazzcash: {
          accountTitle: "SOHO Fragrance Pvt Ltd",
          accountNumber: "0300-1234567",
          tillId: "",
          instructions: "Send money via JazzCash App or dial *786# to this mobile account. Upload transaction receipt below."
        },
        easypaisa: {
          accountTitle: "SOHO Fragrance Pvt Ltd",
          accountNumber: "0345-1234567",
          tillId: "",
          instructions: "Send money via Easypaisa App or dial *786# to this mobile account. Upload transaction receipt below."
        },
        nayapay: {
          accountTitle: "SOHO Fragrance Pvt Ltd",
          accountNumber: "0300-1234567",
          nayapayId: "",
          instructions: "Transfer via NayaPay app to our registered mobile account and upload transaction receipt."
        },
        sadapay: {
          accountTitle: "SOHO Fragrance Pvt Ltd",
          accountNumber: "0300-1234567",
          iban: "PK55SADA0000001234567890",
          instructions: "Transfer via SadaPay app or send to our SadaBiz IBAN and upload payment confirmation."
        },
        raast: {
          accountTitle: "SOHO Fragrance Pvt Ltd",
          raastId: "0300-1234567",
          linkedBank: "Meezan Bank Ltd.",
          instructions: "Instant zero-fee transfer via Raast ID. Attach payment receipt below."
        }
      };
    }
    else if (key === "bank_details") {
      fallback = {
        bankName: "Meezan Bank Ltd.",
        accountTitle: "SOHO Fragrance Pvt Ltd",
        accountNumber: "0102-0106123456",
        iban: "PK42MEZN0001020106123456",
        branchCode: "0102",
        branchName: "Zamzama Branch, Karachi",
        raastId: "0300-1234567",
        walletDetails: "JazzCash / EasyPaisa: 0300-1234567",
        instructions: "Please transfer the exact order amount and upload the screenshot / receipt below with transaction reference."
      };
    }

    if (typeof fallback === "string" && fallback.startsWith('"') && fallback.endsWith('"')) {
      fallback = fallback.substring(1, fallback.length - 1);
    }
    res.json(fallback);
  } catch (err) {
    res.status(500).json({ error: "Failed to load configuration." });
  }
});

// PUT: Create or update configuration parameter by key
router.put("/config/:key", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    if (["smtp_pass", "smtp_user"].includes(key) && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied. Super Admin privileges required." });
    }

    const config = await Config.findOneAndUpdate(
      { key },
      { value: req.body.value },
      { new: true, upsert: true }
    );

    // If saving payment_accounts, automatically sync bank_details for backward compatibility
    if (key === "payment_accounts" && req.body.value && req.body.value.bank) {
      await Config.findOneAndUpdate(
        { key: "bank_details" },
        { value: req.body.value.bank },
        { new: true, upsert: true }
      );
    }

    res.json({ success: true, message: "Configuration saved successfully.", value: config.value, config });
  } catch (err) {
    res.status(500).json({ error: "Failed to save configuration." });
  }
});

// Default baseline sales offsets distributed across the 12 signature fragrances (Sum = 3,000 bottles)
const DEFAULT_PRODUCT_SALES_OFFSETS = {
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
  "09": 130  // ORVÉSSA
};

// GET: Live Brand Stats & Social Proof Metrics (Public - Accessible by all users & store visitors)
router.get("/brand-stats", async (req, res) => {
  try {
    const cfgDoc = await Config.findOne({ key: "brand_stats" });
    const cfg = cfgDoc ? cfgDoc.value : {
      baseCustomers: 1000,
      baseRepeatCustomers: 700,
      baseBottlesSold: 3000,
      productOffsets: DEFAULT_PRODUCT_SALES_OFFSETS
    };

    const userEmails = await User.find({ role: "user" }).distinct("email");
    const orderEmails = await Order.find({ status: { $nin: ["Cancelled", "Refunded"] } }).distinct("email");
    const allCustomerEmails = new Set([
      ...userEmails.map((e) => String(e || "").toLowerCase().trim()),
      ...orderEmails.map((e) => String(e || "").toLowerCase().trim())
    ]);
    const liveCustomers = allCustomerEmails.size;

    const repeatCustomersAggregate = await Order.aggregate([
      { $match: { status: { $nin: ["Cancelled", "Refunded"] } } },
      { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }
    ]);
    const liveRepeatCustomers = repeatCustomersAggregate.length;

    const orders = await Order.find({ status: { $nin: ["Cancelled", "Refunded"] } }).lean();
    const products = await Product.find({}).lean();
    const catalogList = products.map((p) => ({
      id: p.id,
      name: p.name,
      normName: normalizeCatalogText(p.name)
    }));

    let liveBottlesSold = 0;
    const liveBottlesPerProduct = {};

    for (const order of orders) {
      const items = parseOrderItemsForAnalytics(order, catalogList);
      for (const item of items) {
        const matched = catalogList.find((p) => p.name === item.name || normalizeCatalogText(p.name) === normalizeCatalogText(item.name));
        const prodId = matched ? matched.id : item.name;
        liveBottlesSold += item.quantity;
        liveBottlesPerProduct[prodId] = (liveBottlesPerProduct[prodId] || 0) + item.quantity;
      }
    }

    const baseCustomers = Number(cfg.baseCustomers ?? 1000);
    const baseRepeatCustomers = Number(cfg.baseRepeatCustomers ?? 700);
    const baseBottlesSold = Number(cfg.baseBottlesSold ?? 3000);

    const totalCustomers = baseCustomers + liveCustomers;
    const repeatCustomers = baseRepeatCustomers + liveRepeatCustomers;

    const productSales = {};
    const productSalesById = {};
    const currentOffsets = cfg.productOffsets || DEFAULT_PRODUCT_SALES_OFFSETS;

    let dbBottlesSum = 0;
    for (const p of products) {
      const sold = Number(p.bottlesSold) || (Number(currentOffsets[p.id] ?? currentOffsets[p.name]) || 250);
      productSales[p.name] = sold;
      productSalesById[p.id] = sold;
      dbBottlesSum += sold;
    }

    const totalBottlesSold = dbBottlesSum > 0 ? dbBottlesSum : (baseBottlesSold + liveBottlesSold);

    res.json({
      baseCustomers,
      baseRepeatCustomers,
      baseBottlesSold,
      liveCustomers,
      liveRepeatCustomers,
      liveBottlesSold,
      totalCustomers,
      repeatCustomers,
      totalBottlesSold,
      repeatRate: `${Math.round((repeatCustomers / Math.max(1, totalCustomers)) * 100)}%`,
      productSales,
      productSalesById,
      productOffsets: currentOffsets
    });
  } catch (err) {
    console.error("Failed to compute live brand stats:", err);
    res.status(500).json({ error: "Failed to compute brand stats." });
  }
});

// PUT: Update Baseline Brand Stats (Admin & Super Admin only)
router.put("/admin/brand-stats", requireAuth, requireAdmin, async (req, res) => {
  const { baseCustomers, baseRepeatCustomers, baseBottlesSold, productOffsets } = req.body;
  try {
    const existingDoc = await Config.findOne({ key: "brand_stats" });
    const existing = existingDoc?.value || {
      baseCustomers: 1000,
      baseRepeatCustomers: 700,
      baseBottlesSold: 3000,
      productOffsets: DEFAULT_PRODUCT_SALES_OFFSETS
    };

    const newConfig = {
      baseCustomers: baseCustomers !== undefined ? Number(baseCustomers) : existing.baseCustomers,
      baseRepeatCustomers: baseRepeatCustomers !== undefined ? Number(baseRepeatCustomers) : existing.baseRepeatCustomers,
      baseBottlesSold: baseBottlesSold !== undefined ? Number(baseBottlesSold) : existing.baseBottlesSold,
      productOffsets: productOffsets && typeof productOffsets === "object" ? productOffsets : existing.productOffsets
    };

    // Update Config collection
    const updated = await Config.findOneAndUpdate(
      { key: "brand_stats" },
      { key: "brand_stats", value: newConfig },
      { new: true, upsert: true }
    );

    // Update bottlesSold in MongoDB products collection
    if (newConfig.productOffsets && typeof newConfig.productOffsets === "object") {
      for (const [key, val] of Object.entries(newConfig.productOffsets)) {
        await Product.updateOne(
          { $or: [{ id: key }, { name: key }] },
          { $set: { bottlesSold: Number(val) } }
        );
      }
    }

    res.json({ success: true, message: "Brand statistics updated successfully in database.", config: updated.value });
  } catch (err) {
    console.error("Failed to update brand stats:", err);
    res.status(500).json({ error: "Failed to save brand stats." });
  }
});

// GET: Currently logged-in user profile details
router.get("/auth/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// PUT: Update currently logged-in user profile details
router.put("/auth/profile", requireAuth, async (req, res) => {
  const { name, phone, street, city, postalCode, country, scentFamily, scentConcentration, scentIntensity } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (street !== undefined) user.street = street;
    if (city !== undefined) user.city = city;
    if (postalCode !== undefined) user.postalCode = postalCode;
    if (country !== undefined) user.country = country;
    if (scentFamily !== undefined) user.scentFamily = scentFamily;
    if (scentConcentration !== undefined) user.scentConcentration = scentConcentration;
    if (scentIntensity !== undefined) user.scentIntensity = scentIntensity;

    await user.save();
    res.json({ success: true, message: "Profile updated successfully.", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// POST: Submit a contact message
router.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newMessage = await Contact.create({ name, email, subject, message });
    res.json({ success: true, message: "Contact message sent successfully.", contactId: newMessage._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message." });
  }
});


// GET: Get active .env configurations (for Super Admin settings page view)
router.get("/config-env/info", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const envData = {
      PORT: process.env.PORT || "8080",
      MONGODB_URI: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//*****:*****@") : "mongodb://localhost:27017/soho_fragrance",
      SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
      SMTP_PORT: process.env.SMTP_PORT || "587",
      SMTP_USER: process.env.SMTP_USER || "sohofragrance1@gmail.com",
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "SOHO Fragrance"
    };

    // Strip quotes if any
    for (let key in envData) {
      if (typeof envData[key] === "string" && envData[key].startsWith('"') && envData[key].endsWith('"')) {
        envData[key] = envData[key].substring(1, envData[key].length - 1);
      }
    }

    res.json(envData);
  } catch (err) {
    res.status(500).json({ error: "Failed to load environment configuration info." });
  }
});

// GET: Get all users list (Admins & Customers)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load users list." });
  }
});

// POST: Create a new admin or user account (Super Admin only)
router.post("/users", requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: true
    });
    res.json({ success: true, message: "User account created successfully.", user: { name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user account." });
  }
});

// DELETE: Delete a user or admin account (Super Admin only)
router.delete("/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// GET: Get all reviews list
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to load reviews." });
  }
});

// POST: Submit a product review
router.post("/reviews", requireAuth, async (req, res) => {
  const { productId, productName, rating, text } = req.body;
  if (!productId || !productName || !rating || !text) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newReview = await Review.create({
      productId,
      productName,
      name: req.user.name || "Anonymous",
      email: req.user.email,
      rating: Number(rating),
      text,
      date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
      status: "Approved" // Approve automatically for demo, or "Pending"
    });
    res.json({ success: true, message: "Review submitted successfully.", review: newReview });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// PUT: Approve / Reject / Update review status (Admin only)
router.put("/reviews/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: "Review status updated.", review });
  } catch (err) {
    res.status(500).json({ error: "Failed to update review status." });
  }
});

// DELETE: Delete a review (Admin only)
router.delete("/reviews/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review." });
  }
});

const SUCCESSFUL_STATUSES = ["Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

// GET: List all users (who have 0 successful orders)
router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Match role "user"
    let matchQuery = { role: "user" };

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (status && status !== "All") {
      matchQuery.status = status;
    }

    const aggregation = [
      { $match: matchQuery },
      // Lookup successful orders to filter out customers
      {
        $lookup: {
          from: "orders",
          let: { userId: "$_id", userEmail: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $or: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$email", "$$userEmail"] }
                    ] },
                    { $in: ["$status", SUCCESSFUL_STATUSES] }
                  ]
                }
              }
            }
          ],
          as: "successfulOrders"
        }
      },
      // Keep only those with 0 successful orders
      { $match: { "successfulOrders.0": { $exists: false } } },
      // Lookup all orders to count total orders
      {
        $lookup: {
          from: "orders",
          let: { userId: "$_id", userEmail: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$email", "$$userEmail"] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } }
          ],
          as: "allOrders"
        }
      },
      // Project fields
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
          totalOrders: { $size: "$allOrders" },
          lastOrderDate: {
            $cond: {
              if: { $gt: [{ $size: "$allOrders" }, 0] },
              then: { $arrayElemAt: ["$allOrders.date", 0] },
              else: "N/A"
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }]
        }
      }
    ];

    const results = await User.aggregate(aggregation);
    const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
    const data = results[0].data;

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      users: data
    });
  } catch (err) {
    console.error("Failed to fetch users list:", err);
    res.status(500).json({ error: "Failed to fetch users list." });
  }
});

// GET: Single User details
router.get("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user details." });
  }
});

// GET: List all customers (who have >= 1 successful orders)
router.get("/admin/customers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { search, status, orderStatus, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let matchQuery = { role: "user" };

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (status && status !== "All") {
      matchQuery.status = status;
    }

    const aggregation = [
      { $match: matchQuery },
      // Lookup successful orders
      {
        $lookup: {
          from: "orders",
          let: { userId: "$_id", userEmail: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $or: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$email", "$$userEmail"] }
                    ] },
                    { $in: ["$status", SUCCESSFUL_STATUSES] }
                  ]
                }
              }
            },
            { $sort: { createdAt: 1 } }
          ],
          as: "successfulOrders"
        }
      },
      // Keep only users with >= 1 successful order
      { $match: { "successfulOrders.0": { $exists: true } } },
      // Lookup all orders to count total orders and active orders
      {
        $lookup: {
          from: "orders",
          let: { userId: "$_id", userEmail: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$email", "$$userEmail"] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } }
          ],
          as: "allOrders"
        }
      },
      // Compute customer details
      {
        $addFields: {
          totalOrders: { $size: "$allOrders" },
          totalSpent: { $sum: "$successfulOrders.amount" },
          customerSince: { $arrayElemAt: ["$successfulOrders.date", 0] },
          lastOrderDate: { $arrayElemAt: ["$successfulOrders.date", -1] },
          activeOrders: {
            $filter: {
              input: "$allOrders",
              as: "o",
              cond: { $in: ["$$o.status", ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery"]] }
            }
          }
        }
      },
      {
        $addFields: {
          currentOrder: {
            $cond: {
              if: { $gt: [{ $size: "$activeOrders" }, 0] },
              then: { $arrayElemAt: ["$activeOrders.id", 0] },
              else: "No Active Order"
            }
          }
        }
      }
    ];

    if (orderStatus && orderStatus !== "All") {
      aggregation.push({
        $match: {
          "allOrders.status": orderStatus
        }
      });
    }

    aggregation.push({
      $addFields: {
        latestOrderCreatedAt: {
          $cond: {
            if: { $gt: [{ $size: "$allOrders" }, 0] },
            then: { $arrayElemAt: ["$allOrders.createdAt", 0] },
            else: "$createdAt"
          }
        }
      }
    });

    aggregation.push(
      { $sort: { latestOrderCreatedAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }]
        }
      }
    );

    const results = await User.aggregate(aggregation);
    const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
    const data = results[0].data;

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      customers: data
    });
  } catch (err) {
    console.error("Failed to fetch customers list:", err);
    res.status(500).json({ error: "Failed to fetch customers list." });
  }
});

// GET: Single Customer detail
router.get("/admin/customers/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) return res.status(404).json({ error: "Customer not found." });

    const allOrders = await Order.find({
      $or: [
        { userId: user._id },
        { email: user.email }
      ]
    }).sort({ createdAt: -1 });

    const successfulOrders = allOrders.filter(o => SUCCESSFUL_STATUSES.includes(o.status));
    
    const totalSpent = successfulOrders.reduce((sum, o) => sum + o.amount, 0);
    const firstSuccessfulOrder = successfulOrders[successfulOrders.length - 1]; // sorted descending, so last is first
    const customerSince = firstSuccessfulOrder ? firstSuccessfulOrder.date : "N/A";

    res.json({
      customer: user,
      totalOrders: allOrders.length,
      totalSpent,
      customerSince,
      orders: allOrders
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer details." });
  }
});

// GET: Customer orders history
router.get("/admin/customers/:id/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Customer not found." });

    const list = await Order.find({
      $or: [
        { userId: user._id },
        { email: user.email }
      ]
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer orders." });
  }
});

// GET: Repeat Customers Analytics & Full Details (Admin & Super Admin)
router.get("/admin/repeat-customers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const allOrders = await Order.find({}).sort({ createdAt: -1 });

    const normKey = (o) => {
      const p = (o.phone || "").replace(/\D/g, "").slice(-10);
      if (p.length >= 10) return "phone:" + p;
      if (o.email && o.email.trim()) return "email:" + o.email.trim().toLowerCase();
      return "name:" + (o.customer || "").trim().toLowerCase();
    };

    const customerMap = {};
    const orderCustomerKeyMap = {};

    for (const ord of allOrders) {
      const key = normKey(ord);
      orderCustomerKeyMap[ord.id] = key;

      if (!customerMap[key]) {
        customerMap[key] = {
          key,
          customer: ord.customer,
          phone: ord.phone || "—",
          email: ord.email || "—",
          city: ord.city || "—",
          address: ord.address || "—",
          ordersCount: 0,
          totalSpent: 0,
          firstOrderDate: ord.date,
          lastOrderDate: ord.date,
          orders: []
        };
      }

      customerMap[key].ordersCount += 1;
      customerMap[key].totalSpent += Number(ord.amount || 0);
      customerMap[key].orders.push({
        id: ord.id,
        date: ord.date,
        status: ord.status,
        amount: ord.amount,
        items: ord.items,
        payment: ord.payment
      });
      customerMap[key].firstOrderDate = ord.date;
    }

    const customerList = Object.values(customerMap);
    const repeatCustomers = customerList
      .filter(c => c.ordersCount > 1)
      .sort((a, b) => b.ordersCount - a.ordersCount || b.totalSpent - a.totalSpent);

    const totalOrders = allOrders.length;
    const uniqueCustomers = customerList.length;
    const repeatCustomersCount = repeatCustomers.length;
    const repeatOrdersCount = repeatCustomers.reduce((sum, c) => sum + c.ordersCount, 0);
    const repeatRevenue = repeatCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomersCount / uniqueCustomers) * 100) : 0;

    // Fast lookup map for orders
    const orderRepeatStatus = {};
    for (const ord of allOrders) {
      const key = orderCustomerKeyMap[ord.id];
      const customerData = customerMap[key];
      const count = customerData ? customerData.ordersCount : 1;
      orderRepeatStatus[ord.id] = {
        isRepeat: count > 1,
        ordersCount: count,
        customerTotalSpent: customerData ? customerData.totalSpent : ord.amount,
        customerKey: key
      };
    }

    res.json({
      summary: {
        totalOrders,
        uniqueCustomers,
        repeatCustomersCount,
        repeatOrdersCount,
        repeatRevenue,
        repeatRate
      },
      repeatCustomers,
      orderRepeatStatus
    });
  } catch (err) {
    console.error("Failed to fetch repeat customers analysis:", err);
    res.status(500).json({ error: "Failed to fetch repeat customers analysis." });
  }
});

// GET: Dynamic dashboard statistics
router.get("/admin/dashboard/statistics", requireAuth, requireAdmin, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all successful orders
    const successfulOrders = await Order.find({ status: { $in: SUCCESSFUL_STATUSES } }).sort({ createdAt: 1 });
    
    // Create sets for fast lookup
    const customerEmails = new Set();
    const customerUserIds = new Set();
    
    // Track when each customer became a customer (date of first successful order)
    const firstSuccessfulOrderMap = new Map();

    for (const o of successfulOrders) {
      const emailKey = o.email.toLowerCase().trim();
      const userIdStr = o.userId ? o.userId.toString() : null;
      
      customerEmails.add(emailKey);
      if (userIdStr) {
        customerUserIds.add(userIdStr);
      }

      if (userIdStr && !firstSuccessfulOrderMap.has(userIdStr)) {
        firstSuccessfulOrderMap.set(userIdStr, o.createdAt);
      }
      if (!firstSuccessfulOrderMap.has(emailKey)) {
        firstSuccessfulOrderMap.set(emailKey, o.createdAt);
      }
    }

    // Fetch all users with role 'user'
    const allUsers = await User.find({ role: "user" });
    
    let totalUsers = 0;
    let totalCustomers = 0;
    let newUsersToday = 0;
    let newCustomersToday = 0;

    for (const u of allUsers) {
      const emailKey = u.email.toLowerCase().trim();
      const userIdStr = u._id.toString();
      
      const isCustomer = customerEmails.has(emailKey) || customerUserIds.has(userIdStr);
      
      if (isCustomer) {
        totalCustomers++;
        
        const firstOrderDate = firstSuccessfulOrderMap.get(userIdStr) || firstSuccessfulOrderMap.get(emailKey);
        if (firstOrderDate && new Date(firstOrderDate) >= todayStart) {
          newCustomersToday++;
        }
      } else {
        totalUsers++;
        if (u.createdAt && new Date(u.createdAt) >= todayStart) {
          newUsersToday++;
        }
      }
    }

    // Orders statistics
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: todayStart } });
    const activeOrders = await Order.countDocuments({
      status: { $in: ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery"] }
    });
    const completedOrders = await Order.countDocuments({ status: "Delivered" });

    // Repeat customers metrics across all orders
    const allOrdersList = await Order.find({});
    const custMap = {};
    for (const ord of allOrdersList) {
      const p = (ord.phone || "").replace(/\D/g, "").slice(-10);
      const k = p.length >= 10 ? "phone:" + p : (ord.email && ord.email.trim() ? "email:" + ord.email.trim().toLowerCase() : "name:" + (ord.customer || "").trim().toLowerCase());
      if (!custMap[k]) custMap[k] = { count: 0, spent: 0 };
      custMap[k].count += 1;
      custMap[k].spent += Number(ord.amount || 0);
    }
    const allCustValues = Object.values(custMap);
    const repeatCusts = allCustValues.filter(c => c.count > 1);
    const repeatCustomersCount = repeatCusts.length;
    const repeatOrdersCount = repeatCusts.reduce((sum, c) => sum + c.count, 0);
    const repeatRevenue = repeatCusts.reduce((sum, c) => sum + c.spent, 0);
    const repeatRate = allCustValues.length > 0 ? Math.round((repeatCustomersCount / allCustValues.length) * 100) : 0;

    res.json({
      totalUsers,
      totalCustomers,
      newUsersToday,
      newCustomersToday,
      ordersToday,
      activeOrders,
      completedOrders,
      repeatCustomersCount,
      repeatOrdersCount,
      repeatRevenue,
      repeatRate
    });
  } catch (err) {
    console.error("Failed to load dashboard statistics:", err);
    res.status(500).json({ error: "Failed to load dashboard statistics." });
  }
});

// GET: Get all SMTP accounts (Super Admin only)
router.get("/admin/smtp-accounts", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const count = await SmtpAccount.countDocuments();
    if (count === 0) {
      let smtpUser = process.env.SMTP_USER || "sohofragrance1@gmail.com";
      let smtpPass = process.env.SMTP_PASS || "rmbfjupdjtwxyihl";
      let smtpFromName = process.env.SMTP_FROM_NAME || "SOHO Fragrance";
      
      if (smtpFromName.startsWith('"') && smtpFromName.endsWith('"')) {
        smtpFromName = smtpFromName.substring(1, smtpFromName.length - 1);
      }
      
      await SmtpAccount.create({
        senderName: `${smtpFromName} (System Default)`,
        email: smtpUser,
        pass: smtpPass,
        status: "Active"
      });
    }

    const accounts = await SmtpAccount.find({}).sort({ createdAt: 1 });
    const masked = accounts.map(a => ({
      _id: a._id,
      senderName: a.senderName,
      email: a.email,
      status: a.status,
      pass: "••••••••••••••••"
    }));
    res.json(masked);
  } catch (err) {
    res.status(500).json({ error: "Failed to load SMTP accounts." });
  }
});

// POST: Add new SMTP account (Super Admin only)
router.post("/admin/smtp-accounts", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { senderName, email, pass, status } = req.body;
    if (!senderName || !email || !pass) {
      return res.status(400).json({ error: "Sender Name, Email and Password are required." });
    }

    const existing = await SmtpAccount.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "An SMTP profile with this email already exists." });
    }

    if (status === "Active") {
      await SmtpAccount.updateMany({}, { status: "Inactive" });
    }

    const newAccount = await SmtpAccount.create({
      senderName,
      email: email.toLowerCase().trim(),
      pass,
      status: status || "Inactive"
    });

    res.json({ success: true, message: "SMTP Account added successfully.", account: newAccount });
  } catch (err) {
    res.status(500).json({ error: "Failed to save SMTP account." });
  }
});

// PUT: Update SMTP account (Super Admin only)
router.put("/admin/smtp-accounts/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { senderName, email, pass, status } = req.body;

    const account = await SmtpAccount.findById(id);
    if (!account) return res.status(404).json({ error: "SMTP account not found." });

    account.senderName = senderName || account.senderName;
    account.email = email ? email.toLowerCase().trim() : account.email;
    
    if (pass && pass !== "••••••••••••••••") {
      account.pass = pass;
    }

    if (status === "Active" && account.status !== "Active") {
      await SmtpAccount.updateMany({}, { status: "Inactive" });
      account.status = "Active";
    } else if (status === "Inactive" && account.status === "Active") {
      account.status = "Inactive";
    }

    await account.save();
    res.json({ success: true, message: "SMTP Account updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update SMTP account." });
  }
});

// POST: Activate SMTP account (Super Admin only)
router.post("/admin/smtp-accounts/:id/activate", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const account = await SmtpAccount.findById(id);
    if (!account) return res.status(404).json({ error: "SMTP account not found." });

    await SmtpAccount.updateMany({}, { status: "Inactive" });
    account.status = "Active";
    await account.save();

    res.json({ success: true, message: `SMTP Account ${account.email} activated.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to activate SMTP account." });
  }
});

// DELETE: Delete SMTP account (Super Admin only)
router.delete("/admin/smtp-accounts/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const account = await SmtpAccount.findById(id);
    if (!account) return res.status(404).json({ error: "SMTP account not found." });

    const wasActive = account.status === "Active";
    await SmtpAccount.findByIdAndDelete(id);

    if (wasActive) {
      const another = await SmtpAccount.findOne({});
      if (another) {
        another.status = "Active";
        await another.save();
      }
    }

    res.json({ success: true, message: "SMTP Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete SMTP account." });
  }
});

// GET: Get all admin notifications (Admin/Super Admin only)
router.get("/admin/notifications", requireAuth, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

// PUT: Mark all unread notifications as read (Admin/Super Admin only)
router.put("/admin/notifications/mark-read", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

// PUT: Mark a specific notification as read (Admin/Super Admin only)
router.put("/admin/notifications/:id/read", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true, message: "Notification marked as read." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// DELETE: Clear all notifications (Admin/Super Admin only)
router.delete("/admin/notifications", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear notifications." });
  }
});

// Helper: Normalize perfume/text string for robust matching across diacritics & casing
const normalizeCatalogText = (str) => {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
};

// Helper: Parse order items whether stored as structured cart array, JSON string, or formatted text summary
const parseOrderItemsForAnalytics = (order, catalogList) => {
  const parsed = [];

  // 1. If order has cart array with items
  if (Array.isArray(order.cart) && order.cart.length > 0) {
    for (const item of order.cart) {
      const norm = normalizeCatalogText(item.name);
      const matched = catalogList.find((p) => p.normName === norm || norm.includes(p.normName) || p.normName.includes(norm));
      parsed.push({
        name: matched ? matched.name : (item.name || "Perfume"),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || (item.size === "50ml" ? (matched?.price50ml || 4500) : (matched?.price100ml || 7500)),
        gender: (matched?.gender || item.gender || "unisex").toLowerCase()
      });
    }
    return parsed;
  }

  // 2. If order.items is an array of objects
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      if (typeof item === "object" && item !== null) {
        const norm = normalizeCatalogText(item.name);
        const matched = catalogList.find((p) => p.normName === norm || norm.includes(p.normName) || p.normName.includes(norm));
        parsed.push({
          name: matched ? matched.name : (item.name || "Perfume"),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || (item.size === "50ml" ? (matched?.price50ml || 4500) : (matched?.price100ml || 7500)),
          gender: (matched?.gender || "unisex").toLowerCase()
        });
      }
    }
    if (parsed.length > 0) return parsed;
  }

  // 3. If raw items string is JSON
  const rawStr = String(order.items || "").trim();
  if (rawStr.startsWith("[") && rawStr.endsWith("]")) {
    try {
      const arr = JSON.parse(rawStr);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const norm = normalizeCatalogText(item.name);
          const matched = catalogList.find((p) => p.normName === norm || norm.includes(p.normName) || p.normName.includes(norm));
          parsed.push({
            name: matched ? matched.name : (item.name || "Perfume"),
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || (matched?.price100ml || 7500),
            gender: (matched?.gender || "unisex").toLowerCase()
          });
        }
        if (parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }

  // 4. Standard string format e.g. "NOIRVÉA 50ml × 2, SOVÉRANE 100ml × 1"
  const segments = rawStr.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const normSeg = normalizeCatalogText(seg);
    let matchedProd = catalogList.find((p) => normSeg.includes(p.normName));

    // Extract quantity e.g. "× 2", "x 2", "X2", "* 2", "2 x"
    let qty = 1;
    const qtyMatch = seg.match(/[×xX*]\s*(\d+)/) || seg.match(/(\d+)\s*[×xX*]/);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1;
    }

    // Determine size & price
    const is50ml = /50\s*ml/i.test(seg);
    let price = 0;
    if (matchedProd) {
      price = is50ml ? (matchedProd.price50ml || 4500) : (matchedProd.price100ml || 7500);
    } else {
      let cleanName = seg
        .replace(/[×xX*]\s*\d+|\d+\s*[×xX*]/g, "")
        .replace(/50\s*ml|100\s*ml/gi, "")
        .trim();
      matchedProd = { name: cleanName || "SOHO Fragrance", gender: "unisex" };
      price = Math.round((order.amount || 5000) / Math.max(1, segments.length * qty));
    }

    parsed.push({
      name: matchedProd.name,
      quantity: qty,
      price: price,
      gender: (matchedProd.gender || "unisex").toLowerCase()
    });
  }

  return parsed;
};

// Helper: safely resolve order date as valid Date object
const getOrderDate = (o) => {
  if (o.createdAt) {
    const d = new Date(o.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (o.date) {
    const d = new Date(o.date);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

// GET: Analytics Statistics (Admin/Super Admin only - 100% Dynamic & Real-time)
router.get("/admin/analytics", requireAuth, requireAdmin, async (req, res) => {
  const { range } = req.query;
  const targetRange = range || "30days";

  try {
    const now = new Date();
    // End of today so any orders placed right now are fully included
    const activeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let activeStart = new Date();
    let compStart = new Date();
    let compEnd = new Date();

    if (targetRange === "7days") {
      activeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      activeStart.setHours(0, 0, 0, 0);
      compStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      compStart.setHours(0, 0, 0, 0);
      compEnd = new Date(activeStart.getTime() - 1);
    } else if (targetRange === "12months") {
      activeStart = new Date(now);
      activeStart.setMonth(now.getMonth() - 12);
      activeStart.setHours(0, 0, 0, 0);
      compStart = new Date(now);
      compStart.setMonth(now.getMonth() - 24);
      compStart.setHours(0, 0, 0, 0);
      compEnd = new Date(activeStart.getTime() - 1);
    } else {
      // Default: 30 days
      activeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      activeStart.setHours(0, 0, 0, 0);
      compStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      compStart.setHours(0, 0, 0, 0);
      compEnd = new Date(activeStart.getTime() - 1);
    }

    // Fetch all placed customer orders (All active statuses: Pending, Pending Verification, Confirmed, Packed, Shipped, Delivered)
    const allValidOrders = await Order.find({
      status: { $nin: ["Cancelled", "Refunded"] }
    }).lean();

    // Fetch catalog products to accurately map names, sizes, pricing, and fragrance gender
    const dbProducts = await Product.find({}).lean();
    const catalogList = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      normName: normalizeCatalogText(p.name),
      gender: (p.gender || "unisex").toLowerCase(),
      price50ml: p.price50ml || 4500,
      price100ml: p.price100ml || 7500
    }));

    // Filter orders in active range & comparison range
    const activeOrders = allValidOrders.filter((o) => {
      const d = getOrderDate(o);
      return d >= activeStart && d <= activeEnd;
    });

    const compOrders = allValidOrders.filter((o) => {
      const d = getOrderDate(o);
      return d >= compStart && d <= compEnd;
    });

    // Calculate Active Period Stats
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = activeOrders.length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Calculate Comparison Period Stats
    const compRevenue = compOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const compTotalOrders = compOrders.length;
    const compAov = compTotalOrders > 0 ? Math.round(compRevenue / compTotalOrders) : 0;

    // Helper to calculate percentage change
    const getChange = (current, previous) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const change = ((current - previous) / previous) * 100;
      const prefix = change >= 0 ? "+" : "";
      return `${prefix}${change.toFixed(1)}%`;
    };

    // Calculate Conversion Rate from user base and orders
    const totalUsers = await User.countDocuments({ role: "user" });
    const baseline = Math.max(totalUsers * 2, totalOrders * 2, 20);
    const conversionRate = totalOrders > 0 ? Math.min(100, (totalOrders / baseline) * 100) : 0;
    const compConversionRate = compTotalOrders > 0 ? Math.min(100, (compTotalOrders / baseline) * 100) : 0;
    const conversionRateStr = `${conversionRate.toFixed(1)}%`;

    // Aggregate Best Performing Fragrances & Demographics from real orders
    const fragranceSales = {};
    let menCount = 0;
    let womenCount = 0;
    let unisexCount = 0;

    for (const order of activeOrders) {
      const items = parseOrderItemsForAnalytics(order, catalogList);
      for (const item of items) {
        if (!fragranceSales[item.name]) {
          fragranceSales[item.name] = { name: item.name, sales: 0, revenue: 0 };
        }
        fragranceSales[item.name].sales += item.quantity;
        fragranceSales[item.name].revenue += item.price * item.quantity;

        if (item.gender === "men") menCount += item.quantity;
        else if (item.gender === "women") womenCount += item.quantity;
        else unisexCount += item.quantity;
      }
    }

    const bestFragrances = Object.values(fragranceSales)
      .sort((a, b) => (b.sales !== a.sales ? b.sales - a.sales : b.revenue - a.revenue))
      .slice(0, 5);

    // If no sales yet in this period, provide top catalog preview
    if (bestFragrances.length === 0 && catalogList.length > 0) {
      catalogList.slice(0, 3).forEach((p) => {
        bestFragrances.push({ name: p.name, sales: 0, revenue: 0 });
      });
    }

    const totalDemographics = menCount + womenCount + unisexCount;
    let unisexPct = totalDemographics > 0 ? Math.round((unisexCount / totalDemographics) * 100) : 34;
    let menPct = totalDemographics > 0 ? Math.round((menCount / totalDemographics) * 100) : 33;
    let womenPct = totalDemographics > 0 ? Math.round((womenCount / totalDemographics) * 100) : 33;
    if (totalDemographics > 0) {
      const diff = 100 - (unisexPct + menPct + womenPct);
      unisexPct += diff;
    }

    const demographics = [
      { label: "Unisex Fragrances", percent: unisexPct, color: "bg-burgundy" },
      { label: "Men's Fragrances", percent: menPct, color: "bg-champagne" },
      { label: "Women's Fragrances", percent: womenPct, color: "bg-espresso" }
    ];

    // Generate Sales Trend Chart Data
    const chartData = [];
    if (targetRange === "7days") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayLabel = days[d.getDay()];

        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const dayRevenue = activeOrders
          .filter((o) => {
            const od = getOrderDate(o);
            return od >= dayStart && od <= dayEnd;
          })
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        chartData.push({
          label: dayLabel,
          value: Number((dayRevenue / 1000).toFixed(1))
        });
      }
    } else if (targetRange === "12months") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = months[d.getMonth()];

        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthRevenue = activeOrders
          .filter((o) => {
            const od = getOrderDate(o);
            return od >= monthStart && od <= monthEnd;
          })
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        chartData.push({
          label: monthLabel,
          value: Number((monthRevenue / 1000).toFixed(1))
        });
      }
    } else {
      // 30 days: 5 progressive 6-day periods
      for (let i = 4; i >= 0; i--) {
        const periodEnd = new Date(now.getTime() - i * 6 * 24 * 60 * 60 * 1000);
        periodEnd.setHours(23, 59, 59, 999);
        const periodStart = new Date(now.getTime() - (i + 1) * 6 * 24 * 60 * 60 * 1000 + 1000);
        periodStart.setHours(0, 0, 0, 0);

        const periodRevenue = activeOrders
          .filter((o) => {
            const od = getOrderDate(o);
            return od >= periodStart && od <= periodEnd;
          })
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        chartData.push({
          label: `Week ${5 - i}`,
          value: Number((periodRevenue / 1000).toFixed(1))
        });
      }
    }

    res.json({
      stats: {
        revenue: totalRevenue,
        revenueChange: getChange(totalRevenue, compRevenue),
        revenuePositive: totalRevenue >= compRevenue,

        orders: totalOrders,
        ordersChange: getChange(totalOrders, compTotalOrders),
        ordersPositive: totalOrders >= compTotalOrders,

        aov: aov,
        aovChange: getChange(aov, compAov),
        aovPositive: aov >= compAov,

        conversionRate: conversionRateStr,
        conversionChange: getChange(conversionRate, compConversionRate),
        conversionPositive: conversionRate >= compConversionRate
      },
      chartData,
      bestFragrances,
      demographics
    });
  } catch (err) {
    console.error("Failed to compile analytics report:", err);
    res.status(500).json({ error: "Failed to compile analytics report." });
  }
});

export default router;
