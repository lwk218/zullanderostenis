import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { parseSizes, orderUrl, canonSegment, primaryColor, colorToHex } from "../lib/helpers";
import Shell from "./Shell";

export default function Product() {
  const { slugOrId } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [p, setP] = useState(null);
  const [size, setSize] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const touchStartX = useRef(0);

  const link = useMemo(
    () => `${window.location.origin}${window.location.pathname}#/p/${slugOrId}`,
    [slugOrId]
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErrorMsg("");

      let res = await supabase
        .from("products")
        .select("id, brand, model, images, sizes, slug, active, segment, color")
        .eq("slug", slugOrId)
        .maybeSingle();

      if (!res.data && !res.error) {
        res = await supabase
          .from("products")
          .select("id, brand, model, images, sizes, slug, active, segment, color")
          .eq("id", slugOrId)
          .maybeSingle();
      }

      if (cancel) return;
      if (res.error) {
        setErrorMsg(res.error.message);
        setP(null);
      } else {
        setP(res.data || null);
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [slugOrId]);

  useEffect(() => {
    function onKey(e) {
      if (!modalOpen) return;
      if (e.key === "Escape") setModalOpen(false);
      if (e.key === "ArrowRight") setActiveIndex((x) => x + 1);
      if (e.key === "ArrowLeft") setActiveIndex((x) => x - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  if (loading) {
    return (
      <Shell>
        <div className="panel fade-in" style={{ color: "var(--text-secondary)", fontWeight: 650 }}>
          Cargando...
        </div>
      </Shell>
    );
  }

  if (!p || errorMsg) {
    return (
      <Shell>
        <div className="panel text-danger fade-in">
          Error: {errorMsg || "No encontrado"}
        </div>
      </Shell>
    );
  }

  const images = Array.isArray(p.images) ? p.images : [];
  const sizes = parseSizes(p.sizes);
  const wa = orderUrl({ brand: p.brand, model: p.model, size, link });
  const seg = canonSegment(p.segment);
  const col = primaryColor(p.color);

  const safeLen = Math.max(images.length, 1);
  const safeIndex = ((activeIndex % safeLen) + safeLen) % safeLen;

  function openAt(i) {
    setActiveIndex(i);
    setModalOpen(true);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `${p.brand} ${p.model}`, url: link }).catch(() => {});
    } else {
      navigator.clipboard.writeText(link).then(() => {
        setToastMsg("Enlace copiado");
        setTimeout(() => setToastMsg(""), 2000);
      });
    }
  }

  return (
    <Shell>
      <div className="product-detail fade-in">
        {/* Back link */}
        <Link
          to="/catalogo"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--text-secondary)", marginBottom: 12 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Catálogo
        </Link>

        {/* Hero image */}
        {images[0] && (
          <div className="product-hero" onClick={() => openAt(0)} title="Ampliar imagen">
            <img src={images[0]} alt={`${p.brand} ${p.model}`} />
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="product-thumbs">
            {images.slice(0, 12).map((u, i) => (
              <div
                className={`thumb ${i === 0 ? "active" : ""}`}
                key={u}
                onClick={() => openAt(i)}
              >
                <img src={u} alt={`img ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="product-info">
          <div className="panel">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h1 className="product-name">{p.model}</h1>
                <div className="product-brand">{p.brand}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {seg && <span className="badge badge-pink">{seg}</span>}
                {col && (
                  <span className="badge badge-neutral" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="color-dot" style={{ background: colorToHex(col), width: 10, height: 10 }} />
                    {col}
                  </span>
                )}
              </div>
            </div>

            <div className="spacer" />

            <div style={{ fontWeight: 750, marginBottom: 10 }}>Selecciona tu talla</div>
            {sizes.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`size-btn ${size === s ? "active" : ""}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Sin tallas registradas
              </div>
            )}

            <div className="spacer" />

            <div style={{ display: "flex", gap: 10 }}>
              <a
                className="btn btn-primary"
                href={wa}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, justifyContent: "center", padding: "12px 20px", fontSize: 14 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Pedir por WhatsApp
              </a>
              <button className="btn" onClick={handleShare} title="Compartir">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {modalOpen && (
        <div className="lightbox-overlay" onClick={() => setModalOpen(false)}>
          <div className="lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-top">
              <div className="lightbox-label">{p.brand} &middot; {p.model}</div>
              <button className="lightbox-close" onClick={() => setModalOpen(false)}>
                Cerrar
              </button>
            </div>
            <div
              className="lightbox-body"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const diff = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(diff) > 50) {
                  setActiveIndex((x) => (diff > 0 ? x - 1 : x + 1));
                }
              }}
            >
              {images.length > 1 && (
                <>
                  <button className="nav-arrow nav-arrow-left" onClick={() => setActiveIndex((x) => x - 1)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="nav-arrow nav-arrow-right" onClick={() => setActiveIndex((x) => x + 1)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
              <img className="lightbox-img" src={images[safeIndex]} alt="Zoom" />
            </div>
            {images.length > 1 && (
              <div className="lightbox-counter">
                {safeIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </Shell>
  );
}
