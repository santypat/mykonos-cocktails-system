# 🍹 MYKONOS COCKTAILS - Sistema de Administración

## 📋 Descripción

Sistema completo de gestión para local de granizados en cóctel con estética **neon moderna** y funcionalidad completa para administración y ventas.

### ✨ Características Principales

#### Panel Administrativo
- 📊 Dashboard con métricas en tiempo real
- 💰 Gestión de ventas y reportes detallados
- 📦 Control de inventario con alertas de stock
- 💵 Registro de movimientos de caja (efectivo/transferencia)
- 🛍️ Administración de productos con imágenes
- 🥤 Sistema de preparaciones conectado al inventario
- 👥 Gestión de usuarios (vendedores y administradores)
- 📈 Reportes analíticos (diario, semanal, mensual, anual)

#### Panel de Vendedor
- ⏰ Sistema de turnos (inicio/fin)
- 🛒 Interfaz táctil para tomar pedidos
- 💳 Selección de método de pago
- 🧾 Generación de facturas con impresión
- 📱 Diseño responsive para tablets y pantallas táctiles

---

## 🏗️ Arquitectura Técnica

### Backend
- **Framework**: Node.js + Express
- **Base de datos**: MongoDB
- **Autenticación**: JWT (JSON Web Tokens)
- **Manejo de archivos**: Multer (imágenes de productos)

### Frontend
- **Framework**: React 18 + Vite
- **Estilos**: Tailwind CSS con tema neon personalizado
- **Estado**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Notificaciones**: React Hot Toast
- **Fechas**: date-fns

---

## 📁 Estructura del Proyecto

```
mykonos-system/
├── backend/
│   ├── models/          # Modelos de MongoDB
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Sale.js
│   │   ├── Inventory.js
│   │   ├── Movement.js
│   │   └── Shift.js
│   ├── routes/          # Rutas de la API
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── sales.js
│   │   ├── inventory.js
│   │   ├── movements.js
│   │   ├── users.js
│   │   ├── shifts.js
│   │   └── reports.js
│   ├── middleware/      # Middleware de autenticación
│   │   └── auth.js
│   ├── uploads/         # Imágenes de productos
│   ├── server.js        # Servidor principal
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/  # Componentes reutilizables
    │   │   └── AdminLayout.jsx
    │   ├── pages/       # Páginas principales
    │   │   ├── Login.jsx
    │   │   ├── SellerPanel.jsx
    │   │   └── admin/
    │   │       ├── Dashboard.jsx
    │   │       ├── Products.jsx
    │   │       ├── Inventory.jsx
    │   │       ├── Sales.jsx
    │   │       ├── Movements.jsx
    │   │       ├── Users.jsx
    │   │       └── Reports.jsx
    │   ├── store/       # Estado global (Zustand)
    │   │   └── authStore.js
    │   ├── utils/       # Utilidades
    │   │   └── api.js
    │   ├── App.jsx      # Componente principal
    │   ├── main.jsx     # Punto de entrada
    │   └── index.css    # Estilos globales
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Instalación Local (Desarrollo)

### Requisitos Previos
- Node.js 18+ ([Descargar](https://nodejs.org/))
- MongoDB 6+ ([Descargar](https://www.mongodb.com/try/download/community))
- Git

### Paso 1: Clonar/Descargar el Proyecto

Si tienes el proyecto en un repositorio:
```bash
git clone <tu-repositorio>
cd mykonos-system
```

### Paso 2: Configurar el Backend

```bash
# Ir a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env

# Editar .env con tus configuraciones
# Puedes usar nano, vim, o cualquier editor de texto
nano .env
```

**Contenido del archivo `.env`:**
```env
# MongoDB (Local)
MONGODB_URI=mongodb://localhost:27017/mykonos-db

# JWT
JWT_SECRET=mykonos_secret_key_2024_CAMBIA_ESTO_EN_PRODUCCION
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Paso 3: Iniciar MongoDB

**En Windows:**
```bash
# Si instalaste MongoDB como servicio, ya debería estar corriendo
# Verifica con:
net start MongoDB
```

**En macOS/Linux:**
```bash
# Iniciar MongoDB
mongod --dbpath /path/to/data/directory

# O si usas Homebrew (macOS):
brew services start mongodb-community
```

### Paso 4: Iniciar el Backend

```bash
# Desde la carpeta backend/
npm run dev

# Deberías ver:
# ✅ MongoDB conectado exitosamente
# 🚀 Servidor corriendo en puerto 5000
```

### Paso 5: Crear Usuario Administrador Inicial

Abre tu navegador y visita:
```
http://localhost:5000/api/auth/init-admin
```

Esto creará el usuario administrador inicial:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Paso 6: Configurar el Frontend

Abre una **nueva terminal** y:

```bash
# Ir a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev

# Deberías ver:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Paso 7: Acceder al Sistema

Abre tu navegador en:
```
http://localhost:5173
```

**Credenciales iniciales:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## 🌐 Despliegue en Producción

### Opción 1: Despliegue con Render.com + MongoDB Atlas (RECOMENDADO - GRATIS)

#### A. Configurar MongoDB Atlas (Base de Datos)

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster gratuito (M0)
3. Crear un usuario de base de datos
4. Whitelist todas las IPs (0.0.0.0/0) para Render
5. Obtener la cadena de conexión:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/mykonos-db
   ```

#### B. Desplegar Backend en Render

1. Crear cuenta en [Render.com](https://render.com)
2. Nuevo **Web Service**
3. Conectar tu repositorio de GitHub
4. Configuración:
   - **Name**: mykonos-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. Variables de entorno en Render:
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/mykonos-db
   JWT_SECRET=tu_secreto_super_seguro_aqui_123456789
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://tu-frontend.onrender.com
   PORT=5000
   ```

6. Deploy! 🚀

7. Obtén tu URL (ej: `https://mykonos-backend.onrender.com`)

8. Crear admin inicial visitando:
   ```
   https://mykonos-backend.onrender.com/api/auth/init-admin
   ```

#### C. Desplegar Frontend en Render

1. Nuevo **Static Site**
2. Conectar el mismo repositorio
3. Configuración:
   - **Name**: mykonos-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`

4. Variable de entorno:
   ```
   VITE_API_URL=https://mykonos-backend.onrender.com/api
   ```

5. Deploy! 🚀

6. Tu aplicación estará en: `https://mykonos-frontend.onrender.com`

---

### Opción 2: Despliegue con Vercel + Railway

#### A. Backend en Railway

1. Crear cuenta en [Railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Seleccionar la carpeta `backend`
4. Railway detecta Node.js automáticamente
5. Agregar MongoDB:
   - Add Plugin → MongoDB
   - Railway creará la base de datos automáticamente

6. Variables de entorno:
   ```
   JWT_SECRET=tu_secreto_seguro
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://tu-app.vercel.app
   ```

7. Railway genera la URL automáticamente

#### B. Frontend en Vercel

1. Crear cuenta en [Vercel.com](https://vercel.com)
2. Import Project desde GitHub
3. Configurar:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```

5. Deploy! 🚀

---

### Opción 3: VPS (DigitalOcean, AWS, Linode)

#### Requisitos
- Servidor Ubuntu 22.04 LTS
- Dominio (opcional pero recomendado)

#### Instalación

```bash
# Conectar al servidor
ssh root@tu-servidor-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Instalar Nginx
apt install -y nginx

# Instalar PM2 (para mantener Node.js corriendo)
npm install -g pm2

# Clonar proyecto
cd /var/www
git clone <tu-repositorio> mykonos
cd mykonos

# Backend
cd backend
npm install
cp .env.example .env
nano .env  # Editar configuración

# Iniciar con PM2
pm2 start server.js --name mykonos-backend
pm2 save
pm2 startup

# Frontend
cd ../frontend
npm install
npm run build

# Configurar Nginx
nano /etc/nginx/sites-available/mykonos
```

**Contenido de `/etc/nginx/sites-available/mykonos`:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O tu IP

    # Frontend
    location / {
        root /var/www/mykonos/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Imágenes de productos
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}
```

```bash
# Activar sitio
ln -s /etc/nginx/sites-available/mykonos /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Configurar firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# SSL con Let's Encrypt (OPCIONAL pero RECOMENDADO)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

---

## 🔐 Seguridad en Producción

### ⚠️ IMPORTANTE - Antes de ir a producción:

1. **Cambiar credenciales por defecto:**
   ```bash
   # Una vez logueado como admin, crear nuevo usuario admin y eliminar el default
   ```

2. **JWT_SECRET fuerte:**
   ```bash
   # Generar un secreto aleatorio
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Variables de entorno seguras:**
   - Nunca commitear archivos `.env`
   - Usar secretos diferentes para producción

4. **HTTPS obligatorio:**
   - Usar certificados SSL (Let's Encrypt es gratis)

5. **Rate limiting (opcional):**
   ```bash
   npm install express-rate-limit
   ```

---

## 📱 Uso del Sistema

### Para Administradores

1. **Login** → Panel Administrativo
2. **Dashboard**: Vista general del negocio
3. **Productos**: Crear productos con imagen, precio y preparación
4. **Inventario**: Agregar insumos y controlar stock
5. **Preparación**: Conectar productos con insumos
6. **Ventas**: Revisar historial de ventas
7. **Movimientos**: Registrar ingresos/egresos de caja
8. **Usuarios**: Crear vendedores o administradores
9. **Reportes**: Análisis detallado del negocio

### Para Vendedores

1. **Login** → Panel de Ventas
2. **Iniciar Turno**: Registrar entrada
3. **Tomar Pedido**: Seleccionar productos
4. **Método de Pago**: Efectivo o Transferencia
5. **Confirmar Venta**: Generar factura
6. **Imprimir** (próximamente)
7. **Finalizar Turno**: Registrar salida

---

## 🎨 Personalización del Logo

Para cambiar el logo de Mykonos por el tuyo:

1. Reemplaza la imagen en el Login con tu logo
2. Actualiza el componente AdminLayout
3. Cambia los colores neon en `tailwind.config.js` si deseas

---

## 🐛 Solución de Problemas

### Backend no conecta a MongoDB
```bash
# Verificar que MongoDB está corriendo
systemctl status mongod

# Ver logs
journalctl -u mongod
```

### Frontend no se conecta al Backend
- Verificar `VITE_API_URL` en variables de entorno
- Verificar CORS en `backend/server.js`

### Error "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.

---

## 📄 Licencia

MIT License - Libre para uso comercial

---

## 🎯 Próximas Características

- [ ] Integración con impresora de tickets
- [ ] Sistema de facturación electrónica
- [ ] Reportes en PDF
- [ ] Gráficos avanzados de ventas
- [ ] App móvil nativa
- [ ] Sistema de reservas
- [ ] Programa de fidelidad

---

**¡Sistema listo para usar! 🎉**

Desarrollado con ❤️ para Mykonos Cocktails
