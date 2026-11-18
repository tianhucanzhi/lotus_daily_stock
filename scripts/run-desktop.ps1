$ErrorActionPreference = 'Stop'

Write-Host 'Tip: for daily UI debugging with hot reload, use scripts\run-desktop-dev.ps1 instead.'
Write-Host 'Building React UI (static assets)...'
Push-Location 'apps\dsa-web'
if (!(Test-Path 'node_modules')) {
  npm install
}
npm run build
Pop-Location

Write-Host 'Starting Electron desktop (static assets mode)...'
Push-Location 'apps\dsa-desktop'
if (!(Test-Path 'node_modules')) {
  npm install
}
$env:DSA_DESKTOP_VITE = '0'
npm run dev
Pop-Location
