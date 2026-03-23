import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPassword } from "../lib/auth";
import Shell from "./Shell";

export default function AdminLogin() {
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
      <div style={{ maxWidth: 440, margin: "40px auto" }}>
        <div className="panel fade-in">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 850 }}>Admin</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Inicia sesión para administrar
            </div>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="form-label">Email</label>
              <input
                className="field"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <input
                className="field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {err && (
              <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 650, padding: "8px 12px", background: "#fef2f2", borderRadius: "var(--radius-sm)" }}>
                {err}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "12px", fontSize: 14 }}
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
