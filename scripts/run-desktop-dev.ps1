$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$webDir = Join-Path $repoRoot 'apps\dsa-web'
$desktopDir = Join-Path $repoRoot 'apps\dsa-desktop'

Write-Host 'Starting Vite frontend (HMR) for desktop debugging...'
Push-Location $webDir
if (!(Test-Path 'node_modules')) {
  npm install
}

$viteAlreadyRunning = $false
try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 1
  if ($response.StatusCode -lt 500) {
    $viteAlreadyRunning = $true
  }
} catch {
  $viteAlreadyRunning = $false
}

$viteProcess = $null
if (-not $viteAlreadyRunning) {
  $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
  $npmCmd = if ($npmCommand) { $npmCommand.Source } else { 'npm' }
  $viteProcess = Start-Process -FilePath $npmCmd -ArgumentList 'run','dev' -WorkingDirectory $webDir -PassThru -WindowStyle Minimized
  Write-Host "Vite started (pid=$($viteProcess.Id)). Waiting for http://127.0.0.1:5173 ..."
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      # keep waiting
    }
  }
  if (-not $ready) {
    throw 'Vite did not become ready on http://127.0.0.1:5173'
  }
} else {
  Write-Host 'Vite already running on http://127.0.0.1:5173'
}
Pop-Location

Write-Host 'Starting Electron desktop (dev, Vite HMR)...'
Push-Location $desktopDir
if (!(Test-Path 'node_modules')) {
  npm install
}
$env:DSA_DESKTOP_VITE = '1'
npm run dev
Pop-Location

if ($viteProcess -and -not $viteProcess.HasExited) {
  Write-Host 'Stopping Vite process started by this script...'
  Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
}
