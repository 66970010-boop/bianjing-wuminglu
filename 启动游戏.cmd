@echo off
chcp 65001 >nul
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
 echo 请先安装 Node.js 22 或更高版本：https://nodejs.org/
 pause
 exit /b 1
)
echo 请在浏览器打开 http://localhost:3002
set PORT=3002
node server/index.mjs
pause
