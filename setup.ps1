# CodeFamily - One-Command Setup
# Run this script to install all dependencies

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "CodeFamily Platform Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if PEM file exists
$pemPath = "secrets\codefamily.pem"
if (-Not (Test-Path $pemPath)) {
    Write-Host "ERROR: PEM file not found!" -ForegroundColor Red
    Write-Host "Please place your GitHub App private key at: $pemPath" -ForegroundColor Yellow
    Write-Host "See PEM_REQUIRED.md for instructions" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ PEM file found" -ForegroundColor Green
Write-Host ""

# Backend
Write-Host "Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend\src\Api
dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend restore failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Set-Location ..\..\..

Write-Host ""

# Sidecar
Write-Host "Installing Sidecar Dependencies..." -ForegroundColor Yellow
Set-Location sidecar
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Sidecar install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Sidecar dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""

# Frontend
Write-Host "Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the system, open 3 terminals and run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "  cd backend\src\Api" -ForegroundColor White
Write-Host "  dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Sidecar):" -ForegroundColor Cyan
Write-Host "  cd sidecar" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 3 (Frontend):" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:5173 in your browser" -ForegroundColor Green
Write-Host ""
Write-Host "See FINAL_SETUP.md for detailed instructions" -ForegroundColor Yellow
