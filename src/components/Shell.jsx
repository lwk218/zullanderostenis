import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supportUrl } from "../lib/helpers";

function Drawer({ open, onClose, isCatalog, filterUI }) {
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div className="drawer-title">Menú</div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="drawer-links">
          <Link className="drawer-link" to="/catalogo" onClick={onClose}>
            Catálogo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a className="drawer-link" href={supportUrl()} target="_blank" rel="noreferrer" onClick={onClose}>
            Soporte WhatsApp
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {isCatalog && filterUI}

        <div style={{ marginTop: 24, opacity: 0.25, fontSize: 11, textAlign: "center" }}>
          <Link to="/admin" onClick={onClose} style={{ opacity: 0.5 }}>
            adm
          </Link>
        </div>

        <div className="drawer-footer">© Zul Landeros Tenis 2026</div>
      </div>
    </>
  );
}

export default function Shell({ children, filterUI }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const isCatalog = loc.pathname === "/catalogo";

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="topbar-inner">
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setOpen(true)}
              aria-label="Menú"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <Link to="/catalogo" className="topbar-brand">
              <span className="topbar-brand-dot" />
              Zul Landeros Tenis
            </Link>

            <div className="topbar-nav">
              <a className="btn btn-primary btn-sm" href={supportUrl()} target="_blank" rel="noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Soporte
              </a>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        isCatalog={isCatalog}
        filterUI={filterUI}
      />

      <div className="wrap page-content">{children}</div>
    </>
  );
}
