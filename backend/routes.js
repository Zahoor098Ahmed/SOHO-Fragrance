import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Product, Order, Config, Contact, Review, SmtpAccount, Notification } from "./models.js";
import { sendOTP } from "./email.js";

const router = express.Router();

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
        email: user.email,
        name: user.name,
        role: user.role
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
    if (!user) {
      return res.status(404).json({ error: "User not found." });
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
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server 2FA verification error." });
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

// POST: Place a new order (Require authenticated User, deduct stock, generate track ID)
router.post("/orders", requireAuth, async (req, res) => {
  const { customer, phone, email, items, amount, payment, city, address, province, cart } = req.body;

  if (!customer || !phone || !email || !items || !amount || !payment || !city || !address) {
    return res.status(400).json({ error: "Missing order information details." });
  }

  try {
    // Generate secure order tracking number
    const trackingId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = new Order({
      id: trackingId,
      userId: req.user.id,
      customer,
      phone,
      email: email.toLowerCase().trim(),
      items,
      amount,
      payment,
      status: "Pending",
      date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
      city,
      address,
      province
    });

    await newOrder.save();

    // Deduct stock for each cart item
    if (Array.isArray(cart)) {
      for (const item of cart) {
        const product = await Product.findOne({ id: item.productId });
        if (product) {
          if (item.size === "50ml") {
            product.stock50ml = Math.max(0, product.stock50ml - item.quantity);
          } else {
            product.stock100ml = Math.max(0, product.stock100ml - item.quantity);
          }
          await product.save();
        }
      }
    }
    // Create admin notification
    try {
      await Notification.create({
        title: "New Order Placed",
        message: `Order #${trackingId} for Rs. ${amount.toLocaleString()} was placed by ${customer}.`,
        type: "order",
        link: "/admin/orders"
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification:", notifErr);
    }

    res.status(201).json({ success: true, orderId: trackingId });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order." });
  }
});

// GET: List all orders (Admins get all, regular clients get their own)
router.get("/orders", requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      // Enforce client boundaries: retrieve orders matching user id or user email
      query = {
        $or: [
          { userId: req.user.id },
          { email: req.user.email.toLowerCase().trim() }
        ]
      };
    }
    const list = await Order.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// PUT: Update order status (Admin/Super Admin only)
router.put("/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await Order.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Order not found." });
    res.json(updated);
  } catch (err) {
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
    const steps = [
      {
        label: "Order Received",
        desc: "Your order has been received and logged in our system.",
        date: matchedOrder.date,
        done: true,
      },
      {
        label: "Order Confirmed",
        desc: "Payment verified. Preparing your fragrance collection for packaging.",
        date: ["Pending"].includes(status) ? "Pending" : matchedOrder.date,
        done: !["Pending", "Cancelled", "Refunded"].includes(status),
      },
      {
        label: "Dispatched",
        desc: "Handed over to Trax Logistics courier partner.",
        date: ["Pending", "Confirmed", "Processing", "Packed"].includes(status) ? "Pending" : matchedOrder.date,
        done: ["Shipped", "Out for Delivery", "Delivered"].includes(status),
      },
      {
        label: "Delivered",
        desc: "Parcel delivered to your doorstep.",
        date: status === "Delivered" ? matchedOrder.date : "Pending",
        done: status === "Delivered",
      },
    ];

    res.json({
      id: matchedOrder.id,
      status: matchedOrder.status,
      carrier: "Trax Logistics",
      estimatedDelivery: matchedOrder.status === "Delivered" ? "Delivered" : "2-3 Working Days",
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
    const cfg = await Config.findOne({ key: req.params.key });
    res.json(cfg ? cfg.value : null);
  } catch (err) {
    res.status(500).json({ error: "Failed to read configuration." });
  }
});

// PUT: Save Config parameter value by key (Admin/Super Admin only)
router.put("/config/:key", requireAuth, requireAdmin, async (req, res) => {
  const { value } = req.body;
  try {
    const updated = await Config.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { new: true, upsert: true }
    );
    res.json(updated.value);
  } catch (err) {
    res.status(500).json({ error: "Failed to save configuration." });
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

// GET: Get configuration parameter by key
router.get("/config/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const sensitiveKeys = ["smtp_pass", "smtp_user"];

    if (sensitiveKeys.includes(key)) {
      // Enforce auth check dynamically for sensitive configurations
      return requireAuth(req, res, async () => {
        if (!req.user || req.user.role !== "superadmin") {
          return res.status(403).json({ error: "Access denied. Super Admin privileges required." });
        }
        const config = await Config.findOne({ key });
        if (config) return res.json(config.value);

        // Fallback to environment variables if not saved in DB yet
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

    // Fallback to environment variables or defaults
    let fallback = "";
    if (key === "store_name") fallback = process.env.SMTP_FROM_NAME || "SOHO Fragrance";
    if (key === "currency") fallback = "PKR (₨)";
    if (key === "support_email") fallback = "support@sohofragrance.com";
    if (key === "smtp_from_name") fallback = process.env.SMTP_FROM_NAME || "SOHO Fragrance";

    if (typeof fallback === "string" && fallback.startsWith('"') && fallback.endsWith('"')) {
      fallback = fallback.substring(1, fallback.length - 1);
    }
    res.json(fallback);
  } catch (err) {
    res.status(500).json({ error: "Failed to load configuration." });
  }
});

// PUT: Create or update configuration parameter by key
router.put("/config/:key", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const config = await Config.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: "Configuration saved successfully.", config });
  } catch (err) {
    res.status(500).json({ error: "Failed to save configuration." });
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

    res.json({
      totalUsers,
      totalCustomers,
      newUsersToday,
      newCustomersToday,
      ordersToday,
      activeOrders,
      completedOrders
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

// GET: Analytics Statistics (Admin/Super Admin only)
router.get("/admin/analytics", requireAuth, requireAdmin, async (req, res) => {
  const { range } = req.query;
  const targetRange = range || "30days";

  try {
    const now = new Date();
    let startDate = new Date();
    let compStartDate = new Date();
    let compEndDate = new Date();

    // Determine Date Boundaries
    if (targetRange === "7days") {
      startDate.setDate(now.getDate() - 7);
      compStartDate.setDate(now.getDate() - 14);
      compEndDate.setDate(now.getDate() - 7);
    } else if (targetRange === "12months") {
      startDate.setMonth(now.getMonth() - 12);
      compStartDate.setMonth(now.getMonth() - 24);
      compEndDate.setMonth(now.getMonth() - 12);
    } else {
      // Default: 30 days
      startDate.setDate(now.getDate() - 30);
      compStartDate.setDate(now.getDate() - 60);
      compEndDate.setDate(now.getDate() - 30);
    }

    const SUCCESSFUL_STATUSES = ["Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

    // Fetch orders in active range
    const activeOrders = await Order.find({
      status: { $in: SUCCESSFUL_STATUSES },
      createdAt: { $gte: startDate, $lte: now }
    });

    // Fetch orders in comparison range
    const compOrders = await Order.find({
      status: { $in: SUCCESSFUL_STATUSES },
      createdAt: { $gte: compStartDate, $lte: compEndDate }
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

    // Calculate User count for Conversion Rate simulation
    const totalUsers = await User.countDocuments({ role: "user" });

    // Simulate Conversion Rate
    const conversionRate = totalOrders > 0 ? ((totalOrders / Math.max(1, totalUsers * 1.8)) * 100) : 0;
    const compConversionRate = compTotalOrders > 0 ? ((compTotalOrders / Math.max(1, totalUsers * 1.8)) * 100) : 0;

    const conversionRateStr = `${Math.min(10, Math.max(0.5, conversionRate)).toFixed(1)}%`;
    const compConversionRateStr = `${Math.min(10, Math.max(0.5, compConversionRate)).toFixed(1)}%`;

    // Aggregate Best Performing Fragrances
    const fragranceSales = {};
    for (const order of activeOrders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const key = item.name || item.productId;
          if (!key) continue;
          if (!fragranceSales[key]) {
            fragranceSales[key] = { name: key, sales: 0, revenue: 0 };
          }
          fragranceSales[key].sales += item.quantity || 1;
          fragranceSales[key].revenue += (item.price || 0) * (item.quantity || 1);
        }
      }
    }

    const bestFragrances = Object.values(fragranceSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);

    // Default seeded fragrances if none sold yet
    if (bestFragrances.length === 0) {
      bestFragrances.push(
        { name: "VELORÉN", sales: 18, revenue: 135000 },
        { name: "SOVERANE", sales: 14, revenue: 63000 },
        { name: "OUD INTELLECT", sales: 10, revenue: 75000 }
      );
    }

    // Aggregate Demographics
    let unisexCount = 0;
    let menCount = 0;
    let womenCount = 0;

    for (const order of activeOrders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = item.quantity || 1;
          const nameLower = (item.name || "").toLowerCase();
          if (nameLower.includes("velorén") || nameLower.includes("unisex") || nameLower.includes("intellect")) {
            unisexCount += qty;
          } else if (nameLower.includes("soverane") || nameLower.includes("men")) {
            menCount += qty;
          } else {
            womenCount += qty;
          }
        }
      }
    }

    const totalDemographics = unisexCount + menCount + womenCount;
    const demographics = [
      { label: "Unisex Fragrances", percent: totalDemographics > 0 ? Math.round((unisexCount / totalDemographics) * 100) : 45, color: "bg-burgundy" },
      { label: "Men's Fragrances", percent: totalDemographics > 0 ? Math.round((menCount / totalDemographics) * 100) : 35, color: "bg-champagne" },
      { label: "Women's Fragrances", percent: totalDemographics > 0 ? Math.round((womenCount / totalDemographics) * 100) : 20, color: "bg-espresso" }
    ];

    // Generate Sales Trend Chart Data
    const chartData = [];
    if (targetRange === "7days") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayLabel = days[d.getDay()];
        
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
        const dayRevenue = activeOrders
          .filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd)
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        chartData.push({
          label: dayLabel,
          value: Math.round(dayRevenue / 1000)
        });
      }
    } else if (targetRange === "12months") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthLabel = months[d.getMonth()];

        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const monthRevenue = activeOrders
          .filter(o => o.createdAt >= monthStart && o.createdAt <= monthEnd)
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        chartData.push({
          label: monthLabel,
          value: Math.round(monthRevenue / 1000)
        });
      }
    } else {
      for (let i = 4; i >= 0; i--) {
        const endDay = new Date();
        endDay.setDate(now.getDate() - (i * 6));
        const startDay = new Date();
        startDay.setDate(now.getDate() - ((i + 1) * 6));

        const weekRevenue = activeOrders
          .filter(o => o.createdAt >= startDay && o.createdAt <= endDay)
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        chartData.push({
          label: `Week ${5 - i}`,
          value: Math.round(weekRevenue / 1000)
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
