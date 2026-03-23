# Zul Landeros Tenis

Catálogo de tenis online para Zul Landeros. Los clientes ven el catálogo público y piden por WhatsApp. No se muestran precios.

## Stack

- **Frontend**: React 19 + Vite 7 + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: GitHub Pages (auto-deploy via GitHub Actions en push a `main`)
- **Dominio**: zullanderostenis.com (Namecheap → GitHub Pages)
- **Repo**: github.com/lwk218/zullanderostenis

## Estructura del proyecto

```
src/
  App.jsx              → Routing + ErrorBoundary + code splitting
  main.jsx             → Entry point (HashRouter)
  index.css            → Todo el diseño (CSS externo)
  components/
    Shell.jsx           → Layout: topbar + drawer + content wrapper
    Catalog.jsx         → Catálogo público con búsqueda/filtros + infinite scroll
    Product.jsx         → Detalle de producto + lightbox
    SplashIntro.jsx     → Animación de entrada (solo GPU: transform + opacity)
    AdminGate.jsx       → Verificación de sesión + admin status
    AdminLogin.jsx      → Login admin
    AdminHome.jsx       → Panel admin: CRUD de productos
  lib/
    supabase.js         → Cliente Supabase (usa anon key de .env.local)
    auth.js             → signIn, signOut, getSession
    storage.js          → Upload de imágenes al bucket "products"
    helpers.js          → Utilidades: parseSizes, canonSegment, orderUrl, etc.
```

## Base de datos (Supabase)

### Tablas
- **products**: id, brand, model, images (array), sizes, segment, color, slug, active, created_at, updated_at, created_by, updated_by
- **admin_users**: user_id, created_at

### RLS (Row Level Security) — ACTIVO
- `products`: lectura pública solo activos, escritura solo admins
- `admin_users`: cada usuario solo lee su propio registro
- `storage.objects` (bucket "products"): upload/delete solo admins

### Admins
Se gestionan solo desde el dashboard de Supabase (tabla admin_users). No hay forma de auto-registrarse como admin desde la app.

## Credenciales

Todo está en `.env` en la raíz del proyecto (NO se sube a git):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — conexión frontend
- `SUPABASE_SERVICE_ROLE_KEY` — acceso total a DB (nunca en frontend)
- `SUPABASE_ACCESS_TOKEN` — Management API (ejecutar SQL, administrar proyecto)
- `GITHUB_TOKEN` — push al repo (cuenta lwk218)
- Variables de Vite en `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Deploy

Push a `main` → GitHub Actions hace build + deploy a GitHub Pages automáticamente.

```bash
# Push con token (el token está en .env)
git remote set-url origin https://lwk218:<GITHUB_TOKEN>@github.com/lwk218/zullanderostenis.git
git push origin main
git remote set-url origin https://github.com/lwk218/zullanderostenis.git
```

Los secrets de Supabase para el build están configurados en GitHub repo settings (Settings → Secrets → Actions): `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Ejecutar SQL en Supabase (via Management API)

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/gkltrdqvourahdcwbdwy/database/query" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "TU SQL AQUÍ"}'
```

## Performance

- **Code splitting**: Admin routes se cargan lazy (no incluidos en bundle principal)
- **Infinite scroll**: Renderiza 40 cards a la vez, carga más con IntersectionObserver
- **LazyImage**: Imágenes solo se descargan al entrar al viewport
- **React.memo**: ProductCard memoizado
- **Pre-parse**: Sizes, colores y texto de búsqueda se procesan al cargar, no en cada filtro
- **Debounced search**: 250ms delay
- **Splash**: Solo transform + opacity (GPU-composited, 60fps en cualquier dispositivo)

## Convenciones

- CSS en `index.css`, no inline styles excepto para valores dinámicos
- Componentes en `src/components/`, utilidades en `src/lib/`
- HashRouter (rutas con #) para compatibilidad con GitHub Pages (hosting estático)
- WhatsApp: 523412401891
- Segmentos: dama, caballero, niño, niña, unisex. "unisex" se incluye al filtrar dama/caballero
- Colores: se usa solo la primera palabra para filtros (ej: "blanco negro" → filtra por "blanco")
