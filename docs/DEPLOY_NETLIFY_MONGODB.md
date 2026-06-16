# Deploy: Mykonos Cocktails

## 1. Frontend en Netlify

Usa la carpeta `frontend` como base del sitio.

```txt
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

El archivo `frontend/netlify.toml` ya incluye la redireccion SPA para rutas como `/login`, `/seller` y `/admin`.

Variables de entorno en Netlify:

```env
VITE_API_URL=https://TU-BACKEND.onrender.com/api
VITE_SHOW_DEMO_CREDENTIALS=false
```

Tambien puedes publicar por API, igual que Aurum:

```txt
cd frontend
npm run build
$env:NETLIFY_AUTH_TOKEN="tu_token"
$env:NETLIFY_SITE_NAME="mykonos-cocktails"
npm run deploy:netlify
```

## 2. Backend en Render o Railway

Configura un servicio Node.js usando la carpeta `backend`.

```txt
Build command: npm install
Start command: npm start
```

Variables de entorno del backend:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/mykonos-db
JWT_SECRET=un_secreto_largo_y_aleatorio
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://TU-SITIO.netlify.app
ENABLE_INIT_ADMIN=false
```

## 3. MongoDB Atlas

1. Crea un cluster gratuito.
2. Crea un usuario de base de datos.
3. Habilita el acceso de red para el proveedor donde vivira el backend.
4. Copia la URI de conexion en `MONGODB_URI`.

## 4. Crear el primer administrador

En produccion no uses `/api/auth/init-admin`. Crea el admin con `backend/seed.js` en un entorno controlado o habilita temporalmente `ENABLE_INIT_ADMIN=true`, llama el endpoint una sola vez y vuelve a dejarlo en `false`.

## 5. Checklist antes de publicar

- `VITE_API_URL` apunta al backend publico.
- `FRONTEND_URL` apunta al dominio Netlify.
- `JWT_SECRET` no es el valor de ejemplo.
- `ENABLE_INIT_ADMIN=false`.
- El login no muestra credenciales demo.
- `/api/health` responde correctamente.

## 6. Imagenes de productos

Actualmente las imagenes se guardan en `backend/uploads`. En proveedores gratuitos ese almacenamiento puede ser temporal y perderse al redesplegar.

Para produccion estable, usa una de estas opciones:

- Configurar un disco persistente para el backend.
- Migrar imagenes a Cloudinary, S3 o Supabase Storage.
- Subir imagenes fijas junto al proyecto si el catalogo cambia poco.
