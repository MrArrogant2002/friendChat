@echo off
REM Environment Setup Script for Windows
REM This script helps validate and set up environment variables for development

echo.
echo ====================================
echo  FriendChat Environment Setup
echo ====================================
echo.

REM Check frontend .env
echo Step 1: Checking environment files...
echo.

if exist ".env" (
    echo [OK] Found: .env
    echo     Frontend environment already configured
) else (
    echo [!] Missing: .env
    echo     Creating frontend .env from template...
    
    if exist ".env.example" (
        REM Get local IP using PowerShell
        for /f "tokens=*" %%i in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue).IPAddress"') do set LOCAL_IP=%%i
        
        if "%LOCAL_IP%"=="" (
            for /f "tokens=*" %%i in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet' -ErrorAction SilentlyContinue).IPAddress"') do set LOCAL_IP=%%i
        )
        
        if "%LOCAL_IP%"=="" set LOCAL_IP=localhost
        
        echo # Expo environment variables > .env
        echo # Generated on %date% %time% >> .env
        echo. >> .env
        echo # For local development (same WiFi) >> .env
        echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:3000/api >> .env
        echo EXPO_PUBLIC_SOCKET_URL=ws://%LOCAL_IP%:3000 >> .env
        echo EXPO_PUBLIC_API_TIMEOUT=15000 >> .env
        echo. >> .env
        echo # For ngrok (uncomment and update with your ngrok URL) >> .env
        echo # EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app/api >> .env
        echo # EXPO_PUBLIC_SOCKET_URL=wss://your-ngrok-url.ngrok-free.app >> .env
        
        echo [OK] Created .env with local IP: %LOCAL_IP%
        echo [i] Update with ngrok URL if testing remotely
    ) else (
        echo [X] .env.example not found
    )
)

echo.

REM Check backend .env
if exist "server\.env" (
    echo [OK] Found: server\.env
    echo     Backend environment already configured
) else (
    echo [!] Missing: server\.env
    echo     Creating backend .env from template...
    
    if exist "server\.env.example" (
        REM Generate JWT secret using PowerShell
        for /f "tokens=*" %%i in ('powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))"') do set JWT_SECRET=%%i
        
        echo # Backend environment configuration > server\.env
        echo # Generated on %date% %time% >> server\.env
        echo # IMPORTANT: Update these values before using in production! >> server\.env
        echo. >> server\.env
        echo PORT=3000 >> server\.env
        echo MONGO_URI=mongodb://localhost:27017/friendly-chart >> server\.env
        echo JWT_SECRET=%JWT_SECRET% >> server\.env
        echo CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME >> server\.env
        echo. >> server\.env
        echo # MongoDB Atlas example: >> server\.env
        echo # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true^&w=majority >> server\.env
        echo. >> server\.env
        echo # Get Cloudinary credentials from: https://cloudinary.com/console >> server\.env
        
        echo [OK] Created server\.env with generated JWT secret
        echo [i] Update MONGO_URI and CLOUDINARY_URL with your credentials
    ) else (
        echo [X] server\.env.example not found
    )
)

echo.
echo Step 2: Checking dependencies...
echo.

if exist "node_modules\" (
    echo [OK] Frontend dependencies installed
) else (
    echo [!] Frontend dependencies not installed
    echo     Run: npm install (or pnpm install)
)

if exist "server\node_modules\" (
    echo [OK] Backend dependencies installed
) else (
    echo [!] Backend dependencies not installed
    echo     Run: cd server ^&^& npm install
)

echo.
echo Step 3: Environment validation...
echo.

if exist ".env" (
    findstr /C:"localhost" .env >nul
    if %errorlevel%==0 (
        echo [!] Frontend .env uses localhost (won't work on physical devices)
        echo     Update with your local IP or ngrok URL
    ) else (
        findstr /C:"ngrok" .env >nul
        if %errorlevel%==0 (
            echo [OK] Frontend .env configured for ngrok
        ) else (
            echo [OK] Frontend .env configured for network access
        )
    )
)

if exist "server\.env" (
    findstr /C:"mongodb://localhost" server\.env >nul
    if %errorlevel%==0 (
        echo [!] Backend uses local MongoDB (ensure MongoDB is running)
    ) else (
        findstr /C:"mongodb+srv" server\.env >nul
        if %errorlevel%==0 (
            echo [OK] Backend configured for MongoDB Atlas
        )
    )
    
    findstr /C:"CHANGE_ME" server\.env >nul
    if %errorlevel%==0 (
        echo [!] Backend has placeholder values
        echo     Update JWT_SECRET and CLOUDINARY_URL
    )
)

echo.
echo ====================================
echo  Next Steps
echo ====================================
echo.
echo 1. Update environment variables:
echo    - Edit .env with your network setup
echo    - Edit server\.env with MongoDB and Cloudinary credentials
echo.
echo 2. Start the backend:
echo    cd server ^&^& npm run dev
echo.
echo 3. Start the frontend (new terminal):
echo    npm start
echo.
echo 4. For remote testing with ngrok:
echo    ngrok http 3000
echo    Then update .env with the ngrok URL
echo.
echo Documentation:
echo    - docs\DEPLOYMENT.md - Full deployment guide
echo    - docs\NGROK_WORKFLOW.md - ngrok setup and usage
echo.
echo [OK] Setup complete!
echo.
pause
