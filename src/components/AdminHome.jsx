import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth";
import { uploadImagesToProductsBucket } from "../lib/storage";
import {
  parseSizes,
  norm,
  primaryColor,
  canonSegment,
  segmentMatchesFilter,
} from "../lib/helpers";
import Shell from "./Shell";

export default function AdminHome({ session }) {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  // Admin filters
  const [aq, setAq] = useState("");
  const [abrand, setABrand] = useState("");
  const [aseg, setASeg] = useState("");
  const [acolor, setAColor] = useState("");
  const [asize, setASize] = useState("");

  const emptyForm = useMemo(
    () => ({
      brand: "",
      model: "",
      segment: "unisex",
      color: "",
      sizes: "",
      imagesText: "",
      active: true,
    }),
    []
  );

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
      const seg = canonSegment(p.segment);
      if (seg) segs.add(seg);
      const c1 = primaryColor(p.color);
      if (c1) colors.add(c1);
      for (const s of parseSizes(p.sizes)) sizes.add(s);
    }
    const sortAlpha = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });
    return {
      brands: Array.from(brands).sort(sortAlpha),
      segs: Array.from(segs).sort(sortAlpha),
      colors: Array.from(colors).sort(sortAlpha),
      sizes: Array.from(sizes).sort((a, b) => Number(a) - Number(b)),
    };
  }, [items]);

  const filteredAdmin = useMemo(() => {
    const q = norm(aq);
    return items.filter((p) => {
      if (abrand && p.brand !== abrand) return false;
      if (aseg && !segmentMatchesFilter(p.segment, aseg)) return false;
      if (acolor && primaryColor(p.color) !== acolor) return false;
      if (asize && !parseSizes(p.sizes).includes(asize)) return false;
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
      segment: canonSegment(item.segment) || "unisex",
      color: item.color || "",
      sizes: item.sizes || "",
      imagesText: Array.isArray(item.images) ? item.images.join("\n") : "",
      active: item.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    const images = form.imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      segment: canonSegment(form.segment),
      color: form.color.trim(),
      sizes: form.sizes.trim(),
      images,
      active: !!form.active,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    };

    if (editing?.id) {
      await supabase.from("products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("products").insert({ ...payload, created_by: session.user.id });
    }

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
    return form.imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
  }, [form.imagesText]);

  return (
    <Shell>
      <div className="fade-in">
        {/* Header */}
        <div className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 850, fontSize: 20 }}>Panel Admin</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              {session.user.email}
            </div>
          </div>
          <button className="btn" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Cerrar sesión
          </button>
        </div>

        <div className="spacer" />

        {/* Product form */}
        <div className="panel fade-in" style={{ maxWidth: 920 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {editing ? "Editar producto" : "Nuevo producto"}
            </div>
            {editing && (
              <button className="btn btn-sm" onClick={startNew}>
                + Nuevo
              </button>
            )}
          </div>

          <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
            <div className="form-label">Información</div>
            <div className="form-row">
              <input
                className="field"
                placeholder="Marca"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                required
              />
              <input
                className="field"
                style={{ flex: 2 }}
                placeholder="Modelo"
                value={form.model}
                onChange={(e) => setField("model", e.target.value)}
                required
              />
            </div>

            <div className="form-label">Clasificación</div>
            <div className="form-row">
              <select
                className="field"
                value={form.segment}
                onChange={(e) => setField("segment", e.target.value)}
              >
                <option value="unisex">Unisex</option>
                <option value="dama">Dama</option>
                <option value="caballero">Caballero</option>
                <option value="niño">Niño</option>
                <option value="niña">Niña</option>
              </select>
              <input
                className="field"
                placeholder="Color (ej: blanco negro)"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
              />
            </div>

            <input
              className="field"
              placeholder='Tallas (ej: "12-22, 24, 26.5, 28-30")'
              value={form.sizes}
              onChange={(e) => setField("sizes", e.target.value)}
            />

            <div className="form-label">Fotos</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                {previewUrls.length} imagen{previewUrls.length !== 1 ? "es" : ""}
              </span>
              <label
                className="btn btn-sm"
                style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? "Subiendo..." : "Subir fotos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickFiles}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {uploadErr && (
              <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 650 }}>{uploadErr}</div>
            )}

            {previewUrls.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {previewUrls.map((u) => (
                  <div className="thumb" key={u}>
                    <img src={u} alt="preview" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="field"
              rows={3}
              placeholder="URLs de imágenes (generadas automáticamente)"
              value={form.imagesText}
              onChange={(e) => setField("imagesText", e.target.value)}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!form.active}
                onChange={(e) => setField("active", e.target.checked)}
              />
              <span style={{ fontSize: 13, fontWeight: 650, color: "var(--text-secondary)" }}>
                Producto activo (visible en catálogo)
              </span>
            </label>

            <button className="btn btn-primary" disabled={saving} style={{ width: "100%", padding: 12, fontSize: 14 }}>
              {saving ? "Guardando..." : editing ? "Actualizar producto" : "Crear producto"}
            </button>
          </form>
        </div>

        <div className="spacer" />

        {/* Product list */}
        <div className="panel fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Productos</div>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 650 }}>
              {filteredAdmin.length} / {items.length}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <input
              className="field"
              style={{ flex: 1, minWidth: 180 }}
              placeholder="Buscar..."
              value={aq}
              onChange={(e) => setAq(e.target.value)}
            />
            <select className="field" style={{ width: 140 }} value={abrand} onChange={(e) => setABrand(e.target.value)}>
              <option value="">Marca</option>
              {adminOptions.brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="field" style={{ width: 140 }} value={aseg} onChange={(e) => setASeg(e.target.value)}>
              <option value="">Género</option>
              {adminOptions.segs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="field" style={{ width: 140 }} value={acolor} onChange={(e) => setAColor(e.target.value)}>
              <option value="">Color</option>
              {adminOptions.colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="field" style={{ width: 120 }} value={asize} onChange={(e) => setASize(e.target.value)}>
              <option value="">Talla</option>
              {adminOptions.sizes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              className="btn btn-sm"
              onClick={() => { setAq(""); setABrand(""); setASeg(""); setAColor(""); setASize(""); }}
            >
              Limpiar
            </button>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {filteredAdmin.map((it) => {
              const cover = Array.isArray(it.images) ? it.images[0] : null;
              return (
                <div className="admin-row" key={it.id}>
                  <div className="admin-thumb">
                    {cover && <img src={cover} alt="thumb" loading="lazy" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="admin-name">
                      {it.model} <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>— {it.brand}</span>
                    </div>
                    <div className="admin-detail">
                      {canonSegment(it.segment) || "—"} · {primaryColor(it.color) || "—"} · {it.active ? "activo" : "inactivo"}
                    </div>
                    <div className="admin-detail">Tallas: {it.sizes || "—"}</div>
                  </div>
                  <div className="admin-actions">
                    <button className="btn btn-sm" onClick={() => startEdit(it)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(it)}>Borrar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
}
