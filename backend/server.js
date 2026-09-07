import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import router from "./routes.js";
import { User, Product, Config, Order, Review } from "./models.js";

dotenv.config();

const app = express();

// Ensure upload directory exists for payment receipts
const uploadDir = path.join(process.cwd(), "uploads", "receipts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. High Security Middlewares
// Allow cross-origin resource sharing for static uploaded images while keeping other secure headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve uploaded receipts statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// CORS configuration - Only allow frontend origin access
app.use(cors({
  origin: [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:8443", "http://127.0.0.1:8443"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Express Rate Limiter - Prevent DDoS / Brute Force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes."
});
app.use("/api", apiLimiter);

// Parse JSON with limit (prevent huge payload DOS attacks)
app.use(express.json({ limit: "10mb" }));

// 2. Database Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/soho_fragrance";
mongoose.connect(mongoURI)
  .then(async () => {
    console.log("Connected to MongoDB database successfully.");
    await seedDatabase();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Register API Routes
app.use("/api", router);

// Default error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Secured backend server running on port ${PORT}`);
});



// Seeding Initial Data
async function seedDatabase() {
  try {
    // 1. Seed Users (Bcrypt Hashed Passwords) - Seed individual users if they don't already exist
    const userPass = await bcrypt.hash("user123", 10);
    const adminPass = await bcrypt.hash("admin123", 10);
    const superadminPass = await bcrypt.hash("super123", 10);

    const defaultUsers = [
      { name: "Kamran Khan (Owner)", email: "superadmin@soho.com", password: superadminPass, role: "superadmin", isVerified: true },
      { name: "Fatima Shah (Admin)", email: "admin@soho.com", password: adminPass, role: "admin", isVerified: true },
      { name: "Ali Akber", email: "user@soho.com", password: userPass, role: "user", isVerified: true },
      { name: "Ayesha Khan", email: "ayesha@example.com", password: userPass, role: "user", isVerified: true },
      { name: "Hassan Raza", email: "hassan@example.com", password: userPass, role: "user", isVerified: true },
      { name: "Sara Ahmed", email: "sara@example.com", password: userPass, role: "user", isVerified: true },
      { name: "Zainab Malik", email: "zainab.malik@outlook.com", password: userPass, role: "user", isVerified: true },
      { name: "Bilal Khan", email: "bilal.khan@gmail.com", password: userPass, role: "user", isVerified: true },
      { name: "Sara Ahmed (Yahoo)", email: "sara.ahmed@yahoo.com", password: userPass, role: "user", isVerified: true },
      // Migrated users from local storage
      { name: "Abdullah", email: "abc@gmail.com", password: userPass, role: "user", isVerified: true },
      { name: "Zahoor", email: "zahoorjamali32@gmail.com", password: userPass, role: "user", isVerified: true },
      { name: "abc", email: "abcd@gmail.com", password: userPass, role: "user", isVerified: true }
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
      }
    }

    // 2. Seed Configurations (shipping, gateways, IPs, etc.)
    const configCount = await Config.countDocuments({});
    if (configCount === 0) {
      console.log("Seeding configuration parameters...");
      await Config.create([
        {
          key: "gateways",
          value: [
            { id: "cod", name: "Cash on Delivery (COD)", active: false, region: "Pakistan Nationwide", fee: "Rs. 0" },
            { id: "bank", name: "Bank Direct Transfer", active: true, region: "Pakistan Local Accounts", fee: "Rs. 0" },
            { id: "jazzcash", name: "JazzCash Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
            { id: "easypaisa", name: "Easypaisa Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
            { id: "nayapay", name: "NayaPay Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
            { id: "sadapay", name: "SadaPay Mobile Wallet", active: true, region: "Pakistan Mobile Accounts", fee: "Rs. 0" },
          ]
        },
        {
          key: "shipping_methods",
          value: [
            { zone: "Karachi Same-Day Delivery", price: 250, time: "4-12 Hours", active: true },
            { zone: "Pakistan Standard Shipping", price: 0, time: "2-3 Working Days", active: true },
            { zone: "International Priority Scent Delivery", price: 6500, time: "5-7 Working Days", active: false }
          ]
        },
        {
          key: "security_ips",
          value: ["192.168.1.100 (Home)", "110.39.2.14 (Office)"]
        },
        {
          key: "security_2fa",
          value: true
        },
        {
          key: "security_timeout",
          value: "60"
        },
        {
          key: "roles",
          value: [
            { id: 1, name: "Super Admin", usersCount: 1, permissions: ["all"], level: "System Level" },
            { id: 2, name: "Admin", usersCount: 2, permissions: ["products.manage", "orders.manage", "customers.view"], level: "Store Level" },
            { id: 3, name: "Content Admin", usersCount: 1, permissions: ["content.manage", "reviews.manage"], level: "Content Level" }
          ]
        }
      ]);
    }

    // 3. Seed Products
    const defaultProducts = [
      {
        id: "01",
        slug: "veloren",
        name: "VELORÉN",
        family: "Amber Woody",
        description: "A sophisticated amber composition where soft spices meet polished woods and warm skin-like musk.",
        price50ml: 4500,
        price100ml: 7500,
        bottleColor: "#3B0D18",
        bottleCapColor: "#D6B98C",
        liquidColor: "#8B4513",
        bgAccent: "#3B0D18",
        image: "https://images.unsplash.com/photo-1638295916768-459f6cf440bc?w=600&h=800&fit=crop&auto=format",
        gender: "unisex",
        tags: ["Amber", "Woody"],
        isBestSeller: true,
        rating: 4.8,
        reviewsCount: 124,
        stock50ml: 45,
        stock100ml: 32,
        topNotes: ["Bergamot", "Pink Pepper", "Cardamom"],
        heartNotes: ["Iris", "Orris", "Lavender"],
        baseNotes: ["Amber", "Sandalwood", "Musk"]
      },
      {
        id: "02",
        slug: "noirvea",
        name: "NOIRVÉA",
        family: "Woody Oriental",
        description: "A deep and commanding fragrance built around oud, saffron and warm leather.",
        price50ml: 5500,
        price100ml: 8500,
        bottleColor: "#1A1008",
        bottleCapColor: "#D6B98C",
        liquidColor: "#4A2C0A",
        bgAccent: "#2A1B18",
        image: "https://images.unsplash.com/photo-1598634222670-87c5f558119c?w=600&h=800&fit=crop&auto=format",
        gender: "men",
        tags: ["Oud", "Woody"],
        isBestSeller: true,
        rating: 4.9,
        reviewsCount: 98,
        stock50ml: 28,
        stock100ml: 15,
        topNotes: ["Bergamot", "Black Pepper", "Saffron"],
        heartNotes: ["Oud", "Rose", "Cedar"],
        baseNotes: ["Amber", "Leather", "Musk"]
      },
      {
        id: "03",
        slug: "aurevon",
        name: "AURÉVON",
        family: "Amber Floral",
        description: "Soft florals wrapped in luminous amber and creamy vanilla.",
        price50ml: 4800,
        price100ml: 7800,
        bottleColor: "#D6B98C",
        bottleCapColor: "#C4A882",
        liquidColor: "#E8C99A",
        bgAccent: "#C4A882",
        image: "https://images.unsplash.com/photo-1566977776052-6e61e35bf9be?w=600&h=800&fit=crop&auto=format",
        gender: "women",
        tags: ["Amber", "Floral"],
        isNewArrival: true,
        rating: 4.7,
        reviewsCount: 67,
        stock50ml: 52,
        stock100ml: 38,
        topNotes: ["Pear", "Bergamot", "Pink Pepper"],
        heartNotes: ["Rose", "Jasmine", "Orange Blossom"],
        baseNotes: ["Vanilla", "Amber", "Musk"]
      },
      {
        id: "04",
        slug: "ombrelis",
        name: "OMBRÉLIS",
        family: "Dark Woody",
        description: "A mysterious woody fragrance inspired by midnight forests and polished dark woods.",
        price50ml: 5200,
        price100ml: 8200,
        bottleColor: "#3A3230",
        bottleCapColor: "#A99A8C",
        liquidColor: "#2A1B18",
        bgAccent: "#2A1B18",
        image: "https://images.unsplash.com/photo-1676951334972-2e65e67f4cbe?w=600&h=800&fit=crop&auto=format",
        gender: "men",
        tags: ["Woody", "Oud"],
        rating: 4.6,
        reviewsCount: 55,
        stock50ml: 40,
        stock100ml: 25,
        topNotes: ["Black Pepper", "Cypress", "Bergamot"],
        heartNotes: ["Cedar", "Vetiver", "Oud"],
        baseNotes: ["Patchouli", "Amber", "Smoked Woods"]
      },
      {
        id: "05",
        slug: "selvaro",
        name: "SÉLVARO",
        family: "Fresh Woody",
        description: "A refined fresh woody fragrance designed for effortless everyday elegance.",
        price50ml: 4200,
        price100ml: 7000,
        bottleColor: "#F6F0E7",
        bottleCapColor: "#D6B98C",
        liquidColor: "#E8DCC8",
        bgAccent: "#A99A8C",
        image: "https://images.unsplash.com/photo-1613521076081-2820f9746a2d?w=600&h=800&fit=crop&auto=format",
        gender: "unisex",
        tags: ["Fresh", "Woody"],
        rating: 4.5,
        reviewsCount: 82,
        stock50ml: 60,
        stock100ml: 44,
        topNotes: ["Bergamot", "Lemon", "Mandarin"],
        heartNotes: ["Lavender", "Clary Sage", "Geranium"],
        baseNotes: ["Cedar", "Vetiver", "White Musk"]
      },
      {
        id: "06",
        slug: "ravelien",
        name: "RAVÉLIEN",
        family: "Rose Amber",
        description: "A modern rose composition elevated with saffron, creamy woods and glowing amber.",
        price50ml: 4500,
        price100ml: 7500,
        bottleColor: "#B98C8C",
        bottleCapColor: "#D6B98C",
        liquidColor: "#C9A0A0",
        bgAccent: "#B98C8C",
        image: "https://images.unsplash.com/photo-1608721279136-cd41b752fa41?w=600&h=800&fit=crop&auto=format",
        gender: "women",
        tags: ["Floral", "Amber"],
        isBestSeller: true,
        rating: 4.8,
        reviewsCount: 110,
        stock50ml: 35,
        stock100ml: 22,
        topNotes: ["Saffron", "Bergamot", "Pink Pepper"],
        heartNotes: ["Damask Rose", "Jasmine", "Orris"],
        baseNotes: ["Amber", "Vanilla", "Sandalwood"]
      },
      {
        id: "07",
        slug: "elvaro-noir",
        name: "ÉLVARO NOIR",
        family: "Leather Woody",
        description: "An elegant leather fragrance with spicy freshness and a smooth woody dry-down.",
        price50ml: 5500,
        price100ml: 8800,
        bottleColor: "#241A18",
        bottleCapColor: "#8B7355",
        liquidColor: "#3D2B20",
        bgAccent: "#241A18",
        image: "https://images.unsplash.com/photo-1723391962110-299d412ca046?w=600&h=800&fit=crop&auto=format",
        gender: "men",
        tags: ["Woody", "Amber"],
        rating: 4.7,
        reviewsCount: 73,
        stock50ml: 30,
        stock100ml: 18,
        topNotes: ["Black Pepper", "Cardamom", "Bergamot"],
        heartNotes: ["Leather", "Cedar", "Violet Leaf"],
        baseNotes: ["Tonka", "Amber", "Vetiver"]
      },
      {
        id: "08",
        slug: "calvere",
        name: "CALVÉRÉ",
        family: "Vanilla Amber",
        description: "A sensual vanilla amber fragrance with soft spice and creamy sandalwood.",
        price50ml: 4800,
        price100ml: 7800,
        bottleColor: "#E8D5B0",
        bottleCapColor: "#C4A882",
        liquidColor: "#F0E0C0",
        bgAccent: "#C4A882",
        image: "https://images.unsplash.com/photo-1733660227163-01bc46e0d7d7?w=600&h=800&fit=crop&auto=format",
        gender: "women",
        tags: ["Amber", "Floral"],
        rating: 4.6,
        reviewsCount: 91,
        stock50ml: 48,
        stock100ml: 30,
        topNotes: ["Mandarin", "Pink Pepper", "Bergamot"],
        heartNotes: ["Vanilla", "Jasmine", "Cinnamon"],
        baseNotes: ["Tonka Bean", "Amber", "Sandalwood"]
      },
      {
        id: "09",
        slug: "ovessa",
        name: "ORVÉSSA",
        family: "Floral Musk",
        description: "An elegant floral musk created around luminous petals and soft cashmere woods.",
        price50ml: 4000,
        price100ml: 6800,
        bottleColor: "#F5EDE0",
        bottleCapColor: "#B98C8C",
        liquidColor: "#F8F0E8",
        bgAccent: "#B98C8C",
        image: "https://images.unsplash.com/photo-1589782051446-a24efcec7ffc?w=600&h=800&fit=crop&auto=format",
        gender: "women",
        tags: ["Floral"],
        isNewArrival: true,
        rating: 4.5,
        reviewsCount: 44,
        stock50ml: 55,
        stock100ml: 40,
        topNotes: ["Pear", "Bergamot", "Apple Blossom"],
        heartNotes: ["Peony", "Rose", "Jasmine"],
        baseNotes: ["White Musk", "Vanilla", "Cashmere Wood"]
      },
      {
        id: "10",
        slug: "vendris",
        name: "VÉNDRIS",
        family: "Oud Amber",
        description: "A rich oud composition designed for evening occasions, celebrations and unforgettable entrances.",
        price50ml: 6500,
        price100ml: 9800,
        bottleColor: "#3B0D18",
        bottleCapColor: "#D6B98C",
        liquidColor: "#6B2030",
        bgAccent: "#3B0D18",
        image: "https://images.unsplash.com/photo-1615160460524-432433ba1b8f?w=600&h=800&fit=crop&auto=format",
        gender: "unisex",
        tags: ["Oud", "Amber"],
        isBestSeller: true,
        rating: 4.9,
        reviewsCount: 156,
        stock50ml: 20,
        stock100ml: 10,
        topNotes: ["Saffron", "Cardamom", "Bergamot"],
        heartNotes: ["Oud", "Rose", "Amber"],
        baseNotes: ["Leather", "Patchouli", "Sandalwood"]
      },
      {
        id: "11",
        slug: "alverion",
        name: "ALVÉRION",
        family: "Citrus Aromatic",
        description: "A crisp and sophisticated citrus aromatic fragrance for modern everyday wear.",
        price50ml: 4200,
        price100ml: 7000,
        bottleColor: "#F0EAD8",
        bottleCapColor: "#D6B98C",
        liquidColor: "#F5EDD8",
        bgAccent: "#A99A8C",
        image: "https://images.unsplash.com/photo-1571206508927-2ef3026ada5d?w=600&h=800&fit=crop&auto=format",
        gender: "men",
        tags: ["Fresh"],
        rating: 4.4,
        reviewsCount: 62,
        stock50ml: 65,
        stock100ml: 50,
        topNotes: ["Lemon", "Bergamot", "Grapefruit"],
        heartNotes: ["Lavender", "Neroli", "Sage"],
        baseNotes: ["Cedar", "Musk", "Vetiver"]
      },
      {
        id: "12",
        slug: "soverane",
        name: "SOVÉRANE",
        family: "Signature Amber",
        description: "The signature expression of SOHO — a sophisticated amber composition created to become your unmistakable presence.",
        price50ml: 7500,
        price100ml: 12000,
        bottleColor: "#3B0D18",
        bottleCapColor: "#D6B98C",
        liquidColor: "#7A1A28",
        bgAccent: "#3B0D18",
        image: "https://images.unsplash.com/photo-1600086586698-368d69f00d6e?auto=format&fit=crop&q=80&w=600",
        gender: "unisex",
        tags: ["Amber", "Oud"],
        isBestSeller: true,
        rating: 5.0,
        reviewsCount: 208,
        stock50ml: 18,
        stock100ml: 8,
        topNotes: ["Bergamot", "Saffron", "Black Pepper"],
        heartNotes: ["Jasmine", "Orris", "Rose"],
        baseNotes: ["Amber", "Oud", "Vanilla", "Musk"]
      }
    ];

    console.log("Seeding products list...");
    for (const p of defaultProducts) {
      const exists = await Product.findOne({ slug: p.slug });
      if (!exists) {
        const initialOffsets = { "01": 380, "12": 350, "02": 340, "07": 290, "03": 270, "04": 260, "06": 240, "10": 220, "05": 200, "08": 170, "11": 150, "09": 130 };
        p.bottlesSold = initialOffsets[p.id] || 200;
        await Product.create(p);
      } else {
        const initialOffsets = { "01": 380, "12": 350, "02": 340, "07": 290, "03": 270, "04": 260, "06": 240, "10": 220, "05": 200, "08": 170, "11": 150, "09": 130 };
        if (exists.bottlesSold === undefined || exists.bottlesSold === null) {
          exists.bottlesSold = initialOffsets[p.id] || 200;
        }
        exists.id = p.id;
        await exists.save();
      }
    }

    // 4. Seed Orders (Dynamic current month and year dates)
    const orderCount = await Order.countDocuments({});
    if (orderCount === 0) {
      console.log("Seeding initial orders database...");
      await Order.create([
        { id: "#ORD-1045", customer: "Ayesha Khan", phone: "0300-1234567", email: "ayesha@example.com", items: "SOVÉRANE 100ml × 1", amount: 12000, payment: "JazzCash", status: "Delivered", date: "23 Aug 2026", city: "Karachi", address: "DHA Phase 6" },
        { id: "#ORD-1044", customer: "Hassan Raza", phone: "0321-9876543", email: "hassan@example.com", items: "NOIRVÉA 50ml × 2", amount: 11000, payment: "Cash on Delivery", status: "Shipped", date: "22 Aug 2026", city: "Lahore", address: "Model Town" },
        { id: "#ORD-1043", customer: "Sara Ahmed", phone: "0333-5551234", email: "sara@example.com", items: "RAVÉLIEN 100ml × 1", amount: 7500, payment: "Easypaisa", status: "Processing", date: "22 Aug 2026", city: "Islamabad", address: "Sector F-7" },
      ]);
    }

    // 5. Seed Reviews
    const reviewCount = await Review.countDocuments({});
    if (reviewCount === 0) {
      console.log("Seeding initial reviews database...");
      await Review.create([
        { productId: "01", productName: "VELORÉN", name: "Ayesha K.", email: "ayesha@example.com", rating: 5, text: "Absolutely mesmerizing. The sillage is incredible and lasts all day. Worth every rupee!", date: "Aug 24, 2026", status: "Approved" },
        { productId: "02", productName: "NOIRVÉA", name: "Hassan M.", email: "hassan@example.com", rating: 5, text: "The packaging is as luxurious as the scent. Finally a Pakistani brand that matches international quality.", date: "Aug 23, 2026", status: "Approved" },
        { productId: "03", productName: "AURÉVON", name: "Sara A.", email: "sara@example.com", rating: 4, text: "Love the depth and complexity. Highly recommend for evening wear.", date: "Aug 22, 2026", status: "Approved" }
      ]);
    }
  } catch (err) {
    console.error("Seeding database error:", err);
  }
}
