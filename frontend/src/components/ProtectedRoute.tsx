import React from "react";
import { Navigate, Outlet } from "react-router";
import { useStore } from "../store/store";

export function UserProtected() {
  const { state } = useStore();
  if (!state.user) {
    const currentPath = window.location.pathname + window.location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }
  if (state.user.role !== "user") {
    if (state.user.role === "superadmin") return <Navigate to="/superadmin" replace />;
    if (state.user.role === "admin") return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}

export function AdminProtected() {
  const { state } = useStore();
  if (!state.user) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }
  if (state.user.role !== "admin") {
    if (state.user.role === "superadmin") return <Navigate to="/superadmin" replace />;
    if (state.user.role === "user") return <Navigate to="/account" replace />;
  }
  return <Outlet />;
}

export function SuperAdminProtected() {
  const { state } = useStore();
  if (!state.user) {
    return <Navigate to="/login?redirect=/superadmin" replace />;
  }
  if (state.user.role !== "superadmin") {
    if (state.user.role === "admin") return <Navigate to="/admin" replace />;
    if (state.user.role === "user") return <Navigate to="/account" replace />;
  }
  return <Outlet />;
}

