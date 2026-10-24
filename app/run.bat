@echo off
setlocal
cd /d "%~dp0"
set PORT=7788
start "" "http://127.0.0.1:%PORT%/index.html"
echo Livepage Studio: http://127.0.0.1:%PORT%/index.html
python -m http.server %PORT% --bind 127.0.0.1
