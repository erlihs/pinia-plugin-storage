# Development workflow script for Windows PowerShell

Write-Host "Building plugin package..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating demo dependencies..." -ForegroundColor Green
    Set-Location demo
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Running type check..." -ForegroundColor Green
        npm run type-check
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Done! You can now run 'npm run dev' in the demo folder to test your changes." -ForegroundColor Green
        } else {
            Write-Host "Type check failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "Demo dependencies installation failed!" -ForegroundColor Red
    }
    Set-Location ..
} else {
    Write-Host "Plugin build failed!" -ForegroundColor Red
}
