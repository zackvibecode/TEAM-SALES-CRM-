# Salin skill Zaqone ke folder Hermes (jalan sekali selepas install Hermes)
$src = Join-Path $PSScriptRoot "..\hermes\zaqone-crm-monitor"
$dst = Join-Path $env:USERPROFILE ".hermes\skills\zaqone-crm-monitor"
if (Test-Path $src) {
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  Copy-Item -Path (Join-Path $src "*") -Destination $dst -Recurse -Force
  Write-Host "Skill disalin ke $dst"
} else {
  Write-Host "Folder hermes/zaqone-crm-monitor tidak dijumpai dalam repo."
}
