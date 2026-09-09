export interface Product {
  id: string;
  slug: string;
  name: string;
  family: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longevity: string;
  sillage: string;
  description: string;
  price50ml: number;
  price100ml: number;
  bottleColor: string;
  bottleCapColor: string;
  liquidColor: string;
  bgAccent: string;
  image: string;
  gender: "men" | "women" | "unisex";
  tags: string[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  rating: number;
  reviews: number;
  stock50ml: number;
  stock100ml: number;
  deliveryCharge?: number;
}

export const products: Product[] = [
  {
    id: "01",
    slug: "veloren",
    name: "VELORÉN",
    family: "Amber Woody",
    topNotes: ["Bergamot", "Pink Pepper", "Cardamom"],
    heartNotes: ["Iris", "Orris", "Lavender"],
    baseNotes: ["Amber", "Sandalwood", "Musk"],
    longevity: "8–10 hours",
    sillage: "Strong",
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
    reviews: 124,
    stock50ml: 45,
    stock100ml: 32,
  },
  {
    id: "02",
    slug: "noirvea",
    name: "NOIRVÉA",
    family: "Woody Oriental",
    topNotes: ["Bergamot", "Black Pepper", "Saffron"],
    heartNotes: ["Oud", "Rose", "Cedar"],
    baseNotes: ["Amber", "Leather", "Musk"],
    longevity: "10+ hours",
    sillage: "Very Strong",
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
    reviews: 98,
    stock50ml: 28,
    stock100ml: 15,
  },
  {
    id: "03",
    slug: "aurevon",
    name: "AURÉVON",
    family: "Amber Floral",
    topNotes: ["Pear", "Bergamot", "Pink Pepper"],
    heartNotes: ["Rose", "Jasmine", "Orange Blossom"],
    baseNotes: ["Vanilla", "Amber", "Musk"],
    longevity: "8–9 hours",
    sillage: "Moderate to Strong",
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
    reviews: 67,
    stock50ml: 52,
    stock100ml: 38,
  },
  {
    id: "04",
    slug: "ombrelis",
    name: "OMBRÉLIS",
    family: "Dark Woody",
    topNotes: ["Black Pepper", "Cypress", "Bergamot"],
    heartNotes: ["Cedar", "Vetiver", "Oud"],
    baseNotes: ["Patchouli", "Amber", "Smoked Woods"],
    longevity: "9–11 hours",
    sillage: "Strong",
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
    reviews: 55,
    stock50ml: 40,
    stock100ml: 25,
  },
  {
    id: "05",
    slug: "selvaro",
    name: "SÉLVARO",
    family: "Fresh Woody",
    topNotes: ["Bergamot", "Lemon", "Mandarin"],
    heartNotes: ["Lavender", "Clary Sage", "Geranium"],
    baseNotes: ["Cedar", "Vetiver", "White Musk"],
    longevity: "7–9 hours",
    sillage: "Moderate",
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
    reviews: 82,
    stock50ml: 60,
    stock100ml: 44,
  },
  {
    id: "06",
    slug: "ravelien",
    name: "RAVÉLIEN",
    family: "Rose Amber",
    topNotes: ["Saffron", "Bergamot", "Pink Pepper"],
    heartNotes: ["Damask Rose", "Jasmine", "Orris"],
    baseNotes: ["Amber", "Vanilla", "Sandalwood"],
    longevity: "9–10 hours",
    sillage: "Strong",
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
    reviews: 110,
    stock50ml: 35,
    stock100ml: 22,
  },
  {
    id: "07",
    slug: "elvaro-noir",
    name: "ÉLVARO NOIR",
    family: "Leather Woody",
    topNotes: ["Black Pepper", "Cardamom", "Bergamot"],
    heartNotes: ["Leather", "Cedar", "Violet Leaf"],
    baseNotes: ["Tonka", "Amber", "Vetiver"],
    longevity: "9–11 hours",
    sillage: "Strong",
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
    reviews: 73,
    stock50ml: 30,
    stock100ml: 18,
  },
  {
    id: "08",
    slug: "calvere",
    name: "CALVÉRÉ",
    family: "Vanilla Amber",
    topNotes: ["Mandarin", "Pink Pepper", "Bergamot"],
    heartNotes: ["Vanilla", "Jasmine", "Cinnamon"],
    baseNotes: ["Tonka Bean", "Amber", "Sandalwood"],
    longevity: "8–10 hours",
    sillage: "Strong",
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
    reviews: 91,
    stock50ml: 48,
    stock100ml: 30,
  },
  {
    id: "09",
    slug: "ovessa",
    name: "ORVÉSSA",
    family: "Floral Musk",
    topNotes: ["Pear", "Bergamot", "Apple Blossom"],
    heartNotes: ["Peony", "Rose", "Jasmine"],
    baseNotes: ["White Musk", "Vanilla", "Cashmere Wood"],
    longevity: "7–9 hours",
    sillage: "Moderate",
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
    reviews: 44,
    stock50ml: 55,
    stock100ml: 40,
  },
  {
    id: "10",
    slug: "vendris",
    name: "VÉNDRIS",
    family: "Oud Amber",
    topNotes: ["Saffron", "Cardamom", "Bergamot"],
    heartNotes: ["Oud", "Rose", "Amber"],
    baseNotes: ["Leather", "Patchouli", "Sandalwood"],
    longevity: "10–12 hours",
    sillage: "Very Strong",
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
    reviews: 156,
    stock50ml: 20,
    stock100ml: 10,
  },
  {
    id: "11",
    slug: "alverion",
    name: "ALVÉRION",
    family: "Citrus Aromatic",
    topNotes: ["Lemon", "Bergamot", "Grapefruit"],
    heartNotes: ["Lavender", "Neroli", "Sage"],
    baseNotes: ["Cedar", "Musk", "Vetiver"],
    longevity: "6–8 hours",
    sillage: "Moderate",
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
    reviews: 62,
    stock50ml: 65,
    stock100ml: 50,
  },
  {
    id: "12",
    slug: "soverane",
    name: "SOVÉRANE",
    family: "Signature Amber",
    topNotes: ["Bergamot", "Saffron", "Black Pepper"],
    heartNotes: ["Jasmine", "Orris", "Rose"],
    baseNotes: ["Amber", "Oud", "Vanilla", "Musk"],
    longevity: "10–12 hours",
    sillage: "Very Strong",
    description: "The signature expression of SOHO — a sophisticated amber composition created to become your unmistakable presence.",
    price50ml: 7500,
    price100ml: 12000,
    bottleColor: "#3B0D18",
    bottleCapColor: "#D6B98C",
    liquidColor: "#7A1A28",
    bgAccent: "#3B0D18",
    image: "https://images.unsplash.com/photo-1600086586698-368d69f00d6e?w=600&h=800&fit=crop&auto=format",
    gender: "unisex",
    tags: ["Amber", "Oud"],
    isBestSeller: true,
    isNewArrival: false,
    rating: 5.0,
    reviews: 208,
    stock50ml: 18,
    stock100ml: 8,
  },
];

// Hydrate products from localStorage cache if available immediately
try {
  const cached = localStorage.getItem("soho_cached_products");
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed) && parsed.length > 0) {
      products.length = 0;
      products.push(...parsed);
    }
  }
} catch (_) {}

// Dynamic REST API loader
export async function fetchProducts(): Promise<Product[]> {
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const res = await fetch(`${apiBase}/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        products.length = 0;
        products.push(...data);
        try {
          localStorage.setItem("soho_cached_products", JSON.stringify(data));
        } catch (_) {}
        return data;
      }
    }
  } catch (err) {
    console.error("Error loading products from REST API", err);
  }
  return products;
}

// Initial background load
fetchProducts();

export async function saveStoredProducts(newProducts: Product[]) {
  // Update local memory reference
  products.length = 0;
  products.push(...newProducts);
  try {
    localStorage.setItem("soho_cached_products", JSON.stringify(newProducts));
  } catch (_) {}
}

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug || p.id === slug);

export const formatPKR = (amount: number) =>
  `₨${amount.toLocaleString("en-PK")}`;

