# Quick Start - Run All Services
# This script starts all 3 services in parallel

Write-Host "Starting CodeFamily Platform..." -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "Starting Backend (port 5000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend\src\Api; dotnet run"

Start-Sleep -Seconds 2

# Start sidecar
Write-Host "Starting Sidecar (port 3001)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd sidecar; npm run dev"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "✓ All services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "The application will open in your browser automatically" -ForegroundColor Cyan
Write-Host "If not, navigate to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services, close the terminal windows" -ForegroundColor Yellow

# Wait for services to start, then open browser
Start-Sleep -Seconds 10
Start-Process "http://localhost:5173"
