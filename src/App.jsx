import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  Component,
  createContext,
  useContext,
} from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { supabase } from "./lib/supabase";
import { getSession, signInWithPassword, signOut } from "./lib/auth";
import { uploadImagesToProductsBucket } from "./lib/storage";

const WHATSAPP_NUMBER = "523412401891";
const CATALOG_LIMIT = 3000;

const FilterCtx = createContext(null);
function useFilters() {
  const ctx = useContext(FilterCtx);
  if (!ctx) throw new Error("FilterCtx missing");
  return ctx;
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
        <div style={{ padding: 16, fontFamily: "system-ui" }}>
          <div
            style={{
              maxWidth: 980,
              margin: "0 auto",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 18,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 900, color: "crimson" }}>Se cayó la UI</div>
            <div style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>
              {this.state.message}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              Abre F12 → Console para ver el stack.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* =========================
   UI (CSS premium)
========================= */
function css() {
  return `
  :root{
    --pink:#ff4da6;
    --pink2:#ff8cc8;
    --metal:#f7fbff;
    --metal2:#dbe7ff;

    --bg:#fff7fb;
    --card:rgba(255,255,255,.90);
    --stroke:rgba(255,255,255,.78);

    --text:#15151a;
    --muted:#5b5b67;

    --radius:22px;
    --shadow: 0 18px 55px rgba(20,20,35,.12);
    --shadow2: 0 12px 34px rgba(20,20,35,.10);

    --btnGrad: linear-gradient(135deg,
      rgba(255,77,166,.22),
      rgba(255,140,200,.14),
      rgba(233,240,255,.42)
    );
    --btnGrad2: linear-gradient(135deg, var(--pink), var(--pink2));
    --mesh:
      radial-gradient(1100px 700px at 18% 0%, rgba(255,140,200,.26), transparent 60%),
      radial-gradient(900px 600px at 92% 6%, rgba(219,231,255,.90), transparent 55%),
      radial-gradient(900px 600px at 55% 110%, rgba(255,77,166,.10), transparent 60%),
      linear-gradient(180deg, var(--bg), #fff);
  }

  *{ box-sizing:border-box; }
  html, body{ height:100%; }
  body{
    margin:0;
    background: var(--mesh);
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    color:var(--text);
  }
  a{ color:inherit; }
  .wrap{ max-width:1120px; margin:0 auto; padding:16px; }

  .glass{
    background:var(--card);
    border:1px solid var(--stroke);
    border-radius:var(--radius);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow);
  }

  .bar{ position:sticky; top:0; z-index:30; padding:12px 0; }
  .barInner{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:10px 12px;
    position:relative;
    overflow:hidden;
  }
  .barInner::before{
    content:"";
    position:absolute; inset:-2px;
    background:
      radial-gradient(900px 320px at 10% 0%, rgba(255,140,200,.40), transparent 55%),
      radial-gradient(900px 320px at 95% 10%, rgba(219,231,255,.92), transparent 55%),
      linear-gradient(135deg, rgba(255,255,255,.35), rgba(255,255,255,0));
    opacity:.75;
    pointer-events:none;
  }
  .barInner > *{ position:relative; z-index:1; }

  .left{ display:flex; align-items:center; gap:10px; }
  .brand{ font-weight:950; letter-spacing:.2px; }

  /* Buttons (todos con degradado) */
  .btn{
    border:0;
    cursor:pointer;
    font-weight:950;
    padding:10px 12px;
    border-radius:18px;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    gap:8px;
    user-select:none;
    background: var(--btnGrad);
    border:1px solid rgba(255,255,255,.85);
    box-shadow: 0 14px 34px rgba(20,20,35,.10);
    transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
  }
  .btn:hover{ transform: translateY(-2px); box-shadow: 0 18px 44px rgba(20,20,35,.14); filter: saturate(1.05); }
  .btn:active{ transform: translateY(0px) scale(.99); }

  .btnP{
    color:#fff;
    background: var(--btnGrad2);
    border:0;
    box-shadow: 0 18px 44px rgba(255,77,166,.22);
  }

  .iconBtn{ width:44px; height:44px; display:grid; place-items:center; padding:0; }

  .panel{ padding:14px; }
  .row{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .muted{ color:var(--muted); font-weight:750; }
  .hr{ height:12px; }
  .danger{ color:crimson; font-weight:900; }

  .fadeIn{ animation: fadeIn .22s ease-out both; }
  @keyframes fadeIn{
    from{ opacity:0; transform: translateY(10px); }
    to{ opacity:1; transform: translateY(0px); }
  }

  .grid{
    display:grid;
    grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
    gap:14px;
  }
  .card{
    text-decoration:none;
    background:rgba(255,255,255,.92);
    border:1px solid rgba(255,255,255,.85);
    border-radius:22px;
    overflow:hidden;
    box-shadow: var(--shadow2);
    transition: transform .18s ease, box-shadow .18s ease;
    position:relative;
  }
  .card::before{
    content:"";
    position:absolute; inset:0;
    background:
      radial-gradient(520px 300px at 10% 0%, rgba(255,140,200,.25), transparent 55%),
      radial-gradient(520px 300px at 95% 0%, rgba(219,231,255,.88), transparent 55%);
    opacity:.55;
    pointer-events:none;
  }
  .card > *{ position:relative; z-index:1; }
  .card:hover{ transform: translateY(-4px); box-shadow: 0 20px 54px rgba(20,20,35,.16); }

  .imgBox{ aspect-ratio:1/1; background:#f6f6fb; overflow:hidden; }
  .img{
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
    transform: scale(1.02);
    transition: transform .38s ease;
  }
  .card:hover .img{ transform: scale(1.07); }

  .meta{ padding:10px 12px 12px; }
  .title{ font-weight:950; font-size:13px; }
  .sub{ font-size:12px; color:var(--muted); font-weight:850; margin-top:2px; }

  .field{
    width:100%;
    padding:11px 12px;
    border-radius:16px;
    border:1px solid rgba(0,0,0,.08);
    background:rgba(255,255,255,.94);
    outline:none;
    transition: box-shadow .15s ease, border-color .15s ease;
  }
  .field:focus{
    border-color: rgba(255,77,166,.45);
    box-shadow: 0 0 0 4px rgba(255,77,166,.10);
  }
  textarea.field{ resize: vertical; }

  .overlay{
    position:fixed; inset:0;
    background: rgba(10,10,16,.46);
    backdrop-filter: blur(8px);
    z-index:60;
    animation: fadeOverlay .16s ease-out both;
  }
  @keyframes fadeOverlay{ from{ opacity:0; } to{ opacity:1; } }

  .drawer{
    position:fixed;
    top:12px; left:12px;
    width:min(372px, calc(100% - 24px));
    z-index:70;
    padding:12px;
    transform-origin: top left;
    animation: popIn .18s ease-out both;
  }
  @keyframes popIn{
    from{ opacity:0; transform: translateY(-6px) scale(.98); }
    to{ opacity:1; transform: translateY(0px) scale(1); }
  }
  .drawerList{ display:grid; gap:10px; margin-top:10px; }
  .drawerLink{
    padding: 12px 12px;
    border-radius: 18px;
    border:1px solid rgba(255,255,255,.90);
    background: rgba(255,255,255,.88);
    text-decoration:none;
    font-weight: 950;
    display:flex;
    justify-content: space-between;
    align-items:center;
  }
  .sectionTitle{
    margin-top:12px;
    font-weight:950;
    font-size:12px;
    letter-spacing:.25px;
    opacity:.82;
  }
  .miniFooter{
    margin-top: 14px;
    font-size: 12px;
    opacity: .55;
    text-align: center;
    user-select:none;
  }

  /* thumbs */
  .thumbs{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
  .thumb{
    width:64px; height:64px; border-radius:18px; overflow:hidden;
    border:1px solid rgba(255,255,255,.92);
    background: rgba(255,255,255,.86);
    box-shadow: 0 10px 24px rgba(20,20,35,.10);
    cursor:pointer;
    transition: transform .12s ease;
  }
  .thumb:hover{ transform: translateY(-1px); }
  .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }

  /* modal */
  .modalOverlay{
    position:fixed; inset:0;
    background: rgba(10,10,16,.60);
    backdrop-filter: blur(10px);
    z-index:90;
    display:grid;
    place-items:center;
    padding:16px;
    animation: fadeOverlay .16s ease-out both;
  }
  .modal{
    width:min(980px, 100%);
    border-radius: 24px;
    overflow:hidden;
    border:1px solid rgba(255,255,255,.22);
    box-shadow: 0 26px 78px rgba(0,0,0,.40);
    background:
      radial-gradient(900px 420px at 20% 0%, rgba(255,140,200,.25), transparent 55%),
      radial-gradient(900px 420px at 90% 0%, rgba(219,231,255,.55), transparent 55%),
      rgba(255,255,255,.08);
    animation: popIn .18s ease-out both;
  }
  .modalTop{
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 10px;
  }
  .modalImg{
    width:100%;
    height:auto;
    display:block;
    max-height: 78vh;
    object-fit: contain;
    background: #0b0b10;
  }
  .chip{
    font-size:12px;
    font-weight:950;
    padding:6px 10px;
    border-radius:999px;
    background: rgba(255,255,255,.78);
    border:1px solid rgba(255,255,255,.86);
  }

  /* splash (abre hacia afuera) */
  .splash{
    position:fixed; inset:0;
    z-index:120;
    display:grid;
    place-items:center;
    pointer-events:none;
  }
  .splashBase{
    position:absolute; inset:0;
    background:
      radial-gradient(1200px 800px at 25% 0%, rgba(255,140,200,.85), transparent 60%),
      radial-gradient(1000px 700px at 92% 10%, rgba(219,231,255,.95), transparent 58%),
      linear-gradient(135deg, rgba(255,77,166,.95), rgba(255,140,200,.85));
  }
  .curtain{
    position:absolute; top:0; bottom:0; width:50%;
    background:
      radial-gradient(900px 600px at 30% 20%, rgba(255,255,255,.20), transparent 55%),
      linear-gradient(135deg, rgba(255,77,166,.95), rgba(255,140,200,.85));
    border: 1px solid rgba(255,255,255,.18);
  }
  .curtain.left{ left:0; animation: openLeft .78s cubic-bezier(.2,.9,.2,1) .62s forwards; }
  .curtain.right{ right:0; animation: openRight .78s cubic-bezier(.2,.9,.2,1) .62s forwards; }
  @keyframes openLeft{ to{ transform: translateX(-102%); opacity:.98; } }
  @keyframes openRight{ to{ transform: translateX(102%); opacity:.98; } }

  .splashText{
    position:relative;
    font-weight: 950;
    letter-spacing: -0.6px;
    font-size: clamp(34px, 6vw, 74px);
    color: rgba(255,255,255,.98);
    text-shadow: 0 18px 55px rgba(0,0,0,.35);
    animation: textIn .42s ease-out .10s both, textOut .40s ease-in .62s both;
    text-align:center;
    padding: 0 14px;
  }
  @keyframes textIn{ from{ opacity:0; transform: translateY(8px) scale(.98);} to{ opacity:1; transform: translateY(0) scale(1);} }
  @keyframes textOut{ to{ opacity:0; transform: translateY(-6px) scale(.98);} }
  .splashHide{ animation: splashHide .22s ease-out 1.40s forwards; }
  @keyframes splashHide{ to{ opacity:0; visibility:hidden; } }

  /* admin list w/ thumb */
  .adminRow{
    display:grid;
    grid-template-columns: 56px 1fr auto;
    gap: 10px;
    align-items:center;
    padding: 10px 10px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.86);
    background: rgba(255,255,255,.78);
    box-shadow: 0 10px 24px rgba(20,20,35,.08);
  }
  .adminThumb{
    width:56px; height:56px; border-radius:18px; overflow:hidden;
    background: #f6f6fb;
    border: 1px solid rgba(255,255,255,.92);
  }
  .adminThumb img{ width:100%; height:100%; object-fit:cover; display:block; }
  .adminMain{ min-width: 0; }
  .adminTopLine{
    font-weight: 950;
    white-space: nowrap;
    overflow:hidden;
    text-overflow: ellipsis;
  }
  .adminSubLine{
    margin-top: 2px;
    font-size: 12px;
    color: var(--muted);
    font-weight: 850;
    white-space: nowrap;
    overflow:hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 640px){
    .grid{ grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .adminRow{ grid-template-columns: 52px 1fr; }
    .adminRow .adminActions{ grid-column: 1 / -1; justify-content:flex-end; }
  }
  `;
}

/* =========================
   Helpers
========================= */
function supportUrl() {
  const lines = [
    "Hola, necesito soporte con la página de Zul Landeros Tenis.",
    "¿Me pueden ayudar por favor?",
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function orderUrl({ brand, model, size, link }) {
  const lines = [
    `¡Hola! Me interesa adquirir el modelo ${model} de la marca ${brand}.`,
    `Talla: ${size || "—"}`,
    `Link: ${link}`,
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function parseSizes(input) {
  if (typeof input !== "string") return [];
  const tokens = input.split(",").map((t) => t.trim()).filter(Boolean);
  const out = [];
  for (const tok of tokens) {
    const m = tok.match(/^(\d+)\s*-\s*(\d+)$/); // solo rangos enteros
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const step = a <= b ? 1 : -1;
      for (let v = a; step === 1 ? v <= b : v >= b; v += step) out.push(String(v));
    } else out.push(tok); // decimales se quedan tal cual (ej 26.5)
  }
  const unique = Array.from(new Set(out));
  unique.sort((x, y) => {
    const ax = Number(x), ay = Number(y);
    const xn = Number.isFinite(ax) && x !== "";
    const yn = Number.isFinite(ay) && y !== "";
    if (xn && yn) return ax - ay;
    if (xn && !yn) return -1;
    if (!xn && yn) return 1;
    return x.localeCompare(y);
  });
  return unique;
}

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

/**
 * SOLO PRIMER COLOR:
 * - "blanco negro" => "blanco"
 * - "blanco, negro" => "blanco"
 * - si buscan "negro", NO debe matchear ese producto
 */
function primaryColor(color) {
  const t = norm(color).replace(/[,]+/g, " ").trim();
  if (!t) return "";
  return t.split(/\s+/)[0] || "";
}

/* =========================
   Splash Intro
========================= */
function SplashIntro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 1550);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash splashHide">
      <div className="splashBase" />
      <div className="curtain left" />
      <div className="curtain right" />
      <div className="splashText">Zul Landeros Tenis</div>
    </div>
  );
}

/* =========================
   Topbar + Drawer (filtros solo aquí)
========================= */
function Topbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const isCatalog = loc.pathname === "/catalogo";

  const { catFilters, setCatFilters, catOptions, resetCatFilters } = useFilters();

  return (
    <div className="bar">
      <div className="wrap">
        <div className="glass barInner">
          <div className="left">
            <button className="btn iconBtn" onClick={() => setOpen(true)} aria-label="Abrir menú" title="Menú">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="brand">Zul Landeros Tenis</div>
          </div>

          <a className="btn btnP" href={supportUrl()} target="_blank" rel="noreferrer">
            Soporte 💬
          </a>
        </div>
      </div>

      {open ? (
        <>
          <div className="overlay" onClick={() => setOpen(false)} />
          <div className="glass drawer">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 950 }}>Menú</div>
              <button className="btn iconBtn" onClick={() => setOpen(false)} aria-label="Cerrar menú">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="drawerList">
              <Link className="drawerLink" to="/catalogo" onClick={() => setOpen(false)}>
                Catálogo <span style={{ opacity: 0.55 }}>⌁</span>
              </Link>
              <a className="drawerLink" href={supportUrl()} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
                Soporte <span style={{ opacity: 0.55 }}>💬</span>
              </a>
            </div>

            {isCatalog ? (
              <>
                <div className="sectionTitle">Buscar / filtrar</div>

                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <input
                    className="field"
                    placeholder="Buscar…"
                    value={catFilters.q}
                    onChange={(e) => setCatFilters((f) => ({ ...f, q: e.target.value }))}
                  />

                  <select className="field" value={catFilters.brand} onChange={(e) => setCatFilters((f) => ({ ...f, brand: e.target.value }))}>
                    <option value="">Marca</option>
                    {catOptions.brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>

                  <select className="field" value={catFilters.segment} onChange={(e) => setCatFilters((f) => ({ ...f, segment: e.target.value }))}>
                    <option value="">Género</option>
                    {catOptions.segments.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <select className="field" value={catFilters.color} onChange={(e) => setCatFilters((f) => ({ ...f, color: e.target.value }))}>
                    <option value="">Color</option>
                    {catOptions.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select className="field" value={catFilters.size} onChange={(e) => setCatFilters((f) => ({ ...f, size: e.target.value }))}>
                    <option value="">Talla</option>
                    {catOptions.sizes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <button className="btn" onClick={resetCatFilters}>Limpiar filtros</button>
                </div>
              </>
            ) : null}

            {/* Admin escondido hasta abajo */}
            <div style={{ marginTop: 14, opacity: 0.35, fontSize: 12, textAlign: "center" }}>—</div>
            <div style={{ marginTop: 8 }}>
              <Link className="drawerLink" to="/admin" onClick={() => setOpen(false)}>
                <span style={{ opacity: 0.28, fontWeight: 950, letterSpacing: ".6px" }}>adm</span>
                <span style={{ opacity: 0.15 }}>•</span>
              </Link>
            </div>

            <div className="miniFooter">© Zul Landeros Tenis 2026</div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Shell({ children }) {
  return (
    <>
      <style>{css()}</style>
      <Topbar />
      <div className="wrap">{children}</div>
    </>
  );
}

/* =========================
   Catálogo (limpio)
========================= */
function Catalogo() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [items, setItems] = useState([]);

  const { catFilters, setCatOptions } = useFilters();

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("products")
        .select("id, brand, model, images, active, slug, created_at, segment, color, sizes")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(CATALOG_LIMIT);

      if (cancel) return;

      if (error) {
        setErrorMsg(error.message);
        setItems([]);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    })();

    return () => { cancel = true; };
  }, []);

  const options = useMemo(() => {
    const brands = new Set();
    const segments = new Set();
    const colors = new Set();
    const sizes = new Set();

    for (const p of items) {
      if (p.brand) brands.add(p.brand);
      if (p.segment) segments.add(p.segment);

      const c1 = primaryColor(p.color);
      if (c1) colors.add(c1);

      for (const s of parseSizes(p.sizes)) sizes.add(s);
    }

    const sortAlpha = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });

    return {
      brands: Array.from(brands).sort(sortAlpha),
      segments: Array.from(segments).sort(sortAlpha),
      colors: Array.from(colors).sort(sortAlpha), // SOLO primera palabra
      sizes: Array.from(sizes).sort((a, b) => Number(a) - Number(b)),
    };
  }, [items]);

  useEffect(() => {
    setCatOptions(options);
  }, [options, setCatOptions]);

  const filtered = useMemo(() => {
    const q = norm(catFilters.q);

    return items.filter((p) => {
      if (catFilters.brand && p.brand !== catFilters.brand) return false;
      if (catFilters.segment && p.segment !== catFilters.segment) return false;

      if (catFilters.color) {
        // SOLO primera palabra de color
        if (primaryColor(p.color) !== catFilters.color) return false;
      }

      if (catFilters.size) {
        const ss = parseSizes(p.sizes);
        if (!ss.includes(catFilters.size)) return false;
      }

      if (q) {
        const hay = `${p.brand || ""} ${p.model || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [items, catFilters]);

  return (
    <Shell>
      <div className="fadeIn">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: "8px 0" }}>Catálogo</h2>
          {!loading && !errorMsg ? (
            <div className="muted" style={{ fontSize: 12 }}>
              {filtered.length} / {items.length}
            </div>
          ) : null}
        </div>

        <div className="muted" style={{ fontSize: 12 }}>
          Abre el menú (☰) para buscar y filtrar.
        </div>

        <div className="hr" />

        {loading ? <div className="glass panel muted">Cargando…</div> : null}
        {errorMsg ? <div className="glass panel danger">Error: {errorMsg}</div> : null}

        <div className="hr" />

        <div className="grid">
          {filtered.map((p) => {
            const cover = Array.isArray(p.images) ? p.images[0] : null;
            const to = p.slug ? `/p/${p.slug}` : `/p/${p.id}`;

            return (
              <Link key={p.id} to={to} className="card">
                <div className="imgBox">
                  {cover ? (
                    <img
                      src={cover}
                      alt={`${p.brand} ${p.model}`}
                      loading="lazy"
                      className="img"
                    />
                  ) : null}
                </div>
                <div className="meta">
                  <div className="title">{p.model}</div>
                  <div className="sub">{p.brand}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {!loading && !errorMsg && filtered.length === 0 ? (
          <div className="glass panel muted" style={{ marginTop: 14 }}>
            Sin resultados.
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

/* =========================
   Producto (zoom modal)
========================= */
function Product() {
  const { slugOrId } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [p, setP] = useState(null);
  const [size, setSize] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  if (loading) return <Shell><div className="glass panel muted fadeIn">Cargando…</div></Shell>;
  if (!p || errorMsg) return <Shell><div className="glass panel danger fadeIn">Error: {errorMsg || "No encontrado"}</div></Shell>;

  const images = Array.isArray(p.images) ? p.images : [];
  const sizes = parseSizes(p.sizes);
  const wa = orderUrl({ brand: p.brand, model: p.model, size, link });

  const safeLen = Math.max(images.length, 1);
  const safeIndex = ((activeIndex % safeLen) + safeLen) % safeLen;

  function openAt(i) {
    setActiveIndex(i);
    setModalOpen(true);
  }

  return (
    <Shell>
      <div className="glass panel fadeIn">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 950 }}>{p.model}</div>
            <div className="muted">{p.brand}</div>
          </div>
          {p.segment ? <div className="chip">{p.segment}</div> : null}
        </div>

        <div className="hr" />

        {images[0] ? (
          <div
            style={{
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,.78)",
              cursor: "zoom-in",
            }}
            onClick={() => openAt(0)}
            title="Click para ampliar"
          >
            <img
              src={images[0]}
              alt={`${p.brand} ${p.model}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        ) : null}

        {images.length > 1 ? (
          <div className="thumbs">
            {images.slice(0, 12).map((u, i) => (
              <div className="thumb" key={u} onClick={() => openAt(i)} title="Ampliar">
                <img src={u} alt={`img ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        ) : null}

        <div className="hr" />

        <div style={{ fontWeight: 950, marginBottom: 8 }}>Selecciona tu talla</div>
        <select className="field" value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="">Selecciona una talla</option>
          {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="hr" />

        <a className="btn btnP" href={wa} target="_blank" rel="noreferrer" style={{ justifyContent: "center", width: "100%" }}>
          Pedir por WhatsApp
        </a>
      </div>

      {modalOpen ? (
        <div className="modalOverlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div className="chip">{p.brand} · {p.model}</div>
              <div className="row">
                <button className="btn" onClick={() => setActiveIndex((x) => x - 1)}>←</button>
                <button className="btn" onClick={() => setActiveIndex((x) => x + 1)}>→</button>
                <button className="btn btnP" onClick={() => setModalOpen(false)}>Cerrar</button>
              </div>
            </div>
            <img className="modalImg" src={images[safeIndex]} alt="Zoom" />
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

/* =========================
   Admin
========================= */
function AdminGate({ children }) {
  const [state, setState] = useState({ loading: true, session: null, isAdmin: false, error: "" });

  useEffect(() => {
    let cancel = false;
    (async () => {
      const session = await getSession();
      if (!session) {
        if (!cancel) setState({ loading: false, session: null, isAdmin: false, error: "" });
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancel) return;

      if (error) setState({ loading: false, session, isAdmin: false, error: error.message });
      else setState({ loading: false, session, isAdmin: !!data, error: "" });
    })();

    return () => { cancel = true; };
  }, []);

  if (state.loading) return <Shell><div className="glass panel muted fadeIn">Cargando sesión…</div></Shell>;
  if (!state.session) return <Navigate to="/admin/login" replace />;
  if (state.error) return <Shell><div className="glass panel danger fadeIn">Error: {state.error}</div></Shell>;
  if (!state.isAdmin) return <Shell><div className="glass panel danger fadeIn">No tienes permiso.</div></Shell>;

  return children(state.session);
}

function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) return setErr(error.message);
    nav("/admin", { replace: true });
  }

  return (
    <Shell>
      <div className="glass panel fadeIn" style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 20, fontWeight: 950 }}>Admin — Login</div>
        <div className="hr" />
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err ? <div className="danger" style={{ fontSize: 13 }}>{err}</div> : null}
          <button className="btn btnP" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </Shell>
  );
}

function AdminHome({ session }) {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const [aq, setAq] = useState("");
  const [abrand, setABrand] = useState("");
  const [aseg, setASeg] = useState("");
  const [acolor, setAColor] = useState("");
  const [asize, setASize] = useState("");

  const emptyForm = useMemo(() => ({
    brand: "",
    model: "",
    segment: "dama",
    color: "",
    sizes: "",
    imagesText: "",
    active: true,
  }), []);

  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, brand, model, segment, color, sizes, images, active, created_at, slug")
      .order("created_at", { ascending: false })
      .limit(3000);
    setItems(data || []);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (cancel) return;
      await load();
    })();
    return () => { cancel = true; };
  }, [load]);

  const adminOptions = useMemo(() => {
    const brands = new Set();
    const segs = new Set();
    const colors = new Set();
    const sizes = new Set();
    for (const p of items) {
      if (p.brand) brands.add(p.brand);
      if (p.segment) segs.add(p.segment);
      const c1 = primaryColor(p.color);
      if (c1) colors.add(c1);
      for (const s of parseSizes(p.sizes)) sizes.add(s);
    }
    const sortAlpha = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });
    return {
      brands: Array.from(brands).sort(sortAlpha),
      segs: Array.from(segs).sort(sortAlpha),
      colors: Array.from(colors).sort(sortAlpha), // SOLO primera palabra
      sizes: Array.from(sizes).sort((a, b) => Number(a) - Number(b)),
    };
  }, [items]);

  const filteredAdmin = useMemo(() => {
    const q = norm(aq);
    return items.filter((p) => {
      if (abrand && p.brand !== abrand) return false;
      if (aseg && p.segment !== aseg) return false;

      if (acolor) {
        if (primaryColor(p.color) !== acolor) return false;
      }

      if (asize) {
        const ss = parseSizes(p.sizes);
        if (!ss.includes(asize)) return false;
      }

      if (q) {
        const hay = `${p.brand || ""} ${p.model || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [items, aq, abrand, aseg, acolor, asize]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function startNew() {
    setEditing(null);
    setUploadErr("");
    setForm(emptyForm);
  }

  function startEdit(item) {
    setEditing(item);
    setUploadErr("");
    setForm({
      brand: item.brand || "",
      model: item.model || "",
      segment: item.segment || "dama",
      color: item.color || "",
      sizes: item.sizes || "",
      imagesText: Array.isArray(item.images) ? item.images.join("\n") : "",
      active: item.active !== false,
    });
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploadErr("");
    setUploading(true);

    try {
      const urls = await uploadImagesToProductsBucket(files);
      setForm((f) => ({
        ...f,
        imagesText: [f.imagesText.trim(), ...urls].filter(Boolean).join("\n"),
      }));
    } catch (err) {
      setUploadErr(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);

    const images = form.imagesText.split("\n").map((s) => s.trim()).filter(Boolean);

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      segment: form.segment,
      color: form.color.trim(), // se guarda completo; filtros usan solo primera palabra
      sizes: form.sizes.trim(),
      images,
      active: !!form.active,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    };

    if (editing?.id) await supabase.from("products").update(payload).eq("id", editing.id);
    else await supabase.from("products").insert({ ...payload, created_by: session.user.id });

    await load();
    startNew();
    setSaving(false);
  }

  async function remove(item) {
    const ok = window.confirm(`¿Eliminar "${item.model}"?`);
    if (!ok) return;
    await supabase.from("products").delete().eq("id", item.id);
    await load();
  }

  async function logout() {
    await signOut();
    nav("/catalogo", { replace: true });
  }

  const previewUrls = useMemo(() => {
    return form.imagesText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  }, [form.imagesText]);

  return (
    <Shell>
      <div className="glass panel fadeIn">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Admin</div>
            <div className="muted" style={{ fontSize: 12 }}>{session.user.email}</div>
          </div>
          <button className="btn" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="hr" />

      <div className="glass panel fadeIn" style={{ maxWidth: 920 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div style={{ fontWeight: 950 }}>{editing ? "Editar producto" : "Nuevo producto"}</div>
          {editing ? <button className="btn" onClick={startNew}>Nuevo</button> : null}
        </div>

        <div className="hr" />

        <form onSubmit={save} style={{ display: "grid", gap: 10 }}>
          <div className="row">
            <input className="field" style={{ flex: 1 }} placeholder="Marca" value={form.brand} onChange={(e) => setField("brand", e.target.value)} required />
            <input className="field" style={{ flex: 2 }} placeholder="Modelo" value={form.model} onChange={(e) => setField("model", e.target.value)} required />
          </div>

          <div className="row">
            <select className="field" style={{ flex: 1 }} value={form.segment} onChange={(e) => setField("segment", e.target.value)}>
              <option value="dama">Dama</option>
              <option value="caballero">Caballero</option>
              <option value="niño">Niño</option>
              <option value="niña">Niña</option>
            </select>
            <input className="field" style={{ flex: 1 }} placeholder="Color (ej: blanco negro / blanco, negro)" value={form.color} onChange={(e) => setField("color", e.target.value)} />
          </div>

          <input className="field" placeholder='Tallas (ej: "12-22, 24, 26.5, 28-30")' value={form.sizes} onChange={(e) => setField("sizes", e.target.value)} />

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="muted" style={{ fontSize: 12 }}>Fotos</div>
            <label className="btn" style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
              {uploading ? "Subiendo..." : "Subir fotos"}
              <input type="file" accept="image/*" multiple onChange={onPickFiles} disabled={uploading} style={{ display: "none" }} />
            </label>
          </div>

          {uploadErr ? <div className="danger" style={{ fontSize: 13 }}>{uploadErr}</div> : null}

          {previewUrls.length ? (
            <div className="thumbs">
              {previewUrls.map((u) => (
                <div className="thumb" key={u} title="Preview">
                  <img src={u} alt="preview" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}

          <textarea className="field" rows={4} placeholder="(auto) URLs generadas" value={form.imagesText} onChange={(e) => setField("imagesText", e.target.value)} />

          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={!!form.active} onChange={(e) => setField("active", e.target.checked)} />
            <span className="muted">Activo</span>
          </label>

          <button className="btn btnP" disabled={saving} style={{ justifyContent: "center" }}>
            {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
          </button>
        </form>
      </div>

      <div className="hr" />

      <div className="glass panel fadeIn">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 950 }}>Buscar / filtrar (Admin)</div>
          <div className="muted" style={{ fontSize: 12 }}>{filteredAdmin.length} / {items.length}</div>
        </div>

        <div className="hr" />

        <div className="row" style={{ alignItems: "stretch" }}>
          <input className="field" style={{ flex: 1, minWidth: 220 }} placeholder="Buscar…" value={aq} onChange={(e) => setAq(e.target.value)} />
          <select className="field" style={{ width: 160 }} value={abrand} onChange={(e) => setABrand(e.target.value)}>
            <option value="">Marca</option>
            {adminOptions.brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="field" style={{ width: 160 }} value={aseg} onChange={(e) => setASeg(e.target.value)}>
            <option value="">Género</option>
            {adminOptions.segs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="field" style={{ width: 160 }} value={acolor} onChange={(e) => setAColor(e.target.value)}>
            <option value="">Color</option>
            {adminOptions.colors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="field" style={{ width: 120 }} value={asize} onChange={(e) => setASize(e.target.value)}>
            <option value="">Talla</option>
            {adminOptions.sizes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn" onClick={() => { setAq(""); setABrand(""); setASeg(""); setAColor(""); setASize(""); }}>
            Limpiar
          </button>
        </div>

        <div className="hr" />

        <div style={{ display: "grid", gap: 10 }}>
          {filteredAdmin.map((it) => {
            const cover = Array.isArray(it.images) ? it.images[0] : null;
            return (
              <div className="adminRow" key={it.id}>
                <div className="adminThumb" title="Foto">
                  {cover ? <img src={cover} alt="thumb" loading="lazy" /> : null}
                </div>

                <div className="adminMain">
                  <div className="adminTopLine">
                    {it.model} <span className="muted">— {it.brand}</span>
                  </div>
                  <div className="adminSubLine">
                    {it.segment || "—"} · {primaryColor(it.color) || "—"} · {it.active ? "activo" : "inactivo"}
                  </div>
                  <div className="adminSubLine">
                    Tallas: {it.sizes || "—"}
                  </div>
                </div>

                <div className="row adminActions" style={{ justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => startEdit(it)}>Editar</button>
                  <button className="btn" onClick={() => remove(it)}>Borrar</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

/* =========================
   App
========================= */
export default function App() {
  const [catFilters, setCatFilters] = useState({
    q: "",
    brand: "",
    segment: "",
    color: "",
    size: "",
  });

  const [catOptions, setCatOptions] = useState({
    brands: [],
    segments: [],
    colors: [],
    sizes: [],
  });

  const resetCatFilters = useCallback(() => {
    setCatFilters({ q: "", brand: "", segment: "", color: "", size: "" });
  }, []);

  const ctxValue = useMemo(() => {
    return { catFilters, setCatFilters, catOptions, setCatOptions, resetCatFilters };
  }, [catFilters, catOptions, resetCatFilters]);

  const [showIntro, setShowIntro] = useState(true);
  const onDone = useCallback(() => setShowIntro(false), []);

  return (
    <ErrorBoundary>
      <FilterCtx.Provider value={ctxValue}>
        <style>{css()}</style>
        {showIntro ? <SplashIntro onDone={onDone} /> : null}

        <Routes>
          {/* Inicio removido: directo a catálogo */}
          <Route path="/" element={<Navigate to="/catalogo" replace />} />

          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/p/:slugOrId" element={<Product />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminGate>
                {(session) => <AdminHome session={session} />}
              </AdminGate>
            }
          />

          <Route path="*" element={<Navigate to="/catalogo" replace />} />
        </Routes>
      </FilterCtx.Provider>
    </ErrorBoundary>
  );
}
