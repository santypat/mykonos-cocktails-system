@echo off
title Iniciar MongoDB y Aplicativo

cd /d "%~dp0"

echo ==========================================
echo Iniciando MongoDB en Docker...
echo ==========================================

"C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d mongodb

echo.
echo Esperando que MongoDB inicie...
timeout /t 8 /nobreak >nul

echo.
echo Iniciando aplicativo...
"C:\Program Files\Git\bin\bash.exe" ./start.sh

pause