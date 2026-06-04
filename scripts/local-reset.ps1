# Stop dev servers on common ports and clear Next.js cache (Windows)
$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Stopping listeners on ports 3000-3002..."
foreach ($port in 3000, 3001, 3002) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Start-Sleep -Seconds 1

if (Test-Path .next) {
  Remove-Item -Recurse -Force .next
  Write-Host "Removed .next"
}

Write-Host "Done. Run: npm run dev"
Write-Host "Open: http://localhost:3000"
