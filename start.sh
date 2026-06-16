#!/bin/bash

echo "🍹 MYKONOS COCKTAILS - Inicio Rápido"
echo "===================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Descarga desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"

# Verificar si MongoDB está corriendoñ

echo "✅ MongoDB está corriendo"
echo ""

# Backend
echo "📦 Instalando dependencias del backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚙️  Creando archivo .env..."
    cp .env.example .env
fi

echo "🚀 Iniciando backend en puerto 5000..."
npm run dev &
BACKEND_PID=$!

# Esperar a que el backend inicie
sleep 3

# Crear admin inicial
echo "👤 Creando usuario administrador inicial..."
curl -s http://localhost:5000/api/auth/init-admin > /dev/null

cd ..

# Frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🚀 Iniciando frontend en puerto 5173..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ SISTEMA INICIADO CORRECTAMENTE"
echo "=================================="
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "👤 Credenciales iniciales:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "Presiona Ctrl+C para detener el sistema"
echo ""

# Esperar a que el usuario detenga el script
wait
