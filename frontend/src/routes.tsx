import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import Root from "./layouts/Root";
import AdminLayout from "./layouts/AdminLayout";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminAdmins from "./pages/superadmin/SuperAdminAdmins";
import SuperAdminRoles from "./pages/superadmin/SuperAdminRoles";
import SuperAdminSecurity from "./pages/superadmin/SuperAdminSecurity";
import SuperAdminAuditLogs from "./pages/superadmin/SuperAdminAuditLogs";
import SuperAdminSettings from "./pages/superadmin/SuperAdminSettings";
import SuperAdminPayments from "./pages/superadmin/SuperAdminPayments";
import SuperAdminShipping from "./pages/superadmin/SuperAdminShipping";
import CategoryPage from "./pages/CategoryPage";
import { UserProtected, AdminProtected, SuperAdminProtected } from "./components/ProtectedRoute";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import Contact from "./pages/Contact";
import TrackOrder from "./pages/TrackOrder";

function MenPage() { return CategoryPage({ category: "men" }); }
function WomenPage() { return CategoryPage({ category: "women" }); }
function UnisexPage() { return CategoryPage({ category: "unisex" }); }
function BestSellersPage() { return CategoryPage({ category: "best-sellers" }); }

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "collection", Component: Collection },
      { path: "men", Component: MenPage },
      { path: "women", Component: WomenPage },
      { path: "unisex", Component: UnisexPage },
      { path: "best-sellers", Component: BestSellersPage },
      { path: "product/:slug", Component: ProductDetail },
      { path: "cart", Component: Cart },
      { path: "about", Component: About },
      { path: "privacy-policy", Component: PrivacyPolicy },
      { path: "terms", Component: TermsConditions },
      { path: "shipping-policy", Component: ShippingPolicy },
      { path: "return-policy", Component: ReturnPolicy },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      {
        element: React.createElement(UserProtected),
        children: [
          { path: "account", Component: Account },
          { path: "checkout", Component: Checkout },
          { path: "contact", Component: Contact },
          { path: "track-order", Component: TrackOrder },
          { path: "wishlist", Component: Wishlist },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/admin",
    element: React.createElement(AdminProtected),
    children: [
      {
        path: "",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "products", Component: AdminProducts },
          { path: "orders", Component: AdminOrders },
          { path: "users", Component: AdminUsers },
          { path: "customers", Component: AdminCustomers },
          { path: "inventory", Component: AdminInventory },
          { path: "reviews", Component: AdminReviews },
          { path: "analytics", Component: AdminAnalytics },
          { path: "*", Component: AdminDashboard },
        ],
      },
    ],
  },
  {
    path: "/superadmin",
    element: React.createElement(SuperAdminProtected),
    children: [
      {
        path: "",
        Component: SuperAdminLayout,
        children: [
          { index: true, Component: SuperAdminDashboard },
          { path: "admins", Component: SuperAdminAdmins },
          { path: "roles", Component: SuperAdminRoles },
          { path: "security", Component: SuperAdminSecurity },
          { path: "audit-logs", Component: SuperAdminAuditLogs },
          { path: "settings", Component: SuperAdminSettings },
          { path: "payments", Component: SuperAdminPayments },
          { path: "shipping", Component: SuperAdminShipping },
          // Re-use store-level admin components inside superadmin view
          { path: "products", Component: AdminProducts },
          { path: "orders", Component: AdminOrders },
          { path: "users", Component: AdminUsers },
          { path: "customers", Component: AdminCustomers },
          { path: "inventory", Component: AdminInventory },
          { path: "reviews", Component: AdminReviews },
          { path: "analytics", Component: AdminAnalytics },
          { path: "*", Component: SuperAdminDashboard },
        ],
      },
    ],
  },
]);
