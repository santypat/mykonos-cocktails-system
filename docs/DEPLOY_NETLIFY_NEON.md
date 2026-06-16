# Deploy gratis: Mykonos Cocktails solo con Netlify + Neon

Esta opcion no usa Render. El frontend y el backend Express corren en Netlify:

- Frontend: React/Vite en Netlify CDN.
- Backend: Express dentro de Netlify Functions.
- Base de datos: Neon PostgreSQL Free.

## 1. Neon PostgreSQL

Ya debes tener un proyecto Neon Free y un `DATABASE_URL`.

Para crear tablas:

```txt
cd backend
npm run apply-schema
```

Para crear admin:

```txt
cd backend
npm run create-admin
```

Admin inicial:

```txt
admin / admin123
```

## 2. Netlify

Conecta el repo:

```txt
santypat/mykonos-cocktails-system
```

Configuracion del sitio:

```txt
Base directory: dejar vacio
Build command: npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build
Publish directory: frontend/dist
Functions directory: netlify/functions
```

El archivo `netlify.toml` en la raiz ya trae esta configuracion.

## 3. Variables en Netlify

Configura en Netlify > Site configuration > Environment variables:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=un_secreto_largo_y_aleatorio
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://mykonos-cocktails.netlify.app
ENABLE_INIT_ADMIN=false
INIT_ADMIN_USERNAME=admin
INIT_ADMIN_PASSWORD=admin123
INIT_ADMIN_NAME=Administrador Principal
VITE_SHOW_DEMO_CREDENTIALS=false
```

No configures `VITE_API_URL` en Netlify. El frontend usara `/api` en el mismo dominio.

## 4. Rutas

```txt
/login
/admin
/seller
/api/health
```

## 5. Imagenes de productos

Las Netlify Functions no tienen almacenamiento permanente para uploads.

Para produccion estable, no subas imagenes desde el panel hasta migrar imagenes a Cloudinary Free o Neon/S3-compatible storage. El resto del sistema funciona bien: usuarios, ventas, inventario, turnos y reportes.
