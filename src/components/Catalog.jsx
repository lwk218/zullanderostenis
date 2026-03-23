import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  CATALOG_LIMIT,
  parseSizes,
  norm,
  primaryColor,
  canonSegment,
  segmentMatchesFilter,
} from "../lib/helpers";
import Shell from "./Shell";

/* =============================================
   IntersectionObserver LazyImage
   Only loads image when card enters viewport
   ============================================= */
const LazyImage = memo(function LazyImage({ src, alt }) {
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {inView ? (
        <img
          src={src}
          alt={alt}
          width="400"
          height="500"
          decoding="async"
          className={`card-img ${loaded ? "" : "loading"}`}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "#f1f1f5" }} />
      )}
    </div>
  );
});

/* =============================================
   Memoized ProductCard
   ============================================= */
const ProductCard = memo(function ProductCard({ p }) {
  const cover = Array.isArray(p.images) ? p.images[0] : null;
  const to = p.slug ? `/p/${p.slug}` : `/p/${p.id}`;
  const sizes = p._sizes;

  return (
    <Link to={to} className="card">
      <div className="card-img-box">
        {cover && <LazyImage src={cover} alt={`${p.brand} ${p.model}`} />}
      </div>
      <div className="card-body">
        <div className="card-title">{p.model}</div>
        <div className="card-subtitle">{p.brand}</div>
        {sizes.length > 0 && (
          <div className="card-meta">
            {sizes.slice(0, 5).map((s) => (
              <span key={s} className="size-chip">{s}</span>
            ))}
            {sizes.length > 5 && (
              <span className="size-chip">+{sizes.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});

/* =============================================
   BackToTop
   ============================================= */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      className={`back-to-top ${visible ? "visible" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* =============================================
   Debounce hook
   ============================================= */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* =============================================
   Constants
   ============================================= */
const EMPTY_FILTERS = { q: "", brand: "", segment: "", color: "", size: "" };
const PAGE_SIZE = 40;

/* =============================================
   Catalog
   ============================================= */
export default function Catalog() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  const debouncedQ = useDebounce(filters.q, 250);

  // Fetch all products once (276 products = ~30KB JSON, fast)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,brand,model,images,slug,segment,color,sizes")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(CATALOG_LIMIT);
      if (cancel) return;
      if (error) {
        setErrorMsg(error.message);
        setItems([]);
      } else {
        // Pre-parse sizes once to avoid re-parsing on every render
        const processed = (data || []).map((p) => ({
          ...p,
          _sizes: parseSizes(p.sizes),
          _primaryColor: primaryColor(p.color),
          _segment: canonSegment(p.segment),
          _searchText: `${p.brand || ""} ${p.model || ""}`.toLowerCase(),
        }));
        setItems(processed);
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, []);

  // Compute filter options from all items
  const options = useMemo(() => {
    const brands = new Set();
    const segments = new Set();
    const colors = new Set();
    const sizes = new Set();
    for (const p of items) {
      if (p.brand) brands.add(p.brand);
      if (p._segment) segments.add(p._segment);
      if (p._primaryColor) colors.add(p._primaryColor);
      for (const s of p._sizes) sizes.add(s);
    }
    const sortAlpha = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });
    return {
      brands: Array.from(brands).sort(sortAlpha),
      segments: Array.from(segments).sort(sortAlpha),
      colors: Array.from(colors).sort(sortAlpha),
      sizes: Array.from(sizes).sort((a, b) => Number(a) - Number(b)),
    };
  }, [items]);

  // Filter with debounced search
  const filtered = useMemo(() => {
    const q = norm(debouncedQ);
    return items.filter((p) => {
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.segment && !segmentMatchesFilter(p._segment, filters.segment)) return false;
      if (filters.color && p._primaryColor !== filters.color) return false;
      if (filters.size && !p._sizes.includes(filters.size)) return false;
      if (q && !p._searchText.includes(q)) return false;
      return true;
    });
  }, [items, filters.brand, filters.segment, filters.color, filters.size, debouncedQ]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const activeFilters = [];
  if (filters.brand) activeFilters.push({ key: "brand", label: filters.brand });
  if (filters.segment) activeFilters.push({ key: "segment", label: filters.segment });
  if (filters.color) activeFilters.push({ key: "color", label: filters.color });
  if (filters.size) activeFilters.push({ key: "size", label: `Talla ${filters.size}` });
  if (filters.q) activeFilters.push({ key: "q", label: `"${filters.q}"` });

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const drawerFilterUI = (
    <>
      <div className="drawer-section-title">Filtros</div>
      <div style={{ display: "grid", gap: 8 }}>
        <input
          className="field"
          placeholder="Buscar modelo o marca..."
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select className="field" value={filters.brand} onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}>
          <option value="">Todas las marcas</option>
          {options.brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="field" value={filters.segment} onChange={(e) => setFilters((f) => ({ ...f, segment: e.target.value }))}>
          <option value="">Todos los géneros</option>
          {options.segments.filter((s) => s !== "unisex").map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="field" value={filters.color} onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}>
          <option value="">Todos los colores</option>
          {options.colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="field" value={filters.size} onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))}>
          <option value="">Todas las tallas</option>
          {options.sizes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn" onClick={resetFilters}>Limpiar filtros</button>
      </div>
    </>
  );

  return (
    <Shell filterUI={drawerFilterUI}>
      <div className="fade-in">
        {/* Search & Filters */}
        <div className="search-section">
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="field"
              placeholder="Buscar tenis..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>

          <div className="filter-row">
            <select className="field" value={filters.brand} onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}>
              <option value="">Marca</option>
              {options.brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="field" value={filters.segment} onChange={(e) => setFilters((f) => ({ ...f, segment: e.target.value }))}>
              <option value="">Género</option>
              {options.segments.filter((s) => s !== "unisex").map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="field" value={filters.color} onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}>
              <option value="">Color</option>
              {options.colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="field" value={filters.size} onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))}>
              <option value="">Talla</option>
              {options.sizes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {activeFilters.length > 0 && (
            <div className="active-filters">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  className="filter-chip"
                  onClick={() => setFilters((prev) => ({ ...prev, [f.key]: "" }))}
                >
                  {f.label} <span className="x">&times;</span>
                </button>
              ))}
              <button className="filter-chip filter-chip-clear" onClick={resetFilters}>
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && !errorMsg && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 850 }}>Catálogo</h2>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 650 }}>
              {filtered.length} de {items.length}
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img skeleton" />
                <div style={{ padding: "10px 14px" }}>
                  <div className="skeleton-text skeleton" />
                  <div className="skeleton-text skeleton-text-short skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {errorMsg && <div className="panel text-danger">Error: {errorMsg}</div>}

        {/* Product Grid — only renders visibleCount cards */}
        {!loading && (
          <>
            <div className="product-grid">
              {visibleItems.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {visibleCount < filtered.length && (
              <div
                ref={sentinelRef}
                style={{ height: 1, marginTop: 20 }}
                aria-hidden="true"
              />
            )}

            {visibleCount < filtered.length && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
                Mostrando {visibleCount} de {filtered.length}...
              </div>
            )}
          </>
        )}

        {!loading && !errorMsg && filtered.length === 0 && (
          <div className="panel" style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👟</div>
            <div style={{ fontWeight: 700 }}>Sin resultados</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Prueba con otros filtros</div>
          </div>
        )}
      </div>
      <BackToTop />
    </Shell>
  );
}
