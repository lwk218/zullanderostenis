import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getSession } from "../lib/auth";
import Shell from "./Shell";

export default function AdminGate({ children }) {
  const [state, setState] = useState({
    loading: true,
    session: null,
    isAdmin: false,
    error: "",
  });

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

  if (state.loading) {
    return (
      <Shell>
        <div className="panel fade-in" style={{ color: "var(--text-secondary)", fontWeight: 650 }}>
          Verificando sesión...
        </div>
      </Shell>
    );
  }

  if (!state.session) return <Navigate to="/admin/login" replace />;

  if (state.error) {
    return (
      <Shell>
        <div className="panel text-danger fade-in">Error: {state.error}</div>
      </Shell>
    );
  }

  if (!state.isAdmin) {
    return (
      <Shell>
        <div className="panel text-danger fade-in">No tienes permiso de administrador.</div>
      </Shell>
    );
  }

  return children(state.session);
}
