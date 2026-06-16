# Deploy gratis: Mykonos Cocktails con Netlify, Render y Neon

## 1. Neon PostgreSQL

1. Crea cuenta en Neon con GitHub: `https://neon.com`.
2. Crea un proyecto gratis llamado `mykonos-cocktails`.
3. Abre el editor SQL.
4. Copia y ejecuta completo:

```txt
supabase/schema.sql
```

El archivo se llama `supabase/schema.sql` porque originalmente se preparo para PostgreSQL/Supabase, pero tambien funciona en Neon.

5. Copia el `DATABASE_URL` de Neon.

## 2. Backend en Render

Conecta el repo de GitHub y crea un Web Service.

```txt
Root directory: backend
Build command: npm install
Start command: npm start
```

Variables de entorno:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
JWT_SECRET=un_secreto_largo_y_aleatorio
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://mykonos-cocktails.netlify.app
ENABLE_INIT_ADMIN=false
INIT_ADMIN_USERNAME=admin
INIT_ADMIN_PASSWORD=admin123
INIT_ADMIN_NAME=Administrador Principal
```

## 3. Crear admin inicial

En Render, abre la Shell del servicio y ejecuta:

```txt
npm run create-admin
```

Eso crea o actualiza:

```txt
admin / admin123
```

Cambia esa contrasena desde el panel cuando todo funcione.

## 4. Frontend en Netlify

Usa la carpeta `frontend` como base del sitio.

```txt
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

Variables de entorno en Netlify:

```env
VITE_API_URL=https://TU-BACKEND.onrender.com/api
VITE_SHOW_DEMO_CREDENTIALS=false
```

El archivo `frontend/netlify.toml` ya incluye redireccion SPA para `/login`, `/seller` y `/admin`.

## 5. Imagenes de productos

Por ahora las imagenes subidas se guardan en `backend/uploads`. En Render gratis ese almacenamiento puede no ser permanente.

Para produccion estable, la mejora recomendada es migrar imagenes a Cloudinary Free.

## 6. Checklist

- Ejecutaste `supabase/schema.sql` en Neon.
- Render tiene `DATABASE_URL`.
- Render responde `/api/health`.
- Ejecutaste `npm run create-admin` en Render.
- Netlify tiene `VITE_API_URL` apuntando a Render.
- Login admin entra a `/admin`.
- Usuario vendedor entra a `/seller`.
