import { useEffect } from "react";

export default function SplashIntro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 1700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash splash-hide">
      <div className="splash-bg" />
      <div className="splash-curtain splash-curtain-left" />
      <div className="splash-curtain splash-curtain-right" />
      <div className="splash-content">
        <div className="splash-title">Zul Landeros</div>
        <div className="splash-line" />
        <div className="splash-sub">Catálogo de Tenis</div>
      </div>
    </div>
  );
}
