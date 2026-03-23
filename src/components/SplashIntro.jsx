import { useEffect, useState } from "react";

export default function SplashIntro({ onDone }) {
  const [phase, setPhase] = useState("in"); // "in" → "out" → done

  useEffect(() => {
    // Phase 1: content visible for 1s, then exit
    const t1 = setTimeout(() => setPhase("out"), 1000);
    // Phase 2: after exit animation completes, unmount
    const t2 = setTimeout(() => onDone(), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`sp ${phase === "out" ? "sp-out" : ""}`}>
      <div className="sp-bg" />
      <div className="sp-center">
        <div className="sp-brand">Zul Landeros</div>
        <div className="sp-dot-row">
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-dot" />
        </div>
        <div className="sp-sub">Catálogo de Tenis</div>
      </div>
    </div>
  );
}
