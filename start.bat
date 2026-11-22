@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
title COM-PMS - College of Medicine Patient Management System
echo ==============================================================
echo   Starting College of Medicine Patient Management System
echo   COM-PMS with Auto-Provisioned MongoDB & React Frontend
echo ==============================================================
cd /d "%~dp0\server"
node dist/index.js
pause
