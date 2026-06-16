# Deploy gratis: Mykonos Cocktails con Netlify, Render y Supabase

## 1. Supabase

1. Crea un proyecto gratuito en Supabase.
2. Entra a `SQL Editor`.
3. Copia y ejecuta completo el archivo:

```txt
supabase/schema.sql
```

4. Ve a `Project Settings > API` y copia:

```txt
Project URL
service_role key
```

La `service_role key` solo va en Render, nunca en Netlify ni en el frontend.

## 2. Backend en Render

Conecta el repo de GitHub y crea un Web Service.

```txt
Root directory: backend
Build command: npm install
Start command: npm start
```

Variables de entorno:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
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

En Render puedes abrir una Shell del servicio y ejecutar:

```txt
npm run create-admin
```

Eso crea o actualiza el usuario:

```txt
admin / admin123
```

Cambia esa contraseña desde el panel apenas confirmes que todo funciona.

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

Para produccion estable, la mejora recomendada es migrar imagenes a Supabase Storage o Cloudinary Free.

## 6. Checklist

- Ejecutaste `supabase/schema.sql`.
- Render tiene `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Render responde `/api/health`.
- Ejecutaste `npm run create-admin` en Render.
- Netlify tiene `VITE_API_URL` apuntando a Render.
- Login admin entra a `/admin`.
- Usuario vendedor entra a `/seller`.
