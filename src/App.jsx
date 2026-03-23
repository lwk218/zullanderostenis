import { useState, useCallback, Component, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Catalog from "./components/Catalog";
import Product from "./components/Product";
import SplashIntro from "./components/SplashIntro";

// Code-split admin routes — not loaded until user visits /admin
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminGate = lazy(() => import("./components/AdminGate"));
const AdminHome = lazy(() => import("./components/AdminHome"));

function AdminFallback() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontWeight: 650 }}>
      Cargando...
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || String(err) };
  }
  componentDidCatch(err) {
    console.error("UI crashed:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <div className="panel" style={{ maxWidth: 600, margin: "40px auto" }}>
            <div style={{ fontWeight: 850, color: "#dc2626", marginBottom: 8 }}>
              Error en la aplicación
            </div>
            <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
              {this.state.message}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
              Abre F12 → Console para más detalles.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const onDone = useCallback(() => setShowIntro(false), []);

  return (
    <ErrorBoundary>
      {showIntro && <SplashIntro onDone={onDone} />}

      <Routes>
        <Route path="/" element={<Navigate to="/catalogo" replace />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/p/:slugOrId" element={<Product />} />
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminGate>
                {(session) => <AdminHome session={session} />}
              </AdminGate>
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/catalogo" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
